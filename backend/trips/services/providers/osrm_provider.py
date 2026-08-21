from typing import Any, Dict, List, Optional
import requests

from .base import (LocationRoutingProvider, ProviderError, ProviderErrorCategory,
                   normalize_location, valid_coordinate)
from trips.services.route_geometry import compute_bounding_box, meters_to_miles

US_STATES_MAP = {
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
    return US_STATES_MAP.get(state_clean, state_name[:2].upper() if len(state_name) >= 2 else "")


class OSRMProvider(LocationRoutingProvider):
    """
    Public OSRM (Open Source Routing Machine) and Nominatim geocoding provider.
    Serves as reliable, keyless fallback for routing and geocoding.
    """
    name = 'osrm'
    routing_base_url = 'https://router.project-osrm.org/route/v1/driving'
    geocoding_base_url = 'https://nominatim.openstreetmap.org'

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'RouteLogELDPlanner/1.0 (Assessment Evaluation Demo)'
        })

    @property
    def configured(self) -> bool:
        return True

    def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not query or len(query.strip()) < 2:
            return []
        try:
            params = {
                'q': query.strip(),
                'format': 'json',
                'countrycodes': 'us',
                'addressdetails': 1,
                'limit': limit,
            }
            resp = self.session.get(f'{self.geocoding_base_url}/search', params=params, timeout=8)
            if resp.status_code != 200:
                return []
            items = resp.json()
            if not isinstance(items, list):
                return []
            
            results = []
            for item in items:
                addr = item.get('address', {})
                country = addr.get('country', '')
                if country and country != 'United States':
                    continue
                lat = item.get('lat')
                lon = item.get('lon')
                city = addr.get('city') or addr.get('town') or addr.get('village') or addr.get('county') or ''
                state = addr.get('state', '')
                state_code = _extract_state_code(state)
                label = item.get('display_name', '')
                if city and state_code:
                    label = f"{city}, {state_code}, USA"
                results.append(normalize_location(
                    label=label,
                    latitude=lat,
                    longitude=lon,
                    city=city,
                    state=state,
                    state_code=state_code,
                    postal_code=addr.get('postcode'),
                    country='United States',
                    country_code='US'
                ))
            return results[:limit]
        except Exception as exc:
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.PROVIDER_UNAVAILABLE) from exc

    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        try:
            params = {
                'lat': latitude,
                'lon': longitude,
                'format': 'json',
                'addressdetails': 1,
            }
            resp = self.session.get(f'{self.geocoding_base_url}/reverse', params=params, timeout=8)
            if resp.status_code != 200:
                return None
            item = resp.json()
            addr = item.get('address', {})
            city = addr.get('city') or addr.get('town') or addr.get('village') or addr.get('county') or ''
            state = addr.get('state', '')
            state_code = _extract_state_code(state)
            label = item.get('display_name', '')
            if city and state_code:
                label = f"{city}, {state_code}, USA"
            return normalize_location(
                label=label,
                latitude=latitude,
                longitude=longitude,
                city=city,
                state=state,
                state_code=state_code,
                postal_code=addr.get('postcode'),
                country='United States',
                country_code='US'
            )
        except Exception:
            return None

    def calculate_route(self, waypoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        if len(waypoints) < 2 or any(not valid_coordinate(p.get('latitude'), p.get('longitude')) for p in waypoints):
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.INVALID_REQUEST)

        # OSRM coordinate string is lon,lat;lon,lat;...
        coord_str = ';'.join(f"{p['longitude']},{p['latitude']}" for p in waypoints)
        url = f"{self.routing_base_url}/{coord_str}?overview=full&geometries=geojson&steps=true"
        try:
            resp = self.session.get(url, timeout=12)
            if resp.status_code == 404:
                raise ProviderError(self.name, 'routing', ProviderErrorCategory.NO_ROUTE)
            if resp.status_code != 200:
                raise ProviderError(self.name, 'routing', ProviderErrorCategory.PROVIDER_UNAVAILABLE,
                                    f"Status {resp.status_code}")

            data = resp.json()
            if data.get('code') != 'Ok' or not data.get('routes'):
                raise ProviderError(self.name, 'routing', ProviderErrorCategory.NO_ROUTE)

            route = data['routes'][0]
            geometry = route.get('geometry', {})
            coordinates = geometry.get('coordinates', [])
            total_dist_meters = float(route.get('distance', 0))
            total_dur_seconds = float(route.get('duration', 0))

            legs = []
            instructions = []
            for leg in route.get('legs', []):
                leg_dist = meters_to_miles(float(leg.get('distance', 0)))
                leg_dur = float(leg.get('duration', 0)) / 60.0
                legs.append({
                    'distance_miles': round(leg_dist, 2),
                    'duration_minutes': round(leg_dur, 1),
                })
                for step in leg.get('steps', []):
                    maneuver = step.get('maneuver', {})
                    m_type = maneuver.get('type', 'drive')
                    m_mod = maneuver.get('modifier', '')
                    inst_text = f"{m_type.capitalize()} {m_mod} onto {step.get('name', '')}".strip()
                    instructions.append({
                        'instruction': inst_text,
                        'distance_miles': round(meters_to_miles(float(step.get('distance', 0))), 2),
                        'duration_minutes': round(float(step.get('duration', 0)) / 60.0, 1),
                        'street_name': step.get('name') or None,
                        'type': m_type,
                    })

            if len(coordinates) < 2 or total_dist_meters <= 0 or total_dur_seconds <= 0:
                raise ProviderError(self.name, 'routing', ProviderErrorCategory.INVALID_RESPONSE, 'Empty OSRM route')

            return {
                'geometry': geometry,
                'bbox': compute_bounding_box(coordinates),
                'distance_miles': round(meters_to_miles(total_dist_meters), 2),
                'base_driving_minutes': round(total_dur_seconds / 60.0, 1),
                'traffic_duration_minutes': None,
                'legs': legs,
                'sections': legs,
                'instructions': instructions,
            }
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.PROVIDER_UNAVAILABLE) from exc
