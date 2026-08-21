"""
Geocoding service for resolving and validating United States locations.
Queries OpenRouteService / Pelias geocoding API with in-memory caching and fallback.
"""
import logging
import requests
from typing import List, Dict, Any, Optional
from trips.services.provider_manager import provider_manager
from trips.exceptions import GeocodingException

logger = logging.getLogger(__name__)

# In-process cache for resolved geocoding results
_GEOCODE_CACHE: Dict[str, Optional[Dict[str, Any]]] = {}

# US state abbreviation mapping
US_STATES = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC"
}


def _extract_state_code(state_name: Optional[str]) -> str:
    if not state_name:
        return ""
    state_clean = state_name.strip().lower()
    return US_STATES.get(state_clean, state_name[:2].upper())


def _parse_pelias_feature(feature: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Convert an ORS Pelias GeoJSON feature to our standard US location object."""
    geometry = feature.get("geometry", {})
    coordinates = geometry.get("coordinates", [])
    if len(coordinates) < 2:
        return None
    
    lng, lat = float(coordinates[0]), float(coordinates[1])
    props = feature.get("properties", {})
    
    country = props.get("country", "")
    country_a = props.get("country_a", "")
    if country and country != "United States" and country_a != "USA":
        # Reject non-US locations
        return None

    name = props.get("name", "")
    city = props.get("locality") or props.get("county") or name
    region = props.get("region") or props.get("state") or ""
    region_a = props.get("region_a") or _extract_state_code(region)

    label_parts = []
    if name:
        label_parts.append(name)
    elif city:
        label_parts.append(city)
    if region_a:
        label_parts.append(region_a)
    elif region:
        label_parts.append(region)
    label_parts.append("USA")
    
    label = props.get("label") or ", ".join(label_parts)

    return {
        "label": label,
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "city": city,
        "state": region,
        "state_code": region_a,
        "country": "United States",
    }


def _fallback_nominatim_geocode(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Fallback geocoding using OpenStreetMap Nominatim restricted to US."""
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {"User-Agent": "RouteLogELDPlanner/1.0 (Assessment Evaluation Demo)"}
        params = {
            "q": query,
            "format": "json",
            "countrycodes": "us",
            "addressdetails": 1,
            "limit": limit,
        }
        resp = requests.get(url, params=params, headers=headers, timeout=8)
        if resp.status_code != 200:
            return []
        
        results = []
        for item in resp.json():
            addr = item.get("address", {})
            country = addr.get("country", "")
            if country and country != "United States":
                continue

            lat = float(item["lat"])
            lon = float(item["lon"])
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or ""
            state = addr.get("state", "")
            state_code = _extract_state_code(state)

            label = item.get("display_name", "")
            if city and state_code:
                label = f"{city}, {state_code}, USA"

            results.append({
                "label": label,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": city,
                "state": state,
                "state_code": state_code,
                "country": "United States",
            })
        return results
    except Exception as e:
        logger.warning(f"Nominatim fallback geocode error for '{query}': {e}")
        return []


def search_locations(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search US locations for autocomplete suggestions.
    """
    if not query or len(query.strip()) < 2:
        return []

    q_clean = query.strip()
    results = provider_manager.search_locations(q_clean, limit=limit)
    if not results:
        results = _fallback_nominatim_geocode(q_clean, limit=limit)
    return results[:limit]


def resolve_location(query: str) -> Dict[str, Any]:
    """
    Resolve a user-provided location string into a validated US location object.
    Raises GeocodingException if location cannot be resolved.
    """
    if not query or not query.strip():
        raise GeocodingException("Location query cannot be blank.")

    cache_key = query.strip().lower()
    if cache_key in _GEOCODE_CACHE:
        cached = _GEOCODE_CACHE[cache_key]
        if cached:
            return cached
        raise GeocodingException(f"Location '{query}' could not be resolved in the United States.")

    candidates = search_locations(query, limit=3)
    if not candidates:
        _GEOCODE_CACHE[cache_key] = None
        raise GeocodingException(f"Could not find a valid United States location for '{query}'.")

    # Pick the highest ranked candidate
    resolved = candidates[0]
    _GEOCODE_CACHE[cache_key] = resolved
    return resolved
