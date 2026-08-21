from typing import Any, Dict, List, Optional

from django.conf import settings

from .base import LocationRoutingProvider, ProviderError, ProviderErrorCategory, normalize_location, valid_coordinate
from trips.services.ors_client import ORSClient
from trips.services.route_geometry import compute_bounding_box, meters_to_miles


class OpenRouteServiceProvider(LocationRoutingProvider):
    name = 'openrouteservice'

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'OPENROUTESERVICE_API_KEY', '')
        self.client = ORSClient(self.api_key) if self.api_key else None

    @property
    def configured(self):
        return bool(self.api_key)

    def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not self.client:
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.PROVIDER_UNAVAILABLE, 'Not configured')
        try:
            features = self.client.geocode_search(query, limit)
            results = []
            for feature in features:
                props = feature.get('properties', {})
                coords = feature.get('geometry', {}).get('coordinates', [])
                if len(coords) >= 2:
                    results.append(normalize_location(props.get('label', ''), coords[1], coords[0],
                                                      city=props.get('locality') or props.get('county'),
                                                      state=props.get('region'), state_code=props.get('region_a')))
            return results
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(self.name, 'geocode', ProviderErrorCategory.PROVIDER_UNAVAILABLE) from exc

    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        return None

    def calculate_route(self, waypoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.client or any(not valid_coordinate(p.get('latitude'), p.get('longitude')) for p in waypoints):
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.PROVIDER_UNAVAILABLE)
        try:
            data = self.client.get_hgv_directions([[p['longitude'], p['latitude']] for p in waypoints])
            feature = data['features'][0]
            props = feature['properties']
            summary = props['summary']
            geometry = feature['geometry']
            legs = [{'distance_miles': round(meters_to_miles(segment.get('distance', 0)), 2),
                     'duration_minutes': round(segment.get('duration', 0) / 60, 1)}
                    for segment in props.get('segments', [])]
            if len(geometry.get('coordinates', [])) < 2 or summary['distance'] <= 0 or summary['duration'] <= 0:
                raise ValueError('Empty ORS route')
            return {'geometry': geometry, 'bbox': feature.get('bbox') or compute_bounding_box(geometry['coordinates']),
                    'distance_miles': round(meters_to_miles(summary['distance']), 2),
                    'base_driving_minutes': round(summary['duration'] / 60, 1), 'traffic_duration_minutes': None,
                    'legs': legs, 'sections': legs, 'instructions': []}
        except ProviderError:
            raise
        except Exception as exc:
            raise ProviderError(self.name, 'routing', ProviderErrorCategory.PROVIDER_UNAVAILABLE) from exc