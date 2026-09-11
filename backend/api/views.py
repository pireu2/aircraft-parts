import uuid
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Aircraft, Material, Order, ImportLog
from .serializers import (
    AircraftSerializer,
    AircraftDetailSerializer,
    MaterialSerializer,
    MaterialDetailSerializer,
    OrderListSerializer,
    OrderWriteSerializer,
    ImportLogSerializer,
)
from .services.etl import ETLService


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("aircraft", "material").all()

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return OrderWriteSerializer
        return OrderListSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # filter by status
        status_param = self.request.query_params.get("status")
        if status_param and status_param.lower() != "all":
            qs = qs.filter(status__iexact=status_param)

        # search across aircraft and material
        search = self.request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(aircraft__serial_number__icontains=search)
                | Q(aircraft__model__icontains=search)
                | Q(aircraft__manufacturer__icontains=search)
                | Q(material__part_number__icontains=search)
                | Q(material__name__icontains=search)
                | Q(material__type__icontains=search)
            )

        # sorting
        ordering = self.request.query_params.get("ordering", "arrival_date")
        if ordering:
            qs = qs.order_by(ordering)

        return qs


class AircraftViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Aircraft.objects.prefetch_related("orders__material").all()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AircraftDetailSerializer
        return AircraftSerializer

    def get_object(self):
        lookup = self.kwargs.get("pk")
        qs = Aircraft.objects.prefetch_related("orders__material")
        try:
            val = uuid.UUID(str(lookup))
            return get_object_or_404(qs, id=val)
        except (ValueError, AttributeError):
            return get_object_or_404(qs, serial_number=lookup)

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(serial_number__icontains=search)
                | Q(model__icontains=search)
                | Q(manufacturer__icontains=search)
            )
        return qs


class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Material.objects.prefetch_related("orders__aircraft").all()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MaterialDetailSerializer
        return MaterialSerializer

    def get_object(self):
        lookup = self.kwargs.get("pk")
        qs = Material.objects.prefetch_related("orders__aircraft")
        try:
            val = uuid.UUID(str(lookup))
            return get_object_or_404(qs, id=val)
        except (ValueError, AttributeError):
            return get_object_or_404(qs, part_number=lookup)

    def get_queryset(self):
        qs = super().get_queryset()
        mat_type = self.request.query_params.get("type")
        if mat_type:
            qs = qs.filter(type__iexact=mat_type.strip())
        search = self.request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(part_number__icontains=search)
                | Q(name__icontains=search)
                | Q(type__icontains=search)
            )
        return qs


class ETLImportView(APIView):
    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("file")

        if uploaded_file:
            source = uploaded_file
            source_name = uploaded_file.name
        else:
            default_path = getattr(settings, "DEFAULT_EXCEL_PATH", None)
            if not default_path or not default_path.exists():
                return Response(
                    {"error": "no file uploaded and default excel file was not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            source = default_path
            source_name = default_path.name

        try:
            diff = ETLService.import_excel(source, sync_delete=True)
            total_created = sum(diff[k]["created"] for k in diff)
            total_updated = sum(diff[k]["updated"] for k in diff)
            total_deleted = sum(diff[k]["deleted"] for k in diff)
            total_records = sum(diff[k]["total"] for k in diff)

            ImportLog.objects.create(
                action=ImportLog.Action.IMPORT,
                status=ImportLog.Status.SUCCESS,
                file_name=source_name,
                diff=diff,
                total_created=total_created,
                total_updated=total_updated,
                total_deleted=total_deleted,
                total_records=total_records,
            )

            return Response(
                {
                    "status": "success",
                    "message": f"successfully imported database from {source_name}",
                    "source": source_name,
                    "diff": diff,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            ImportLog.objects.create(
                action=ImportLog.Action.IMPORT,
                status=ImportLog.Status.FAILED,
                file_name=source_name,
                error_message=str(e),
            )
            return Response(
                {
                    "status": "error",
                    "message": f"failed to process excel file: {str(e)}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class ETLExportView(APIView):
    def get(self, request, *args, **kwargs):
        excel_buffer = ETLService.export_excel()
        response = HttpResponse(
            excel_buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="aircraft_materials_export.xlsx"'
        return response


class ETLClearView(APIView):
    def post(self, request, *args, **kwargs):
        orders_deleted = Order.objects.count()
        materials_deleted = Material.objects.count()
        aircraft_deleted = Aircraft.objects.count()
        total_deleted = orders_deleted + materials_deleted + aircraft_deleted

        Order.objects.all().delete()
        Material.objects.all().delete()
        Aircraft.objects.all().delete()

        diff = {
            "aircraft": {"created": 0, "updated": 0, "deleted": aircraft_deleted, "total": 0},
            "materials": {"created": 0, "updated": 0, "deleted": materials_deleted, "total": 0},
            "orders": {"created": 0, "updated": 0, "deleted": orders_deleted, "total": 0},
        }

        ImportLog.objects.create(
            action=ImportLog.Action.CLEAR,
            status=ImportLog.Status.SUCCESS,
            file_name="Database Wipe",
            diff=diff,
            total_created=0,
            total_updated=0,
            total_deleted=total_deleted,
            total_records=0,
        )

        return Response(
            {
                "status": "success",
                "message": "all data deleted successfully",
            },
            status=status.HTTP_200_OK,
        )


class ImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ImportLog.objects.all().order_by("-created_at")
    serializer_class = ImportLogSerializer
