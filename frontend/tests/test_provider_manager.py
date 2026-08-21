import os
import sys
from pathlib import Path
from unittest.mock import Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django

django.setup()

for module_name in list(sys.modules):
    if module_name == 'trips' or module_name.startswith('trips.'):
        del sys.modules[module_name]

import pytest

from trips.exceptions import RoutingException
from trips.services.provider_manager import ProviderManager
from trips.services.providers.base import ProviderError, ProviderErrorCategory


WAYPOINTS = [
    {'label': 'Dallas, TX', 'latitude': 32.7767, 'longitude': -96.7970},
    {'label': 'Houston, TX', 'latitude': 29.7604, 'longitude': -95.3698},
]


def provider(result=None, error=None):
    fake = Mock()
    type(fake).configured = property(lambda self: True)
    if error:
        fake.calculate_route.side_effect = error
    else:
        fake.calculate_route.return_value = result
    return fake


def test_here_success_is_selected_first():
    manager = ProviderManager()
    here_result = {'geometry': {'type': 'LineString', 'coordinates': [[-96.7, 32.7], [-95.3, 29.7]]}, 'distance_miles': 240}
    manager.providers = {'here': provider(here_result), 'tomtom': provider(), 'openrouteservice': provider()}

    result = manager.calculate_route(WAYPOINTS)

    assert result['provider'] == 'here'
    assert result['distance_miles'] == 240
    manager.providers['tomtom'].calculate_route.assert_not_called()


def test_access_denied_falls_back_to_tomtom():
    manager = ProviderManager()
    denied = ProviderError('here', 'routing', ProviderErrorCategory.ACCESS_DENIED)
    manager.providers = {
        'here': provider(error=denied),
        'tomtom': provider({'geometry': {'type': 'LineString', 'coordinates': [[-96.7, 32.7], [-95.3, 29.7]]}, 'distance_miles': 240}),
        'openrouteservice': provider(),
    }

    result = manager.calculate_route(WAYPOINTS)

    assert result['provider'] == 'tomtom'
    assert result['distance_miles'] == 240


def test_all_providers_fail_returns_clean_routing_exception():
    failure = ProviderError('provider', 'routing', ProviderErrorCategory.TIMEOUT)
    manager = ProviderManager()
    manager.providers = {
        'here': provider(error=failure),
        'tomtom': provider(error=failure),
        'openrouteservice': provider(error=failure),
    }

    with pytest.raises(RoutingException) as error:
        manager.calculate_route(WAYPOINTS)

    assert error.value.status_code == 503
    assert 'Access to this API' not in str(error.value)
