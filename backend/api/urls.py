from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OrderViewSet,
    AircraftViewSet,
    MaterialViewSet,
    ETLImportView,
    ETLExportView,
)

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"aircraft", AircraftViewSet, basename="aircraft")
router.register(r"materials", MaterialViewSet, basename="material")

urlpatterns = [
    path("etl/import/", ETLImportView.as_view(), name="etl-import"),
    path("etl/export/", ETLExportView.as_view(), name="etl-export"),
    path("", include(router.urls)),
]
