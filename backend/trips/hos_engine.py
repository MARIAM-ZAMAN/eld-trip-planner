"""
RouteLog HOS Scheduling Engine – Single Source of Truth.

All internal state is tracked in integer minutes.
Implements FMCSA 49 CFR Part 395 rules for property-carrying drivers.

Entry point: schedule_trip(locations, route, cycle_used_hours) -> TripPlan dict
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from trips.constants import (
    OFF_DUTY,
    SLEEPER_BERTH,
    DRIVING,
    ON_DUTY,
    EVENT_DRIVING,
    EVENT_PICKUP,
    EVENT_BREAK,
    EVENT_FUEL,
    EVENT_DAILY_REST,
    EVENT_CYCLE_RESTART,
    EVENT_DROPOFF,
    EVENT_TRIP_END,
    MAX_DRIVING_MINUTES,
    DRIVING_WINDOW_MINUTES,
    BREAK_DRIVING_THRESHOLD_MINUTES,
    BREAK_MINUTES,
    LONG_REST_MINUTES,
    CYCLE_LIMIT_MINUTES,
    CYCLE_RESTART_MINUTES,
    PICKUP_MINUTES,
    DROPOFF_MINUTES,
    FUEL_MINUTES,
    FUEL_TARGET_MILES,
    MINUTES_PER_DAY,
)
from trips.services.route_geometry import (
    compute_cumulative_distances_miles,
    coordinate_at_distance,
)


class SchedulingError(Exception):
    """Raised when the scheduler reaches an unresolvable HOS constraint."""


# ---------------------------------------------------------------------------
# Mutable scheduler state
# ---------------------------------------------------------------------------

class _State:
    """All values in integer minutes unless noted."""

    def __init__(self, cycle_used_minutes: int):
        self.current_time: int = 0
        # 11-hour driving limit – reset by long rest / cycle restart
        self.driving_since_long_rest: int = 0
        # 30-minute break accumulator – reset by any qualifying (≥30 min) non-driving
        self.driving_since_break: int = 0
        # 14-hour duty window – None means no active window
        self.duty_window_start: Optional[int] = None
        # 70-hour / 8-day cycle
        self.cycle_used: int = cycle_used_minutes
        # Fuel distance tracking (float miles)
        self.distance_since_fuel: float = 0.0
        # Route progress
        self.route_elapsed_miles: float = 0.0
        self.route_elapsed_driving_minutes: int = 0

    # ------------------------------------------------------------------ helpers

    def duty_window_remaining(self) -> int:
        """Minutes remaining in the active 14-hour duty window."""
        if self.duty_window_start is None:
            return DRIVING_WINDOW_MINUTES  # full window not yet started
        return max(0, DRIVING_WINDOW_MINUTES - (self.current_time - self.duty_window_start))

    def start_duty_window_if_needed(self) -> None:
        if self.duty_window_start is None:
            self.duty_window_start = self.current_time

    def calculate_next_driving_chunk(self, rem_seg_min: int) -> int:
        """Largest contiguous driving block (minutes) before any constraint fires."""
        rem_11h   = max(0, MAX_DRIVING_MINUTES         - self.driving_since_long_rest)
        rem_break = max(0, BREAK_DRIVING_THRESHOLD_MINUTES - self.driving_since_break)
        rem_14h   = max(0, self.duty_window_remaining())
        rem_cycle = max(0, CYCLE_LIMIT_MINUTES         - self.cycle_used)
        return int(min(rem_seg_min, rem_11h, rem_break, rem_14h, rem_cycle))


# ---------------------------------------------------------------------------
# Event builder
# ---------------------------------------------------------------------------

_LABELS: Dict[str, str] = {
    EVENT_DRIVING:       "Driving",
    EVENT_PICKUP:        "Pickup",
    EVENT_BREAK:         "30-Min Break",
    EVENT_FUEL:          "Fuel Stop",
    EVENT_DAILY_REST:    "10-Hour Rest",
    EVENT_CYCLE_RESTART: "34-Hour Restart",
    EVENT_DROPOFF:       "Drop-off",
    EVENT_TRIP_END:      "Trip Complete",
}


def _build_event(
    counter: List[int],
    state: _State,
    event_type: str,
    duty_status: str,
    duration_minutes: int,
    description: str,
    location_label: Optional[str],
    coord: Optional[Dict[str, float]],
    total_driving_minutes: int,
    distance_miles: float = 0.0,
) -> Dict[str, Any]:
    counter[0] += 1
    return {
        "id": counter[0],
        "type": event_type,
        "duty_status": duty_status,
        "start_minute": state.current_time,
        "end_minute": state.current_time + duration_minutes,
        "duration_minutes": duration_minutes,
        "description": description,
        "location": location_label,
        "coordinate": coord,
        "route_progress": round(
            min(1.0, state.route_elapsed_driving_minutes / max(1, total_driving_minutes)),
            4,
        ),
        "distance_miles": round(distance_miles, 2),
        "label": _LABELS.get(event_type, event_type.replace("_", " ").title()),
    }


# ---------------------------------------------------------------------------
# schedule_trip – main entry point
# ---------------------------------------------------------------------------

def schedule_trip(
    locations: Dict[str, Any],
    route: Dict[str, Any],
    cycle_used_hours: float,
    start_datetime: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Generate a complete HOS-compliant TripPlan.

    Args:
        locations: {
            'current': {'label', 'latitude', 'longitude'},
            'pickup':  {'label', 'latitude', 'longitude'},
            'dropoff': {'label', 'latitude', 'longitude'},
        }
        route: {
            'distance_miles', 'base_driving_minutes' (or 'driving_minutes'),
            'geometry': {'coordinates': [[lng, lat], ...]},
            'legs': [{'distance_miles', 'duration_minutes'}, ...],
        }
        cycle_used_hours: Starting cycle hours used (0.0 – 70.0).
        start_datetime: When the trip begins (UTC). Defaults to now.

    Returns:
        TripPlan dict containing events, stops, daily_logs, summary, cycle,
        routeData, formData, and locations.
    """
    if start_datetime is None:
        start_datetime = datetime.now(timezone.utc)

    # ------------------------------------------------------------------ parse route
    legs = route.get("legs") or []
    geo_coords: List[List[float]] = (route.get("geometry") or {}).get("coordinates") or []
    total_route_miles = float(route.get("distance_miles") or 0)
    total_route_driving_minutes = int(round(
        float(route.get("base_driving_minutes") or route.get("driving_minutes") or 0)
    ))

    if len(legs) >= 2:
        leg1_min = int(round(float(legs[0].get("duration_minutes", 0))))
        leg1_mi  = float(legs[0].get("distance_miles", 0))
        leg2_min = int(round(sum(float(l.get("duration_minutes", 0)) for l in legs[1:])))
        leg2_mi  = sum(float(l.get("distance_miles", 0)) for l in legs[1:])
    elif len(legs) == 1:
        leg1_min = int(round(float(legs[0].get("duration_minutes", 0)) / 2))
        leg1_mi  = float(legs[0].get("distance_miles", 0)) / 2.0
        leg2_min = total_route_driving_minutes - leg1_min
        leg2_mi  = total_route_miles - leg1_mi
    else:
        leg1_min = total_route_driving_minutes // 2
        leg1_mi  = total_route_miles / 2.0
        leg2_min = total_route_driving_minutes - leg1_min
        leg2_mi  = total_route_miles - leg1_mi

    # Precompute cumulative distances for coordinate interpolation
    cum_distances = compute_cumulative_distances_miles(geo_coords) if geo_coords else []

    # ------------------------------------------------------------------ initialise state
    starting_cycle_minutes = int(round(float(cycle_used_hours) * 60))
    state = _State(cycle_used_minutes=starting_cycle_minutes)
    events: List[Dict[str, Any]] = []
    counter = [0]

    # ------------------------------------------------------------------ inner helpers

    def _get_coord() -> Optional[Dict[str, float]]:
        if not geo_coords or not cum_distances:
            return None
        return coordinate_at_distance(geo_coords, state.route_elapsed_miles, cum_distances)

    def _add_event(
        event_type: str,
        duty_status: str,
        duration_minutes: int,
        description: str,
        location_label: Optional[str] = None,
        coord: Optional[Dict[str, float]] = None,
        distance_miles: float = 0.0,
    ) -> Dict[str, Any]:
        ev = _build_event(
            counter, state, event_type, duty_status, duration_minutes,
            description, location_label, coord or _get_coord(),
            total_route_driving_minutes, distance_miles,
        )
        events.append(ev)
        return ev

    # ------------------------------------------------------------------ HOS operations

    def do_cycle_restart() -> None:
        loc = (
            locations["current"]["label"]
            if state.route_elapsed_miles < 1.0
            else "En Route"
        )
        _add_event(
            EVENT_CYCLE_RESTART, SLEEPER_BERTH, CYCLE_RESTART_MINUTES,
            "34-hour sleeper berth cycle restart",
            location_label=loc,
        )
        state.current_time += CYCLE_RESTART_MINUTES
        state.cycle_used = 0
        state.driving_since_long_rest = 0
        state.driving_since_break = 0
        state.duty_window_start = None

    def do_long_rest() -> None:
        loc = (
            locations["current"]["label"]
            if state.route_elapsed_miles < 1.0
            else "En Route"
        )
        _add_event(
            EVENT_DAILY_REST, SLEEPER_BERTH, LONG_REST_MINUTES,
            "10-hour sleeper berth rest",
            location_label=loc,
        )
        state.current_time += LONG_REST_MINUTES
        # Reset 11h driving limit, break timer, and duty window; cycle is NOT reset
        state.driving_since_long_rest = 0
        state.driving_since_break = 0
        state.duty_window_start = None

    def do_break() -> None:
        _add_event(
            EVENT_BREAK, OFF_DUTY, BREAK_MINUTES,
            "30-minute rest break",
            location_label="En Route",
        )
        state.current_time += BREAK_MINUTES
        state.driving_since_break = 0
        # NOTE: 14-hour window continues to run during off-duty breaks (FMCSA rule)
        # NOTE: driving_since_long_rest is NOT reset by a short break

    def do_fuel(satisfies_break: bool = False) -> None:
        _add_event(
            EVENT_FUEL, ON_DUTY, FUEL_MINUTES,
            "Fuel stop (30 min)",
            location_label="En Route",
        )
        state.current_time += FUEL_MINUTES
        state.cycle_used += FUEL_MINUTES        # ON_DUTY counts toward cycle
        state.distance_since_fuel = 0.0
        if satisfies_break:
            # 30-min ON_DUTY fuel stop satisfies the break requirement (FMCSA §395.3)
            state.driving_since_break = 0

    def do_drive(minutes: int, miles: float, location_label: str = "En Route") -> None:
        state.start_duty_window_if_needed()
        _add_event(
            EVENT_DRIVING, DRIVING, minutes,
            f"Driving ({miles:.0f} mi)",
            location_label=location_label,
            distance_miles=miles,
        )
        state.current_time                    += minutes
        state.driving_since_long_rest         += minutes
        state.driving_since_break             += minutes
        state.cycle_used                      += minutes
        state.route_elapsed_miles             += miles
        state.route_elapsed_driving_minutes   += minutes
        state.distance_since_fuel             += miles

    def do_on_duty(
        event_type: str,
        duration_minutes: int,
        location_label: str,
        description: str,
    ) -> None:
        state.start_duty_window_if_needed()
        _add_event(
            event_type, ON_DUTY, duration_minutes,
            description, location_label=location_label,
        )
        state.current_time += duration_minutes
        state.cycle_used   += duration_minutes
        if duration_minutes >= BREAK_MINUTES:
            # Qualifying non-driving interval resets the 30-min break timer
            state.driving_since_break = 0

    # ------------------------------------------------------------------ segment driver

    def drive_segment(seg_minutes: int, seg_miles: float, location_label: str) -> None:
        """Drive a route segment, honouring all HOS rules."""
        remaining_min   = seg_minutes
        remaining_miles = seg_miles
        guard           = 0

        while remaining_min > 0:
            guard += 1
            if guard > 20_000:
                raise SchedulingError("Infinite loop detected in drive_segment")

            mpm = remaining_miles / remaining_min if remaining_min > 0 else 0.0

            # --- Priority 1: cycle exhausted (no on-duty activity allowed) ---
            if state.cycle_used >= CYCLE_LIMIT_MINUTES:
                do_cycle_restart()
                continue

            # --- Priority 2: 11-hour or 14-hour limit hit ---
            if (
                state.driving_since_long_rest >= MAX_DRIVING_MINUTES
                or state.duty_window_remaining() <= 0
            ):
                do_long_rest()
                continue

            # --- Priority 3: 30-minute break required ---
            if state.driving_since_break >= BREAK_DRIVING_THRESHOLD_MINUTES:
                # If fuel is also overdue, combine: fuel satisfies the break
                if state.distance_since_fuel >= FUEL_TARGET_MILES:
                    do_fuel(satisfies_break=True)
                else:
                    do_break()
                continue

            # --- Priority 4: fuel overdue ---
            if state.distance_since_fuel >= FUEL_TARGET_MILES:
                break_also_needed = (
                    state.driving_since_break >= BREAK_DRIVING_THRESHOLD_MINUTES
                )
                do_fuel(satisfies_break=break_also_needed)
                continue

            # --- Duty window starts on first driving ---
            state.start_duty_window_if_needed()

            # --- Calculate next safe chunk ---
            chunk_min = state.calculate_next_driving_chunk(remaining_min)

            if chunk_min <= 0:
                # A constraint is exactly at 0 – force resolution
                if state.driving_since_long_rest >= MAX_DRIVING_MINUTES:
                    do_long_rest()
                elif state.duty_window_remaining() <= 0:
                    do_long_rest()
                elif state.cycle_used >= CYCLE_LIMIT_MINUTES:
                    do_cycle_restart()
                else:
                    do_break()  # break_threshold = 0 edge case
                continue

            # --- Will fuel be needed WITHIN this chunk? ---
            if mpm > 0:
                miles_to_fuel_target = FUEL_TARGET_MILES - state.distance_since_fuel
                if miles_to_fuel_target > 0:
                    minutes_to_fuel = miles_to_fuel_target / mpm
                    if minutes_to_fuel < chunk_min:
                        # Drive until fuel point
                        fuel_drive_min   = max(1, int(minutes_to_fuel))
                        fuel_drive_miles = fuel_drive_min * mpm
                        # Clamp to remaining segment
                        if fuel_drive_min < remaining_min:
                            do_drive(fuel_drive_min, fuel_drive_miles, location_label)
                            remaining_min   -= fuel_drive_min
                            remaining_miles -= fuel_drive_miles
                            # Schedule fuel (may satisfy break if break is now due)
                            break_now = (
                                state.driving_since_break
                                >= BREAK_DRIVING_THRESHOLD_MINUTES
                            )
                            do_fuel(satisfies_break=break_now)
                            continue

            # --- Drive the chunk ---
            chunk_miles = chunk_min * mpm
            do_drive(chunk_min, chunk_miles, location_label)
            remaining_min   -= chunk_min
            remaining_miles -= chunk_miles

    # ------------------------------------------------------------------ main schedule

    # Immediate cycle-restart before any activity when cycle is already exhausted
    if state.cycle_used >= CYCLE_LIMIT_MINUTES:
        do_cycle_restart()

    # Leg 1: current → pickup
    if leg1_min > 0:
        drive_segment(leg1_min, leg1_mi, locations["current"]["label"])

    # Pickup (1-hour ON_DUTY)
    if state.cycle_used + PICKUP_MINUTES > CYCLE_LIMIT_MINUTES:
        do_cycle_restart()
    do_on_duty(
        EVENT_PICKUP, PICKUP_MINUTES,
        locations["pickup"]["label"],
        f"Pickup at {locations['pickup']['label']} (1 hr)",
    )

    # Leg 2: pickup → dropoff
    if leg2_min > 0:
        drive_segment(leg2_min, leg2_mi, "En Route")

    # Dropoff (1-hour ON_DUTY)
    if state.cycle_used + DROPOFF_MINUTES > CYCLE_LIMIT_MINUTES:
        do_cycle_restart()
    do_on_duty(
        EVENT_DROPOFF, DROPOFF_MINUTES,
        locations["dropoff"]["label"],
        f"Drop-off at {locations['dropoff']['label']} (1 hr)",
    )

    # Trip end marker (zero-duration)
    _add_event(
        EVENT_TRIP_END, OFF_DUTY, 0,
        "Trip completed",
        location_label=locations["dropoff"]["label"],
    )

    # ------------------------------------------------------------------ post-process
    _validate_events(events)
    total_trip_minutes = state.current_time
    daily_logs = _build_daily_logs(events, total_trip_minutes, start_datetime, locations)
    stops      = _build_stops(events, start_datetime)

    # ------------------------------------------------------------------ summary
    driving_events         = [e for e in events if e["type"] == EVENT_DRIVING]
    total_driving_minutes  = sum(e["duration_minutes"] for e in driving_events)
    remaining_cycle_minutes = max(0, CYCLE_LIMIT_MINUTES - state.cycle_used)

    return {
        "id":                   str(uuid.uuid4()),
        "calculated_at":        datetime.now(timezone.utc).isoformat(),
        "planning_start_time":  start_datetime.isoformat(),
        "log_timezone":         "UTC",  # overridden by views.py
        "locations":            locations,
        "route":                route,
        "routeData":            _build_route_data(route, locations),
        "cycle": {
            "starting_cycle_hours":    float(cycle_used_hours),
            "starting_cycle_minutes":  starting_cycle_minutes,
            "remaining_cycle_hours":   round(remaining_cycle_minutes / 60, 2),
            "remaining_cycle_minutes": remaining_cycle_minutes,
            "restart_required":        any(e["type"] == EVENT_CYCLE_RESTART for e in events),
        },
        "summary": {
            "total_trip_minutes":  total_trip_minutes,
            # backward-compat alias used by frontend
            "trip_duration_minutes": total_trip_minutes,
            "driving_minutes":     total_driving_minutes,
            "trip_days":           len(daily_logs),
            "fuel_stops":          sum(1 for e in events if e["type"] == EVENT_FUEL),
            "break_stops":         sum(1 for e in events if e["type"] == EVENT_BREAK),
            "rest_stops":          sum(1 for e in events
                                       if e["type"] in (EVENT_DAILY_REST, EVENT_CYCLE_RESTART)),
        },
        "events":    events,
        "stops":     stops,
        "daily_logs": daily_logs,
        "formData": {
            "currentLocation":  locations["current"]["label"],
            "pickupLocation":   locations["pickup"]["label"],
            "dropoffLocation":  locations["dropoff"]["label"],
            "cycleUsed":        float(cycle_used_hours),
            "tripDays":         len(daily_logs),
        },
    }


# ---------------------------------------------------------------------------
# Daily-log builder
# ---------------------------------------------------------------------------

def _build_daily_logs(
    events:             List[Dict[str, Any]],
    total_trip_minutes: int,
    start_datetime:     datetime,
    locations:          Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Slice events into 1440-minute ELD daily logs."""
    num_days = max(1, (total_trip_minutes + MINUTES_PER_DAY - 1) // MINUTES_PER_DAY)
    daily_logs: List[Dict[str, Any]] = []

    for day_idx in range(num_days):
        day_start = day_idx * MINUTES_PER_DAY
        day_end   = day_start + MINUTES_PER_DAY

        raw_segments: List[Dict[str, Any]] = []
        remarks:      List[Dict[str, Any]] = []
        daily_driving_miles = 0.0

        for ev in events:
            ev_s = ev["start_minute"]
            ev_e = ev["end_minute"]

            # Clip to this day window
            seg_s = max(ev_s, day_start)
            seg_e = min(ev_e, day_end)
            if seg_e <= seg_s:
                continue

            local_s  = seg_s - day_start
            local_e  = seg_e - day_start
            duration = seg_e - seg_s

            raw_segments.append({
                "status":           ev["duty_status"],
                "start_minute":     local_s,
                "end_minute":       local_e,
                "duration_minutes": duration,
                "location":         ev.get("location"),
                "description":      ev.get("description", ""),
            })

            # Proportional driving miles for this day
            if ev["type"] == EVENT_DRIVING and ev["duration_minutes"] > 0:
                proportion          = duration / ev["duration_minutes"]
                daily_driving_miles += ev["distance_miles"] * proportion

            # Remark entry for events that *start* on this day (not continuations)
            if day_start <= ev_s < day_end and ev["duration_minutes"] > 0:
                local_ev_s = ev_s - day_start
                remarks.append({
                    "time":        f"{local_ev_s // 60:02d}:{local_ev_s % 60:02d}",
                    "description": ev.get("description", ""),
                    "location":    ev.get("location", ""),
                    "status":      ev.get("duty_status", ""),
                })

        # ---- fill gaps with OFF_DUTY to guarantee 1440-minute coverage ----
        raw_segments.sort(key=lambda s: s["start_minute"])
        filled: List[Dict[str, Any]] = []
        cursor = 0
        for seg in raw_segments:
            if seg["start_minute"] > cursor:
                filled.append({
                    "status":           OFF_DUTY,
                    "start_minute":     cursor,
                    "end_minute":       seg["start_minute"],
                    "duration_minutes": seg["start_minute"] - cursor,
                    "location":         None,
                    "description":      "Off Duty",
                })
            filled.append(seg)
            cursor = seg["end_minute"]
        if cursor < MINUTES_PER_DAY:
            filled.append({
                "status":           OFF_DUTY,
                "start_minute":     cursor,
                "end_minute":       MINUTES_PER_DAY,
                "duration_minutes": MINUTES_PER_DAY - cursor,
                "location":         None,
                "description":      "Off Duty",
            })

        # ---- compute totals ----
        totals = {
            "off_duty_minutes":      0,
            "sleeper_berth_minutes": 0,
            "driving_minutes":       0,
            "on_duty_minutes":       0,
        }
        _status_key = {
            OFF_DUTY:      "off_duty_minutes",
            "SLEEPER_BERTH": "sleeper_berth_minutes",
            DRIVING:       "driving_minutes",
            ON_DUTY:       "on_duty_minutes",
        }
        for seg in filled:
            key = _status_key.get(seg["status"], "off_duty_minutes")
            totals[key] += seg["duration_minutes"]

        log_date = (start_datetime + timedelta(days=day_idx)).date()

        daily_logs.append({
            "day_number":               day_idx + 1,
            "date":                     log_date.isoformat(),
            "from":                     locations["current"]["label"],
            "to":                       locations["dropoff"]["label"],
            "total_miles_driving_today": round(daily_driving_miles, 1),
            "segments":                 filled,
            "duty_periods":             filled,   # backward-compat alias
            "totals":                   totals,
            "remarks":                  remarks,
        })

    return daily_logs


# ---------------------------------------------------------------------------
# Stops list builder (map markers)
# ---------------------------------------------------------------------------

_STOP_TYPES = frozenset({
    EVENT_PICKUP, EVENT_FUEL, EVENT_BREAK,
    EVENT_DAILY_REST, EVENT_CYCLE_RESTART, EVENT_DROPOFF,
})


def _build_stops(
    events:         List[Dict[str, Any]],
    start_datetime: datetime,
) -> List[Dict[str, Any]]:
    """Convert schedule events to stop markers for the map."""
    stops = []
    for ev in events:
        if ev["type"] not in _STOP_TYPES:
            continue
        t_start = start_datetime + timedelta(minutes=ev["start_minute"])
        t_end   = start_datetime + timedelta(minutes=ev["end_minute"])
        stops.append({
            "type":             ev["type"],
            "label":            ev["label"],
            "location":         ev["location"],
            "time":             t_start.isoformat(),
            "start_time":       t_start.isoformat(),
            "end_time":         t_end.isoformat(),
            "duration_minutes": ev["duration_minutes"],
            "durationHours":    ev["duration_minutes"] / 60,
            "startHour":        ev["start_minute"] / 60,
            "coordinate":       ev.get("coordinate"),
            "coords":           ev.get("coordinate"),
            "route_progress":   ev.get("route_progress", 0),
            "distance_miles":   ev.get("distance_miles", 0),
        })
    return stops


# ---------------------------------------------------------------------------
# Route-data helper (for frontend)
# ---------------------------------------------------------------------------

def _build_route_data(
    route:     Dict[str, Any],
    locations: Dict[str, Any],
) -> Dict[str, Any]:
    geometry = route.get("geometry") or {}
    coords   = geometry.get("coordinates") or []
    return {
        "path":            [[c[1], c[0]] for c in coords],   # GeoJSON [lng,lat] → Leaflet [lat,lng]
        "distanceMiles":   route.get("distance_miles", 0),
        "durationMinutes": route.get("base_driving_minutes") or route.get("driving_minutes") or 0,
        "geometry":        geometry,
        "bbox":            route.get("bbox") or route.get("bounds") or [],
        "locations":       locations,
    }


# ---------------------------------------------------------------------------
# Invariant validator
# ---------------------------------------------------------------------------

def _validate_events(events: List[Dict[str, Any]]) -> None:
    """Assert basic HOS invariants on generated events."""
    cursor = 0
    running_driving = 0
    duty_start: Optional[int] = None

    for ev in events:
        if ev["duration_minutes"] < 0:
            raise SchedulingError(f"Event {ev['id']} has negative duration: {ev}")

        if ev["start_minute"] < cursor:
            raise SchedulingError(
                f"Event {ev['id']} starts ({ev['start_minute']}) before "
                f"previous event ended ({cursor})"
            )
        cursor = ev["end_minute"]

        # Track driving accumulation between rests
        if ev["type"] == EVENT_DRIVING:
            running_driving += ev["duration_minutes"]
            if running_driving > MAX_DRIVING_MINUTES + 1:   # +1 for rounding
                raise SchedulingError(
                    f"Driving exceeds 11-hour limit in duty period: "
                    f"{running_driving} min"
                )
        elif ev["type"] in (EVENT_DAILY_REST, EVENT_CYCLE_RESTART):
            running_driving = 0
            duty_start = None

        # Track 14-hour duty window
        if ev["duty_status"] in (DRIVING, ON_DUTY) and duty_start is None:
            duty_start = ev["start_minute"]
        if ev["type"] == EVENT_DRIVING and duty_start is not None:
            window_used = ev["end_minute"] - duty_start
            if window_used > DRIVING_WINDOW_MINUTES + 1:
                raise SchedulingError(
                    f"Driving extends past 14-hour window: {window_used} min used"
                )
