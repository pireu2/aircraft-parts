from django.conf import settings
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Aircraft, Material, Order
from .serializers import AircraftSerializer, MaterialSerializer, OrderSerializer
from .services.etl import load_excel, export_excel


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint to retrieve aircraft part orders."""
    queryset = Order.objects.select_related("aircraft", "material").all()
    serializer_class = OrderSerializer


class AircraftViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint to retrieve aircraft."""
    queryset = Aircraft.objects.all()
    serializer_class = AircraftSerializer


class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint to retrieve materials and parts."""
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer


class ETLImportView(APIView):
    """Accepts an uploaded Excel file, runs ETL, and returns change statistics."""
    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("file")
        if uploaded_file:
            source = uploaded_file
        else:
            default_path = getattr(settings, "DEFAULT_EXCEL_PATH", None)
            if not default_path or not default_path.exists():
                return Response(
                    {"error": "No file uploaded and default excel file was not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            source = default_path

        try:
            stats = load_excel(source)
            return Response({"status": "success", "stats": stats})
        except Exception as e:
            return Response({"error": f"Failed to process Excel file: {e}"}, status=status.HTTP_400_BAD_REQUEST)


class ETLExportView(APIView):
    """Exports the current database state as an Excel workbook."""
    def get(self, request, *args, **kwargs):
        buffer = export_excel()
        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="aircraft_materials_export.xlsx"'
        return response
