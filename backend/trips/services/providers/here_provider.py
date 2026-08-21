from typing import Any, Dict, List, Optional

import requests
from django.conf import settings

from .base import (LocationRoutingProvider, ProviderError, ProviderErrorCategory,
                   normalize_location, request_json, valid_coordinate)
from trips.services.route_geometry import compute_bounding_box, meters_to_miles


def _decode_flexible_polyline(encoded: str) -> List[List[float]]:
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    lookup = {char: index for index, char in enumerate(alphabet)}
    index = 0

    def read_varint():
        nonlocal index
        value = 0
        shift = 0
        while index < len(encoded):
            chunk = lookup[encoded[index]]
            index += 1
            value |= (chunk & 0x1f) << shift
            if not chunk & 0x20:
                return value
            shift += 5
        raise ValueError('Incomplete flexible polyline')

    header = read_varint()
    precision = header & 15
    third_dim = (header >> 4) & 7
    third_precision = (header >> 7) & 15
    if third_dim:
        raise ValueError('3D flexible polylines are not supported')
    factor = 10 ** precision
    lat = lon = 0
    points = []
    while index < len(encoded):
        lat_value = read_varint()
        lon_value = read_varint()
        lat += -(lat_value >> 1) if lat_value & 1 else lat_value >> 1
        lon += -(lon_value >> 1) if lon_value & 1 else lon_value >> 1
        points.append([lon / factor, lat / factor])
    return points


class HereProvider(LocationRoutingProvider):
    name = 'here'
    base_url = 'https://geocode.search.hereapi.com/v1'
    routing_url = 'https://router.hereapi.com/v8/routes'

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'HERE_API_KEY', '')
        self.session = requests.Session()

    @property
    def configured(self):
        return bool(self.api_key)

    def _location(self, item: Dict[str, Any]) -> Dict[str, Any]:
        address = item.get('address', {})
        position = item.get('position', {})
        country = address.get('countryName', '')
        if country and country != 'United States':
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.INVALID_RESPONSE)
        label = address.get('label') or item.get('title') or ''
        return normalize_location(label, position.get('lat'), position.get('lng'),
                                  city=address.get('city') or address.get('district'),
                                  state=address.get('state'), state_code=address.get('stateCode'),
                                  postal_code=address.get('postalCode'))

    def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not self.configured:
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.PROVIDER_UNAVAILABLE, 'Not configured')
        payload = request_json(self.session, self.name, 'geocode', 'GET', f'{self.base_url}/geocode',
                               params={'apiKey': self.api_key, 'q': query, 'in': 'countryCode:USA', 'limit': limit})
        try:
            return [self._location(item) for item in payload.get('items', [])]
        except (KeyError, TypeError, ValueError) as exc:
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.INVALID_RESPONSE) from exc

    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        results = self.geocode(f'{latitude},{longitude}', limit=1)
        return results[0] if results else None

    def calculate_route(self, waypoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.configured:
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.PROVIDER_UNAVAILABLE, 'Not configured')
        if len(waypoints) < 2 or any(not valid_coordinate(p.get('latitude'), p.get('longitude')) for p in waypoints):
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.INVALID_REQUEST)
        params = {'apiKey': self.api_key, 'transportMode': 'truck',
                  'origin': f"{waypoints[0]['latitude']},{waypoints[0]['longitude']}",
                  'destination': f"{waypoints[-1]['latitude']},{waypoints[-1]['longitude']}",
                  'return': 'polyline,summary,actions,instructions,travelSummary'}
        for waypoint in waypoints[1:-1]:
            params.setdefault('via', []).append(f"{waypoint['latitude']},{waypoint['longitude']}")
        payload = request_json(self.session, self.name, 'routing', 'GET', self.routing_url, params=params, timeout=10)
        try:
            route = payload['routes'][0]
            sections = route['sections']
            coordinates = []
            normalized_sections = []
            instructions = []
            for section in sections:
                section_coords = _decode_flexible_polyline(section['polyline'])
                coordinates.extend(section_coords if not coordinates else section_coords[1:])
                summary = section['summary']
                normalized_sections.append({
                    'distance_miles': round(meters_to_miles(summary['length']), 2),
                    'duration_minutes': round(summary['duration'] / 60, 1),
                })
                for action in section.get('actions', []):
                    instructions.append({'instruction': action.get('instruction', ''),
                                         'distance_miles': round(meters_to_miles(action.get('length', 0)), 2),
                                         'duration_minutes': round(action.get('duration', 0) / 60, 1),
                                         'street_name': action.get('streetName')})
            summary = route.get('sections', [{}])[0].get('summary', {})
            total = route.get('summary', {})
            distance = total.get('length', sum(s['distance_miles'] for s in normalized_sections) * 1609.344)
            duration = total.get('duration', sum(s['duration_minutes'] for s in normalized_sections) * 60)
            if len(coordinates) < 2 or distance <= 0 or duration <= 0:
                raise ValueError('Empty HERE route')
            return {'geometry': {'type': 'LineString', 'coordinates': coordinates},
                    'bbox': compute_bounding_box(coordinates), 'distance_miles': round(meters_to_miles(distance), 2),
                    'base_driving_minutes': round(duration / 60, 1), 'traffic_duration_minutes': None,
                    'legs': normalized_sections, 'sections': normalized_sections, 'instructions': instructions}
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.INVALID_RESPONSE) from exc