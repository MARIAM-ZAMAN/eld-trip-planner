"""
Custom exception classes for RouteLog trip planning API.
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class GeocodingException(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Location could not be geocoded or is outside the United States."
    default_code = "location_not_found"


class RoutingException(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Routing service could not calculate a valid road route."
    default_code = "routing_failed"


class HOSValidationException(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "Trip cannot be calculated due to HOS regulatory constraints."
    default_code = "hos_validation_error"


class RateLimitException(APIException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "External routing provider rate limit reached. Please wait a moment and try again."
    default_code = "rate_limit_exceeded"


class SchedulingException(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "Trip schedule could not be generated."
    default_code = "scheduling_failed"


class ELDBuildException(APIException):
    """Raised when ELD log construction fails after scheduling succeeds."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "ELD log could not be constructed from the generated schedule."
    default_code = "eld_build_failed"


class ValidationException(APIException):
    """Raised for semantic input validation failures not caught by the serializer."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Trip input data failed validation."
    default_code = "validation_error"
