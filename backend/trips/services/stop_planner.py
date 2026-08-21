"""
Stop Planner service.
Determines real geographic coordinates along the route polyline for all planned stops
(Fuel, 30-min Breaks, 10-hour Daily Rests, and 34-hour Cycle Restarts).
"""
from typing import Dict, Any, List, Optional
from trips.services.route_geometry import (
    coordinate_at_distance,
    compute_cumulative_distances_miles
)
from trips.services.geocoding import US_STATES


def get_stop_location_info(
    route_coords: List[List[float]],
    cum_distances: List[float],
    distance_along_route_miles: float,
    stop_type: str,
    default_name: str = "En Route"
) -> Dict[str, Any]:
    """
    Computes precise coordinate on the actual route geometry and a clear label.
    """
    coord = coordinate_at_distance(route_coords, distance_along_route_miles, cum_distances)
    
    label_map = {
        "BREAK": "30-Min Rest Break",
        "FUEL": "Fuel & Inspection Stop",
        "DAILY_REST": "10-Hour Mandatory Rest",
        "CYCLE_RESTART": "34-Hour Cycle Restart",
        "PICKUP": "Shipper / Pickup Location",
        "DROPOFF": "Receiver / Dropoff Location",
        "TRIP_START": "Origin / Departure Location",
    }
    
    label = label_map.get(stop_type, "Planned Stop")
    location_text = f"{label} at Mile {round(distance_along_route_miles, 1)}" if default_name == "En Route" else default_name

    return {
        "latitude": round(coord["latitude"], 6),
        "longitude": round(coord["longitude"], 6),
        "label": label,
        "location_text": location_text,
    }
