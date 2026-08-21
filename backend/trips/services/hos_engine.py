"""
FMCSA Hours of Service Regulatory State Machine.
Tracks driver limits in precise minutes according to 49 CFR Part 395.
"""
from typing import Dict, Any, Tuple
from trips.constants import (
    MAX_DRIVING_MINUTES,
    DRIVING_WINDOW_MINUTES,
    BREAK_DRIVING_THRESHOLD_MINUTES,
    BREAK_MINUTES,
    LONG_REST_MINUTES,
    CYCLE_LIMIT_MINUTES,
    CYCLE_RESTART_MINUTES,
    FUEL_MINUTES,
    FUEL_TARGET_MILES,
    MAX_FUEL_INTERVAL_MILES,
    OFF_DUTY,
    SLEEPER_BERTH,
    DRIVING,
    ON_DUTY,
)


class HOSState:
    """Represents the regulatory and operational state of a driver at a specific moment in time."""

    def __init__(self, starting_cycle_hours: float = 0.0):
        # 11-Hour Driving Limit: driving minutes accumulated since last 10h rest
        self.driving_since_long_rest_minutes: float = 0.0
        
        # 14-Hour Duty Window: elapsed time (driving + on-duty + short breaks) since start of duty window
        self.duty_window_elapsed_minutes: float = 0.0
        self.duty_window_active: bool = False
        
        # 30-Minute Break: cumulative driving minutes since last qualifying >=30 min break/rest
        self.driving_since_break_minutes: float = 0.0
        
        # 70-Hour / 8-Day Cycle: cumulative on-duty + driving time in minutes
        self.cycle_used_minutes: float = float(starting_cycle_hours or 0.0) * 60.0
        
        # Fuel tracking in miles
        self.distance_since_fuel_miles: float = 0.0

    def start_duty_window_if_needed(self):
        """Called when any duty status (Driving or On Duty) begins."""
        if not self.duty_window_active:
            self.duty_window_active = True
            self.duty_window_elapsed_minutes = 0.0

    def get_max_allowed_driving_minutes(self) -> Tuple[float, str]:
        """
        Determines the maximum contiguous driving minutes allowable right now
        before the earliest regulatory constraint triggers.
        Returns: (allowed_minutes, limiting_constraint_name)
        """
        self.start_duty_window_if_needed()

        # 1. 11-Hour Driving Limit
        rem_11h = max(0.0, MAX_DRIVING_MINUTES - self.driving_since_long_rest_minutes)

        # 2. 14-Hour Duty Window Limit
        rem_14h = max(0.0, DRIVING_WINDOW_MINUTES - self.duty_window_elapsed_minutes)

        # 3. 30-Minute Break Limit (8 hours cumulative driving)
        rem_break = max(0.0, BREAK_DRIVING_THRESHOLD_MINUTES - self.driving_since_break_minutes)

        # 4. 70-Hour Cycle Limit
        rem_cycle = max(0.0, CYCLE_LIMIT_MINUTES - self.cycle_used_minutes)

        limits = [
            (rem_cycle, "CYCLE_RESTART"),
            (rem_11h, "DAILY_REST"),
            (rem_14h, "DAILY_REST"),
            (rem_break, "BREAK"),
        ]

        # Find smallest remaining limit
        min_limit, reason = min(limits, key=lambda x: x[0])
        return min_limit, reason

    def record_driving(self, duration_minutes: float, distance_miles: float):
        """Update HOS state after driving for duration_minutes and distance_miles."""
        self.start_duty_window_if_needed()
        self.driving_since_long_rest_minutes += duration_minutes
        self.duty_window_elapsed_minutes += duration_minutes
        self.driving_since_break_minutes += duration_minutes
        self.cycle_used_minutes += duration_minutes
        self.distance_since_fuel_miles += distance_miles

    def record_on_duty_activity(self, duration_minutes: float):
        """
        Update HOS state for non-driving ON_DUTY tasks (e.g. Pickup, Dropoff, Fueling).
        Counts toward the 14h window and 70h cycle.
        If >= 30 consecutive minutes, it satisfies the break requirement per FMCSA.
        """
        self.start_duty_window_if_needed()
        self.duty_window_elapsed_minutes += duration_minutes
        self.cycle_used_minutes += duration_minutes
        
        # Qualifying break: >= 30 consecutive minutes of non-driving time satisfies the 30-min break
        if duration_minutes >= BREAK_MINUTES:
            self.driving_since_break_minutes = 0.0

    def record_break(self, duration_minutes: float = BREAK_MINUTES):
        """
        Record dedicated 30-minute rest break (OFF_DUTY).
        Does NOT pause the 14-hour window.
        Does NOT increase 70-hour cycle usage.
        Resets the 30-minute break timer.
        """
        self.duty_window_elapsed_minutes += duration_minutes
        if duration_minutes >= BREAK_MINUTES:
            self.driving_since_break_minutes = 0.0

    def record_long_rest(self, duration_minutes: float = LONG_REST_MINUTES):
        """
        Record 10-hour daily rest (OFF_DUTY / SLEEPER_BERTH).
        Fully resets 11-hour driving limit, 14-hour duty window, and 30-min break timer.
        """
        self.driving_since_long_rest_minutes = 0.0
        self.driving_since_break_minutes = 0.0
        self.duty_window_elapsed_minutes = 0.0
        self.duty_window_active = False

    def record_cycle_restart(self, duration_minutes: float = CYCLE_RESTART_MINUTES):
        """
        Record 34-hour off-duty restart.
        Resets 70-hour cycle to 0.0, resets 11h driving, 14h window, and break timer.
        """
        self.cycle_used_minutes = 0.0
        self.driving_since_long_rest_minutes = 0.0
        self.driving_since_break_minutes = 0.0
        self.duty_window_elapsed_minutes = 0.0
        self.duty_window_active = False

    def record_fuel_stop(self):
        """Record fuel stop: resets distance since fuel."""
        self.distance_since_fuel_miles = 0.0
