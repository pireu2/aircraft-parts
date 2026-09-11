from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    OrderViewSet,
    AircraftViewSet,
    MaterialViewSet,
    ImportLogViewSet,
    ETLImportView,
    ETLExportView,
    ETLClearView,
)

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"aircraft", AircraftViewSet, basename="aircraft")
router.register(r"materials", MaterialViewSet, basename="material")
router.register(r"import-logs", ImportLogViewSet, basename="import-log")

urlpatterns = [
    path("etl/import/", ETLImportView.as_view(), name="etl-import"),
    path("etl/export/", ETLExportView.as_view(), name="etl-export"),
    path("etl/clear/", ETLClearView.as_view(), name="etl-clear"),
    path("", include(router.urls)),
]
