import logging
from typing import Any, Dict, List

from django.conf import settings

from trips.exceptions import GeocodingException, RoutingException
from .providers.base import ProviderError, ProviderErrorCategory
from .providers.here_provider import HereProvider
from .providers.openrouteservice_provider import OpenRouteServiceProvider
from .providers.tomtom_provider import TomTomProvider
from .providers.osrm_provider import OSRMProvider

logger = logging.getLogger(__name__)


class ProviderManager:
    def __init__(self):
        self.providers = {
            'here': HereProvider(),
            'tomtom': TomTomProvider(),
            'openrouteservice': OpenRouteServiceProvider(),
            'osrm': OSRMProvider(),
        }
        self.fallback_enabled = getattr(settings, 'ENABLE_PROVIDER_FALLBACK', True)

    def _order(self, setting_name: str) -> List[str]:
        primary = getattr(settings, setting_name, 'here').lower()
        all_names = ('here', 'tomtom', 'openrouteservice', 'osrm')
        configured = [primary] + [name for name in all_names if name != primary]
        if not self.fallback_enabled:
            configured = configured[:1]
        return [name for name in configured if name in self.providers and self.providers[name].configured]

    def search_locations(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        failures = []
        for name in self._order('PRIMARY_GEOCODING_PROVIDER'):
            try:
                results = self.providers[name].geocode(query, limit)
                if results:
                    logger.info('Provider selected: %s geocoding', name)
                    return results[:limit]
            except ProviderError as exc:
                failures.append(exc)
                logger.warning('Geocoding fallback from %s category=%s', name, exc.category.value)
        if failures:
            return []
        return []

    def calculate_route(self, waypoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        failures = []
        for name in self._order('PRIMARY_ROUTING_PROVIDER'):
            try:
                route = self.providers[name].calculate_route(waypoints)
                route['provider'] = name
                logger.info('Provider selected: %s routing', name)
                return route
            except ProviderError as exc:
                failures.append(exc)
                logger.warning('Routing fallback from %s category=%s', name, exc.category.value)
        raise RoutingException('We could not calculate the route right now. Please try again.')

    def diagnostic_route(self) -> Dict[str, str]:
        """Make one small real truck request per configured provider for diagnostics."""
        waypoints = [
            {'label': 'Dallas, TX', 'latitude': 32.7767, 'longitude': -96.7970},
            {'label': 'Houston, TX', 'latitude': 29.7604, 'longitude': -95.3698},
        ]
        results = {}
        for name, provider in self.providers.items():
            if not provider.configured:
                results[name] = 'NOT CONFIGURED'
                continue
            try:
                route = provider.calculate_route(waypoints)
                if route.get('distance_miles', 0) > 0 and route.get('base_driving_minutes', 0) > 0 and route.get('geometry', {}).get('coordinates'):
                    results[name] = 'OK'
                else:
                    results[name] = 'INVALID RESPONSE'
            except ProviderError as exc:
                results[name] = f'{exc.category.value}'
            except Exception:
                logger.exception('Provider diagnostic failed for %s', name)
                results[name] = 'PROVIDER_UNAVAILABLE'
        return results

    def diagnostic_geocode(self) -> Dict[str, str]:
        results = {}
        for name, provider in self.providers.items():
            if not provider.configured:
                results[name] = 'NOT CONFIGURED'
                continue
            try:
                locations = provider.geocode('Dallas, TX', limit=1)
                results[name] = 'OK' if locations and locations[0].get('latitude') is not None else 'INVALID RESPONSE'
            except ProviderError as exc:
                results[name] = exc.category.value
            except Exception:
                logger.exception('Geocoding diagnostic failed for %s', name)
                results[name] = 'PROVIDER_UNAVAILABLE'
        return results

    def status(self) -> Dict[str, Dict[str, bool]]:
        return {name: {'configured': provider.configured} for name, provider in self.providers.items()}


provider_manager = ProviderManager()