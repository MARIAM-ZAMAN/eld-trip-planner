"""
Timezone detection and timezone-aware datetime utilities.
Uses timezonefinder for coordinate lookup and zoneinfo for standard US timezones.
"""
from zoneinfo import ZoneInfo
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

_tf_instance = None

def get_timezone_finder():
    global _tf_instance
    if _tf_instance is None:
        try:
            from timezonefinder import TimezoneFinder
            _tf_instance = TimezoneFinder()
        except Exception as e:
            logger.warning(f"Could not initialize TimezoneFinder: {e}")
            _tf_instance = False
    return _tf_instance if _tf_instance is not False else None


def get_timezone_name_for_coordinates(lat: float, lng: float) -> str:
    """
    Lookup IANA timezone string for a latitude/longitude point.
    Defaults to 'America/Chicago' (Central) or 'America/New_York' if lookup fails.
    """
    tf = get_timezone_finder()
    if tf:
        try:
            tz_name = tf.timezone_at(lng=lng, lat=lat)
            if tz_name:
                return tz_name
        except Exception as e:
            logger.warning(f"Timezone lookup error for ({lat}, {lng}): {e}")
    
    # Fallback heuristic based on US longitude approximate boundaries
    if lng < -115:
        return "America/Los_Angeles"
    elif lng < -102:
        return "America/Denver"
    elif lng < -86:
        return "America/Chicago"
    else:
        return "America/New_York"


def get_zoneinfo(tz_name: str) -> ZoneInfo:
    """Return ZoneInfo instance with fallback to America/New_York."""
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return ZoneInfo("America/New_York")


def get_current_time_in_timezone(tz_name: str) -> datetime:
    """
    Return the current local datetime rounded to the nearest minute in the given timezone.
    Used as the departure/planning start time assumption.
    """
    tz = get_zoneinfo(tz_name)
    now = datetime.now(tz)
    # Clean seconds and microseconds
    return now.replace(second=0, microsecond=0)
