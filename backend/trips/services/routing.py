"""Provider-neutral truck routing entry point used by trip planning."""
from typing import Any, Dict

from trips.services.provider_manager import provider_manager


def get_truck_route(current_loc: Dict[str, Any], pickup_loc: Dict[str, Any],
                    dropoff_loc: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate one real truck route containing Current -> Pickup -> Dropoff."""
    return provider_manager.calculate_route([current_loc, pickup_loc, dropoff_loc])
