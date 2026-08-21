"""
OpenRouteService API HTTP Client.
Encapsulates all external calls to ORS for geocoding and HGV routing.
"""
import requests
import logging
import time
from typing import Dict, Any, List, Optional
from django.conf import settings
from trips.exceptions import (
    GeocodingException,
    RoutingException,
    RateLimitException,
)
from trips.services.providers.base import ProviderError, ProviderErrorCategory

logger = logging.getLogger(__name__)

ORS_BASE_URL = "https://api.openrouteservice.org"
REQUEST_TIMEOUT_SECONDS = 15


class ORSClient:
    """Client for OpenRouteService API with retry and error handling."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "OPENROUTESERVICE_API_KEY", "")
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({
                "Authorization": self.api_key,
                "Accept": "application/json, application/geo+json, application/gpx+xml, text/xml; charset=utf-8",
                "Content-Type": "application/json; charset=utf-8",
            })

    def _request_with_retry(
        self,
        method: str,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        max_retries: int = 2
    ) -> requests.Response:
        """Execute HTTP request with exponential backoff for transient 5xx/429 errors."""
        last_error = None
        for attempt in range(max_retries + 1):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json_data,
                    timeout=REQUEST_TIMEOUT_SECONDS
                )
                if response.status_code == 401:
                    raise ProviderError('openrouteservice', 'routing', ProviderErrorCategory.AUTHENTICATION_ERROR)
                if response.status_code == 403:
                    raise ProviderError('openrouteservice', 'routing', ProviderErrorCategory.ACCESS_DENIED)
                if response.status_code == 429:
                    if attempt < max_retries:
                        time.sleep(1.0 * (attempt + 1))
                        continue
                    raise RateLimitException("OpenRouteService API rate limit exceeded.")
                
                if response.status_code >= 500:
                    if attempt < max_retries:
                        time.sleep(0.5 * (attempt + 1))
                        continue
                    raise RoutingException(f"External routing provider error (status {response.status_code}).")

                return response

            except requests.exceptions.Timeout as e:
                last_error = e
                if attempt < max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise RoutingException("External routing provider request timed out.")
            except requests.exceptions.RequestException as e:
                last_error = e
                if attempt < max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise RoutingException(f"Network error communicating with routing provider: {str(e)}")

        raise RoutingException(f"Failed after retries: {str(last_error)}")

    def geocode_search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Geocode a location query prioritizing United States.
        Endpoint: /geocode/search
        """
        if not query or len(query.strip()) < 2:
            return []

        url = f"{ORS_BASE_URL}/geocode/search"
        params = {
            "text": query.strip(),
            "size": limit,
            "boundary.country": "USA",
        }
        if self.api_key:
            params["api_key"] = self.api_key

        try:
            response = self._request_with_retry("GET", url, params=params)
            if response.status_code != 200:
                logger.warning(f"Geocoding returned status {response.status_code} for '{query}'")
                return []

            data = response.json()
            return data.get("features", [])
        except ProviderError:
            raise
        except Exception as e:
            logger.warning(f"Geocoding query '{query}' failed: {e}")
            return []

    def get_hgv_directions(
        self,
        coordinates: List[List[float]],
        radiuses: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Request heavy goods vehicle truck route for a list of [lng, lat] waypoints.
        Endpoint: /v2/directions/driving-hgv/geojson
        """
        if len(coordinates) < 2:
            raise RoutingException("At least two coordinates are required for routing.")

        url = f"{ORS_BASE_URL}/v2/directions/driving-hgv/geojson"
        payload = {
            "coordinates": coordinates,
            "instructions": True,
            "elevation": False,
            "geometry": True,
            "preference": "recommended",
            "units": "m",
        }
        if radiuses:
            payload["radiuses"] = radiuses

        response = self._request_with_retry("POST", url, json_data=payload)
        
        if response.status_code == 404:
            raise RoutingException("No drivable truck route could be found between these locations.")
        if response.status_code != 200:
            try:
                err_data = response.json()
                err_msg = err_data.get("error", {}).get("message", response.text)
            except Exception:
                err_msg = response.text
            raise RoutingException(f"Routing provider error: {err_msg}")

        return response.json()
