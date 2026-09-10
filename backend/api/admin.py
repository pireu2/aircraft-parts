from django.contrib import admin
from .models import Aircraft, Material, Order


@admin.register(Aircraft)
class AircraftAdmin(admin.ModelAdmin):
    list_display = ("serial_number", "model", "manufacturer", "capacity", "configuration")
    search_fields = ("serial_number", "model", "manufacturer")


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("part_number", "name", "type", "weight")
    search_fields = ("part_number", "name", "type")
    list_filter = ("type",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "aircraft", "material", "arrival_date", "status")
    list_filter = ("status", "arrival_date")
    search_fields = (
        "aircraft__serial_number",
        "aircraft__model",
        "material__part_number",
        "material__name",
    )
