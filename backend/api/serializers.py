from rest_framework import serializers
from .models import Aircraft, Material, Order, ImportLog


class AircraftSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(source="orders.count", read_only=True)

    class Meta:
        model = Aircraft
        fields = [
            "id",
            "serial_number",
            "model",
            "manufacturer",
            "capacity",
            "configuration",
            "orders_count",
        ]


class MaterialSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(source="orders.count", read_only=True)

    class Meta:
        model = Material
        fields = [
            "id",
            "part_number",
            "name",
            "type",
            "weight",
            "orders_count",
        ]


# nested for orders table
class AircraftCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aircraft
        fields = ["id", "serial_number", "model", "manufacturer", "capacity", "configuration"]


class MaterialCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ["id", "part_number", "name", "type", "weight"]


class OrderListSerializer(serializers.ModelSerializer):
    aircraft = AircraftCompactSerializer(read_only=True)
    material = MaterialCompactSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "aircraft",
            "material",
            "arrival_date",
            "status",
        ]


class OrderWriteSerializer(serializers.ModelSerializer):
    aircraft = serializers.PrimaryKeyRelatedField(queryset=Aircraft.objects.all())
    material = serializers.PrimaryKeyRelatedField(queryset=Material.objects.all())

    class Meta:
        model = Order
        fields = [
            "id",
            "aircraft",
            "material",
            "arrival_date",
            "status",
        ]


# detail views
class OrderInAircraftDetailSerializer(serializers.ModelSerializer):
    material_id = serializers.UUIDField(source="material.id", read_only=True)
    part_number = serializers.CharField(source="material.part_number", read_only=True)
    material_name = serializers.CharField(source="material.name", read_only=True)
    material_type = serializers.CharField(source="material.type", read_only=True)
    weight = serializers.DecimalField(source="material.weight", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "material_id",
            "part_number",
            "material_name",
            "material_type",
            "weight",
            "arrival_date",
            "status",
        ]


class AircraftDetailSerializer(serializers.ModelSerializer):
    total_orders = serializers.IntegerField(source="orders.count", read_only=True)
    orders = OrderInAircraftDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Aircraft
        fields = [
            "id",
            "serial_number",
            "model",
            "manufacturer",
            "capacity",
            "configuration",
            "total_orders",
            "orders",
        ]


class OrderInMaterialDetailSerializer(serializers.ModelSerializer):
    aircraft_id = serializers.UUIDField(source="aircraft.id", read_only=True)
    aircraft_serial = serializers.CharField(source="aircraft.serial_number", read_only=True)
    aircraft_model = serializers.CharField(source="aircraft.model", read_only=True)
    aircraft_manufacturer = serializers.CharField(source="aircraft.manufacturer", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "aircraft_id",
            "aircraft_serial",
            "aircraft_model",
            "aircraft_manufacturer",
            "arrival_date",
            "status",
        ]


class MaterialDetailSerializer(serializers.ModelSerializer):
    total_orders = serializers.IntegerField(source="orders.count", read_only=True)
    orders = OrderInMaterialDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Material
        fields = [
            "id",
            "part_number",
            "name",
            "type",
            "weight",
            "total_orders",
            "orders",
        ]


class ImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportLog
        fields = [
            "id",
            "action",
            "status",
            "file_name",
            "error_message",
            "diff",
            "total_created",
            "total_updated",
            "total_deleted",
            "total_records",
            "created_at",
        ]
