from django.urls import path
from trips.views import LocationSearchView, TripPlanView

urlpatterns = [
    path('locations/search/', LocationSearchView.as_view(), name='location-search'),
    path('trips/plan/', TripPlanView.as_view(), name='trip-plan'),
]
