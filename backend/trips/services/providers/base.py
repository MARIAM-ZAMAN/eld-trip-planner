import logging
import time
from enum import Enum
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class ProviderErrorCategory(str, Enum):
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR'
    ACCESS_DENIED = 'ACCESS_DENIED'
    RATE_LIMITED = 'RATE_LIMITED'
    TIMEOUT = 'TIMEOUT'
    NO_ROUTE = 'NO_ROUTE'
    INVALID_REQUEST = 'INVALID_REQUEST'
    PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE'
    INVALID_RESPONSE = 'INVALID_RESPONSE'


class ProviderError(Exception):
    def __init__(self, provider: str, operation: str, category: ProviderErrorCategory, message: str = ''):
        self.provider = provider
        self.operation = operation
        self.category = category
        super().__init__(message or f'{provider} {operation} failed')


def request_json(session: requests.Session, provider: str, operation: str, method: str,
                 url: str, *, params: Optional[Dict[str, Any]] = None,
                 json_data: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None,
                 timeout: float = 8) -> Dict[str, Any]:
    last_error = None
    for attempt in range(2):
        started = time.monotonic()
        try:
            response = session.request(method, url, params=params, json=json_data,
                                       headers=headers, timeout=timeout)
            logger.info('%s %s status=%s duration_ms=%d', provider, operation,
                        response.status_code, (time.monotonic() - started) * 1000)
            if response.status_code in (401,):
                raise ProviderError(provider, operation, ProviderErrorCategory.AUTHENTICATION_ERROR)
            if response.status_code in (403,):
                raise ProviderError(provider, operation, ProviderErrorCategory.ACCESS_DENIED)
            if response.status_code == 404:
                raise ProviderError(provider, operation, ProviderErrorCategory.NO_ROUTE)
            if response.status_code == 429:
                category = ProviderErrorCategory.RATE_LIMITED
            elif response.status_code in (400, 422):
                category = ProviderErrorCategory.INVALID_REQUEST
            elif response.status_code >= 500:
                category = ProviderErrorCategory.PROVIDER_UNAVAILABLE
            else:
                category = None
            if category:
                if category in (ProviderErrorCategory.RATE_LIMITED, ProviderErrorCategory.PROVIDER_UNAVAILABLE) and attempt == 0:
                    time.sleep(0.25)
                    continue
                raise ProviderError(provider, operation, category)
            try:
                payload = response.json()
            except ValueError as exc:
                raise ProviderError(provider, operation, ProviderErrorCategory.INVALID_RESPONSE) from exc
            if not isinstance(payload, dict):
                raise ProviderError(provider, operation, ProviderErrorCategory.INVALID_RESPONSE)
            return payload
        except requests.Timeout as exc:
            last_error = exc
            if attempt == 0:
                continue
            raise ProviderError(provider, operation, ProviderErrorCategory.TIMEOUT) from exc
        except requests.RequestException as exc:
            last_error = exc
            if attempt == 0:
                continue
            raise ProviderError(provider, operation, ProviderErrorCategory.PROVIDER_UNAVAILABLE) from exc
    raise ProviderError(provider, operation, ProviderErrorCategory.PROVIDER_UNAVAILABLE) from last_error


def valid_coordinate(latitude: Any, longitude: Any) -> bool:
    try:
        return -90 <= float(latitude) <= 90 and -180 <= float(longitude) <= 180
    except (TypeError, ValueError):
        return False


def normalize_location(label: str, latitude: Any, longitude: Any, *, city: str = '',
                       state: str = '', state_code: str = '', postal_code: Optional[str] = None,
                       country: str = 'United States', country_code: str = 'US') -> Dict[str, Any]:
    if not valid_coordinate(latitude, longitude):
        raise ProviderError('normalizer', 'geocode', ProviderErrorCategory.INVALID_RESPONSE)
    return {
        'label': label,
        'latitude': round(float(latitude), 6),
        'longitude': round(float(longitude), 6),
        'city': city or None,
        'state': state or None,
        'state_code': state_code or None,
        'postal_code': postal_code,
        'country': country,
        'country_code': country_code,
    }


class LocationRoutingProvider:
    name = 'provider'

    def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def calculate_route(self, waypoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        raise NotImplementedError