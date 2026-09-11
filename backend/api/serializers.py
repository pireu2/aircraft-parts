from rest_framework import serializers
from .models import Aircraft, Material, Order


class AircraftSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)

    class Meta:
        model = Aircraft
        fields = [
            "serial_number",
            "name",
            "model",
            "manufacturer",
            "capacity",
            "configuration",
        ]


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = [
            "part_number",
            "name",
            "type",
            "weight",
        ]


class OrderSerializer(serializers.ModelSerializer):
    aircraft = AircraftSerializer(read_only=True)
    material = MaterialSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "aircraft",
            "material",
            "arrival_date",
            "status",
        ]
