from django.core.management.base import BaseCommand

from trips.services.provider_manager import provider_manager


class Command(BaseCommand):
    help = 'Report configured RouteLog provider capabilities without exposing credentials.'

    def handle(self, *args, **options):
        configured = provider_manager.status()
        geocoding = provider_manager.diagnostic_geocode()
        diagnostics = provider_manager.diagnostic_route()
        for name in configured:
            self.stdout.write(f'{name.title()} Geocoding: {geocoding[name]}')
            self.stdout.write(f'{name.title()} Truck Routing: {diagnostics[name]}')
        if not any(item['configured'] for item in configured.values()):
            self.stdout.write(self.style.WARNING('No external provider is configured. Real trip generation is unavailable.'))