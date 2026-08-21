"""
Route geometry utilities: coordinate interpolation, cumulative distance calculation,
and GeoJSON polyline handling.
"""
import math
from typing import List, Tuple, Dict, Any, Optional
from trips.constants import METERS_PER_MILE

def meters_to_miles(meters: float) -> float:
    return meters / METERS_PER_MILE


def miles_to_meters(miles: float) -> float:
    return miles * METERS_PER_MILE


def haversine_distance_miles(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate the great-circle distance between two points on Earth in miles.
    coord: (latitude, longitude)
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 3958.8  # Earth's radius in miles

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def compute_cumulative_distances_miles(coords: List[List[float]]) -> List[float]:
    """
    Given a list of [lng, lat] coordinates (GeoJSON format),
    computes cumulative distance in miles from the origin.
    Returns a list of distances of the same length.
    """
    if not coords:
        return []
    
    cumulative = [0.0]
    total = 0.0
    for i in range(1, len(coords)):
        # GeoJSON is [lng, lat]
        p1 = (coords[i - 1][1], coords[i - 1][0])
        p2 = (coords[i][1], coords[i][0])
        dist = haversine_distance_miles(p1, p2)
        total += dist
        cumulative.append(total)
    return cumulative


def coordinate_at_distance(
    coords: List[List[float]],
    target_distance_miles: float,
    cum_distances: Optional[List[float]] = None
) -> Dict[str, float]:
    """
    Finds or linearly interpolates the [lat, lng] coordinate along the GeoJSON route
    at target_distance_miles.
    coords: List of [lng, lat] (GeoJSON format)
    Returns: {"latitude": float, "longitude": float}
    """
    if not coords:
        return {"latitude": 0.0, "longitude": 0.0}
    if len(coords) == 1 or target_distance_miles <= 0.0:
        return {"latitude": coords[0][1], "longitude": coords[0][0]}

    if cum_distances is None:
        cum_distances = compute_cumulative_distances_miles(coords)

    total_dist = cum_distances[-1]
    if target_distance_miles >= total_dist:
        return {"latitude": coords[-1][1], "longitude": coords[-1][0]}

    # Binary search or scan for the enclosing segment
    for i in range(len(cum_distances) - 1):
        d0 = cum_distances[i]
        d1 = cum_distances[i + 1]
        if d0 <= target_distance_miles <= d1:
            segment_len = d1 - d0
            if segment_len < 1e-9:
                return {"latitude": coords[i][1], "longitude": coords[i][0]}
            
            fraction = (target_distance_miles - d0) / segment_len
            lng0, lat0 = coords[i][0], coords[i][1]
            lng1, lat1 = coords[i + 1][0], coords[i + 1][1]
            
            interp_lat = lat0 + fraction * (lat1 - lat0)
            interp_lng = lng0 + fraction * (lng1 - lng0)
            return {"latitude": interp_lat, "longitude": interp_lng}

    return {"latitude": coords[-1][1], "longitude": coords[-1][0]}


def coordinate_at_ratio(coords: List[List[float]], ratio: float) -> Dict[str, float]:
    """Get coordinate at a given ratio (0.0 to 1.0) along the route."""
    ratio = max(0.0, min(1.0, ratio))
    if not coords:
        return {"latitude": 0.0, "longitude": 0.0}
    cum_distances = compute_cumulative_distances_miles(coords)
    target_dist = ratio * cum_distances[-1]
    return coordinate_at_distance(coords, target_dist, cum_distances)


def compute_bounding_box(coords: List[List[float]]) -> List[float]:
    """
    Compute [min_lng, min_lat, max_lng, max_lat] for a list of [lng, lat] coords.
    """
    if not coords:
        return [-125.0, 24.0, -66.0, 50.0]  # Default USA approximate bbox
    
    lngs = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return [min(lngs), min(lats), max(lngs), max(lats)]
