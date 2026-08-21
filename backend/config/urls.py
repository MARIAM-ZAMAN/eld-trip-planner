"""
URL configuration for RouteLog backend.
"""
from django.urls import path, include
from trips.views import HealthCheckView, ProviderStatusView

urlpatterns = [
    path('api/health/', HealthCheckView.as_view(), name='health_check'),
    path('api/providers/status/', ProviderStatusView.as_view(), name='provider_status'),
    path('api/', include('trips.urls')),
]
