import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import APIException

from trips.hos_engine import schedule_trip, SchedulingError
from trips.serializers import LocationSearchSerializer, TripPlanSerializer
from trips.services.geocoding import resolve_location, search_locations
from trips.services.routing import get_truck_route
from trips.services.provider_manager import provider_manager
from trips.services.timezone_service import (
    get_current_time_in_timezone,
    get_timezone_name_for_coordinates,
)
from trips.exceptions import (
    GeocodingException,
    RoutingException,
    SchedulingException,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Utility views
# ---------------------------------------------------------------------------

class HealthCheckView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class ProviderStatusView(APIView):
    def get(self, request):
        return Response(provider_manager.status())


class LocationSearchView(APIView):
    def get(self, request):
        serializer = LocationSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        return Response(search_locations(serializer.validated_data["q"], limit=5))


# ---------------------------------------------------------------------------
# Trip planning – core function
# ---------------------------------------------------------------------------

def _plan_trip(validated: dict) -> dict:
    """
    Geocode locations → fetch route → run HOS scheduler → return TripPlan.

    All HOS calculation is done inside `schedule_trip`; this function only
    handles external I/O (geocoding + routing) and enriches the result with
    real-world timezone/timestamp information.
    """
    # 1. Resolve locations (already dicts from serializer validation)
    current = (
        validated["current_location"]
        if isinstance(validated["current_location"], dict)
        else resolve_location(validated["current_location"])
    )
    pickup = (
        validated["pickup_location"]
        if isinstance(validated["pickup_location"], dict)
        else resolve_location(validated["pickup_location"])
    )
    dropoff = (
        validated["dropoff_location"]
        if isinstance(validated["dropoff_location"], dict)
        else resolve_location(validated["dropoff_location"])
    )

    # 2. Fetch truck route (current → pickup → dropoff)
    route = get_truck_route(current, pickup, dropoff)

    # 3. Real-world start time in local timezone
    timezone_name = get_timezone_name_for_coordinates(
        current["latitude"], current["longitude"]
    )
    start_datetime = get_current_time_in_timezone(timezone_name)

    # 4. Run the HOS scheduler
    locations = {"current": current, "pickup": pickup, "dropoff": dropoff}
    try:
        trip_plan = schedule_trip(
            locations=locations,
            route=route,
            cycle_used_hours=validated["current_cycle_hours"],
            start_datetime=start_datetime,
        )
    except SchedulingError as exc:
        logger.exception("HOS scheduling failed: %s", exc)
        raise SchedulingException() from exc
    except Exception as exc:
        logger.exception("Unexpected error during HOS scheduling")
        raise SchedulingException() from exc

    # 5. Enrich with real-world time/tz data
    trip_plan["calculated_at"] = timezone.now().isoformat()
    trip_plan["log_timezone"]  = timezone_name

    return trip_plan


# ---------------------------------------------------------------------------
# Trip plan endpoint
# ---------------------------------------------------------------------------

class TripPlanView(APIView):
    def post(self, request):
        serializer = TripPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            return Response(_plan_trip(serializer.validated_data), status=status.HTTP_200_OK)
        except GeocodingException as exc:
            logger.warning("Trip location resolution failed: %s", exc.detail)
            return Response(
                {"error": {"code": "LOCATION_INVALID", "message": "Please select a valid city or address."}},
                status=exc.status_code,
            )
        except RoutingException as exc:
            logger.warning("Trip routing failed: %s", exc.detail)
            return Response(
                {"error": {"code": "ROUTING_UNAVAILABLE", "message": "We could not calculate the route right now. Please try again."}},
                status=exc.status_code,
            )
        except SchedulingException as exc:
            logger.exception("Trip scheduling failed")
            return Response(
                {"error": {"code": "SCHEDULING_FAILED", "message": "Trip schedule could not be generated."}},
                status=exc.status_code,
            )
        except APIException as exc:
            logger.warning("Trip planning API error: %s", exc.detail)
            return Response(
                {"error": {"code": "TRIP_PLAN_INVALID", "message": "We could not create this trip plan."}},
                status=exc.status_code,
            )
        except Exception:
            logger.exception("Trip planning failed with unexpected error")
            return Response(
                {"error": {"code": "ROUTING_UNAVAILABLE", "message": "We could not calculate the route right now. Please try again."}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
