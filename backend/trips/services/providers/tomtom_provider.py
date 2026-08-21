from typing import Any, Dict, List, Optional

import requests
from django.conf import settings

from .base import LocationRoutingProvider, ProviderError, ProviderErrorCategory, normalize_location, request_json, valid_coordinate
from trips.services.route_geometry import compute_bounding_box, meters_to_miles


class TomTomProvider(LocationRoutingProvider):
    name = 'tomtom'
    base_url = 'https://api.tomtom.com'

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'TOMTOM_API_KEY', '')
        self.session = requests.Session()

    @property
    def configured(self):
        return bool(self.api_key)

    def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not self.configured:
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.PROVIDER_UNAVAILABLE, 'Not configured')
        payload = request_json(self.session, self.name, 'geocode', 'GET',
                               f'{self.base_url}/search/2/search/{requests.utils.quote(query)}.json',
                               params={'key': self.api_key, 'countrySet': 'US', 'limit': limit, 'typeahead': 'true'})
        results = []
        try:
            for item in payload.get('results', []):
                address = item.get('address', {})
                position = item.get('position', {})
                results.append(normalize_location(
                    address.get('freeformAddress') or item.get('poi', {}).get('name', ''),
                    position.get('lat'), position.get('lon'), city=address.get('municipality'),
                    state=address.get('countrySubdivisionName'), state_code=address.get('countrySubdivisionCode'),
                    postal_code=address.get('postalCode')))
        except (KeyError, TypeError, ValueError) as exc:
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.INVALID_RESPONSE) from exc
        return results

    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        if not self.configured:
            raise ProviderError(self.name, 'reverse_geocode', ProviderErrorCategory.PROVIDER_UNAVAILABLE, 'Not configured')
        payload = request_json(self.session, self.name, 'reverse_geocode', 'GET',
                               f'{self.base_url}/search/2/reverseGeocode/{latitude},{longitude}.json',
                               params={'key': self.api_key})
        results = payload.get('addresses', [])
        if not results:
            return None
        item = results[0]
        address = item.get('address', {})
        return normalize_location(address.get('freeformAddress', ''), latitude, longitude,
                                  city=address.get('municipality'), state=address.get('countrySubdivisionName'),
                                  state_code=address.get('countrySubdivisionCode'), postal_code=address.get('postalCode'))

    def calculate_route(self, waypoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.configured:
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.PROVIDER_UNAVAILABLE, 'Not configured')
        if len(waypoints) < 2 or any(not valid_coordinate(p.get('latitude'), p.get('longitude')) for p in waypoints):
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.INVALID_REQUEST)
        point_string = ':'.join(f"{p['latitude']},{p['longitude']}" for p in waypoints)
        payload = request_json(self.session, self.name, 'routing', 'GET',
                               f'{self.base_url}/routing/1/calculateRoute/{point_string}/json',
                               params={'key': self.api_key, 'travelMode': 'truck', 'routeType': 'fastest',
                                       'traffic': 'true', 'sectionType': 'travelMode', 'computeBestOrder': 'false'},
                               timeout=10)
        try:
            route = payload['routes'][0]
            geometry = []
            legs = []
            instructions = []
            for leg in route['legs']:
                geometry.extend([[point['longitude'], point['latitude']] for point in leg['points']])
                summary = leg['summary']
                legs.append({'distance_miles': round(meters_to_miles(summary['lengthInMeters']), 2),
                             'duration_minutes': round(summary['travelTimeInSeconds'] / 60, 1)})
                for instruction in leg.get('guidance', {}).get('instructions', []):
                    instructions.append({'instruction': instruction.get('message', ''),
                                         'distance_miles': round(meters_to_miles(instruction.get('routeOffsetInMeters', 0)), 2),
                                         'duration_minutes': None, 'street_name': None})
            summary = route['summary']
            distance = summary['lengthInMeters']
            duration = summary['travelTimeInSeconds']
            traffic_duration = summary.get('trafficDelayInSeconds')
            if len(geometry) < 2 or distance <= 0 or duration <= 0:
                raise ValueError('Empty TomTom route')
            return {'geometry': {'type': 'LineString', 'coordinates': geometry},
                    'bbox': compute_bounding_box(geometry), 'distance_miles': round(meters_to_miles(distance), 2),
                    'base_driving_minutes': round(duration / 60, 1),
                    'traffic_duration_minutes': round((duration + traffic_duration) / 60, 1) if traffic_duration else None,
                    'legs': legs, 'sections': legs, 'instructions': instructions}
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.INVALID_RESPONSE) from exc