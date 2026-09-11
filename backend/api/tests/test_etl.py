import io
from datetime import date
import pytest
import pandas as pd
from django.conf import settings
from api.models import Aircraft, Material, Order
from api.services.etl import load_excel, export_excel


@pytest.mark.django_db
class TestETLService:
    def test_load_default_excel(self):
        stats = load_excel(settings.DEFAULT_EXCEL_PATH)

        assert stats["aircraft"]["created"] == 3
        assert stats["aircraft"]["updated"] == 0
        assert stats["aircraft"]["total"] == 3

        assert stats["materials"]["created"] == 20
        assert stats["materials"]["updated"] == 0
        assert stats["materials"]["total"] == 20

        assert stats["orders"]["created"] == 10
        assert stats["orders"]["updated"] == 0
        assert stats["orders"]["total"] == 10

        assert Aircraft.objects.count() == 3
        assert Material.objects.count() == 20
        assert Order.objects.count() == 10

        # Verify aircraft natural key
        ca = Aircraft.objects.get(serial_number="CA33SN12345")
        assert ca.model == "Coyote Aero"
        assert ca.manufacturer == "Acme Corporation"
        assert ca.capacity == 200

        # Verify material natural key
        mat = Material.objects.get(part_number="0001-01")
        assert mat.name == "Aluminum Sheet"
        assert mat.type == "Metal"
        assert float(mat.weight) == 50.0

        # Verify order compound key
        order = Order.objects.filter(aircraft=ca, material=mat).first()
        assert order is not None
        assert order.status == Order.Status.ARRIVED
        assert order.arrival_date == date(2023, 1, 15)
        assert order.id == f"{ca.serial_number}_{mat.part_number}_{order.arrival_date}"

    def test_load_idempotency(self):
        load_excel(settings.DEFAULT_EXCEL_PATH)
        stats = load_excel(settings.DEFAULT_EXCEL_PATH)

        assert stats["aircraft"]["created"] == 0
        assert stats["aircraft"]["updated"] == 0
        assert stats["aircraft"]["deleted"] == 0
        assert stats["aircraft"]["total"] == 3

        assert stats["materials"]["created"] == 0
        assert stats["materials"]["updated"] == 0
        assert stats["materials"]["deleted"] == 0
        assert stats["materials"]["total"] == 20

        assert stats["orders"]["created"] == 0
        assert stats["orders"]["updated"] == 0
        assert stats["orders"]["deleted"] == 0
        assert stats["orders"]["total"] == 10

    def test_export_excel(self):
        load_excel(settings.DEFAULT_EXCEL_PATH)
        buf = export_excel()
        assert isinstance(buf, io.BytesIO)

        sheets = pd.read_excel(buf, sheet_name=None)
        assert "Aircrafts" in sheets
        assert "Materials" in sheets
        assert "Orders" in sheets
        assert len(sheets["Aircrafts"]) == 3
        assert len(sheets["Materials"]) == 20
        assert len(sheets["Orders"]) == 10
