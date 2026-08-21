from rest_framework import serializers


class TripPlanSerializer(serializers.Serializer):
    current_location = serializers.JSONField(required=True)
    pickup_location = serializers.JSONField(required=True)
    dropoff_location = serializers.JSONField(required=True)
    current_cycle_hours = serializers.FloatField(required=True, min_value=0, max_value=70)

    def validate_location(self, value):
        if isinstance(value, str):
            if not value.strip():
                raise serializers.ValidationError('Location cannot be blank.')
            return value.strip()
        if not isinstance(value, dict) or not value.get('label'):
            raise serializers.ValidationError('Select a valid US location.')
        try:
            latitude = float(value['latitude'])
            longitude = float(value['longitude'])
        except (KeyError, TypeError, ValueError):
            raise serializers.ValidationError('Selected location coordinates are invalid.')
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            raise serializers.ValidationError('Selected location coordinates are invalid.')
        if value.get('country') not in (None, '', 'United States'):
            raise serializers.ValidationError('Only United States locations are supported.')
        return {**value, 'latitude': latitude, 'longitude': longitude, 'country': 'United States'}

    def validate_current_location(self, value):
        return self.validate_location(value)

    def validate_pickup_location(self, value):
        return self.validate_location(value)

    def validate_dropoff_location(self, value):
        return self.validate_location(value)


class LocationSearchSerializer(serializers.Serializer):
    q = serializers.CharField(required=True, allow_blank=False, min_length=2)
