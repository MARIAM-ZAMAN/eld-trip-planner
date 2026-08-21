"""
FMCSA Hours of Service and Project Constants for RouteLog.
Clearly separates Regulatory requirements from Assessment assumptions.
"""

# ==========================================
# 1. DUTY STATUSES (FMCSA 49 CFR § 395.8)
# ==========================================
OFF_DUTY = "OFF_DUTY"
SLEEPER_BERTH = "SLEEPER_BERTH"
DRIVING = "DRIVING"
ON_DUTY = "ON_DUTY"

ALL_DUTY_STATUSES = [OFF_DUTY, SLEEPER_BERTH, DRIVING, ON_DUTY]

# ==========================================
# 2. EVENT TYPES
# ==========================================
EVENT_TRIP_START = "TRIP_START"
EVENT_DRIVING = "DRIVING"
EVENT_PICKUP = "PICKUP"
EVENT_BREAK = "BREAK"
EVENT_FUEL = "FUEL"
EVENT_DAILY_REST = "DAILY_REST"
EVENT_CYCLE_RESTART = "CYCLE_RESTART"
EVENT_DROPOFF = "DROPOFF"
EVENT_TRIP_END = "TRIP_END"

# ==========================================
# 3. REGULATORY CONSTANTS (Property-Carrying)
# ==========================================
# 11-Hour Driving Limit: Maximum driving time after 10 consecutive hours off duty
MAX_DRIVING_MINUTES = 660  # 11 hours

# 14-Hour Driving Window: Driving prohibited after 14th consecutive hour on duty
DRIVING_WINDOW_MINUTES = 840  # 14 hours

# 30-Minute Rest Break: Required after 8 cumulative hours of driving
BREAK_DRIVING_THRESHOLD_MINUTES = 480  # 8 hours
BREAK_MINUTES = 30  # 30 consecutive minutes

# 10-Hour Daily Rest: Reset period for 11h driving and 14h window
LONG_REST_MINUTES = 600  # 10 hours

# 70-Hour / 8-Day Cycle limit
CYCLE_LIMIT_MINUTES = 4200  # 70 hours

# 34-Hour Restart: Reset cycle usage when cycle is exhausted
CYCLE_RESTART_MINUTES = 2040  # 34 hours

# ==========================================
# 4. ASSESSMENT & PROJECT ASSUMPTIONS
# ==========================================
# Assessment explicit: 1 hour for pickup and dropoff (ON_DUTY)
PICKUP_MINUTES = 60
DROPOFF_MINUTES = 60

# Assessment explicit: Fueling at least once every 1,000 miles
MAX_FUEL_INTERVAL_MILES = 1000.0
FUEL_TARGET_MILES = 900.0  # Safety threshold before reaching 1,000 miles

# Project assumption: 30 minutes for fueling (ON_DUTY)
FUEL_MINUTES = 30

# Unit conversions
METERS_PER_MILE = 1609.344
SECONDS_PER_MINUTE = 60.0
MINUTES_PER_DAY = 1440
