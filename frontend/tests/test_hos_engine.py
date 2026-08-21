"""
Root-level pytest tests for the HOS engine.
Aligned to the new schedule_trip() API.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

import pytest
from trips.hos_engine import schedule_trip
from trips.constants import (
    EVENT_DRIVING, EVENT_PICKUP, EVENT_DROPOFF, EVENT_BREAK,
    EVENT_FUEL, EVENT_DAILY_REST, EVENT_CYCLE_RESTART,
    MAX_DRIVING_MINUTES, BREAK_DRIVING_THRESHOLD_MINUTES,
    PICKUP_MINUTES, DROPOFF_MINUTES, MINUTES_PER_DAY,
    DRIVING, ON_DUTY, OFF_DUTY,
)

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

LOCS = {
    "current": {"label": "A", "latitude": 35.0, "longitude": -95.0, "country": "United States"},
    "pickup":  {"label": "B", "latitude": 35.0, "longitude": -92.5, "country": "United States"},
    "dropoff": {"label": "C", "latitude": 35.0, "longitude": -90.0, "country": "United States"},
}


def make_route(distance_miles, driving_minutes, leg1_fraction=0.3):
    leg1_min = int(driving_minutes * leg1_fraction)
    leg2_min = driving_minutes - leg1_min
    leg1_mi  = distance_miles * leg1_fraction
    leg2_mi  = distance_miles - leg1_mi
    return {
        "distance_miles":      distance_miles,
        "base_driving_minutes": driving_minutes,
        "driving_minutes":     driving_minutes,
        "geometry":            {"coordinates": [[-95.0, 35.0], [-92.5, 35.0], [-90.0, 35.0]]},
        "legs": [
            {"distance_miles": leg1_mi, "duration_minutes": leg1_min},
            {"distance_miles": leg2_mi, "duration_minutes": leg2_min},
        ],
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_short_same_day_trip():
    """Short trip (2.5 h driving) completes in 1 day with correct driving total."""
    plan = schedule_trip(LOCS, make_route(120, 150), 5.0)

    assert len(plan["daily_logs"]) == 1
    assert plan["summary"]["driving_minutes"] == 150
    types = [e["type"] for e in plan["events"]]
    assert EVENT_PICKUP  in types
    assert EVENT_DROPOFF in types


def test_pickup_satisfies_30min_break():
    """
    5 h driving → 1 h pickup (qualifying ≥30 min non-driving) → 4 h driving.
    Pickup resets the break timer, so no separate BREAK event is needed.
    """
    # leg1=5h, leg2=4h, total driving=9h
    plan = schedule_trip(LOCS, make_route(500, 540, leg1_fraction=5 / 9), 0.0)
    types = [e["type"] for e in plan["events"]]
    # No BREAK needed: pickup (60 min) satisfies the 8-h break requirement
    assert EVENT_BREAK not in types, "Pickup should satisfy the break – no BREAK event expected"
    assert plan["summary"]["driving_minutes"] == 540


def test_continuous_driving_triggers_30min_break():
    """
    0.5 h driving → 1 h pickup (resets break) → 8.5 h driving.
    After 8 h of continuous driving in leg 2, a BREAK event is required.
    """
    plan = schedule_trip(LOCS, make_route(450, 540, leg1_fraction=0.5 / 9), 0.0)
    types = [e["type"] for e in plan["events"]]
    assert EVENT_BREAK in types, "Expected a 30-min break after 8 h continuous driving"
    assert plan["summary"]["driving_minutes"] == 540


def test_multi_day_trip_with_10h_reset():
    """
    18 h of driving → must cross the 11-h limit, triggering a 10-h rest.
    Result: ≥ 2 daily logs and at least one DAILY_REST event.
    """
    plan = schedule_trip(LOCS, make_route(1100, 1080), 0.0)
    assert len(plan["daily_logs"]) >= 2
    types = [e["type"] for e in plan["events"]]
    assert EVENT_DAILY_REST in types, "Expected a 10-h daily rest for 18-h drive"


def test_eld_totals_equal_1440_minutes():
    """Every daily ELD log must account for exactly 1440 minutes."""
    plan = schedule_trip(LOCS, make_route(800, 600), 0.0)
    for log in plan["daily_logs"]:
        assert sum(log["totals"].values()) == MINUTES_PER_DAY


def test_no_overlapping_events():
    """Events must be strictly chronological with no time-overlap."""
    plan = schedule_trip(LOCS, make_route(900, 720), 0.0)
    evs = plan["events"]
    for i in range(1, len(evs)):
        assert evs[i]["start_minute"] >= evs[i - 1]["end_minute"], (
            f"Event {evs[i]['id']} overlaps with {evs[i-1]['id']}"
        )


def test_cycle_exhaustion_triggers_restart():
    """Starting with 70 h used → first event must be a 34-h cycle restart."""
    plan = schedule_trip(LOCS, make_route(200, 120), 70.0)
    first = next(e for e in plan["events"] if e["duration_minutes"] > 0)
    assert first["type"] == EVENT_CYCLE_RESTART


if __name__ == "__main__":
    pytest.main([__file__, "-v"])