import io
from datetime import date
import pytest
import pandas as pd
from django.conf import settings
from api.models import Aircraft, Material, Order
from api.services.etl import ETLService


@pytest.mark.django_db
class TestETLService:
    def test_import_default_excel(self):
        diff = ETLService.import_excel(settings.DEFAULT_EXCEL_PATH)

        assert diff["aircraft"]["created"] == 3
        assert diff["materials"]["created"] == 20
        assert diff["orders"]["created"] == 10

        assert Aircraft.objects.count() == 3
        assert Material.objects.count() == 20
        assert Order.objects.count() == 10

        # verify aircraft
        ca = Aircraft.objects.get(serial_number="CA33SN12345")
        assert ca.model == "Coyote Aero"
        assert ca.manufacturer == "Acme Corporation"
        assert ca.capacity == 200

        # verify material
        mat = Material.objects.get(part_number="0001-01")
        assert mat.name == "Aluminum Sheet"
        assert mat.type == "Metal"
        assert float(mat.weight) == 50.0

        # verify order
        order = Order.objects.filter(aircraft=ca, material=mat).first()
        assert order is not None
        assert order.status == Order.Status.ARRIVED
        assert order.arrival_date == date(2023, 1, 15)

    def test_import_idempotency(self):
        diff1 = ETLService.import_excel(settings.DEFAULT_EXCEL_PATH)
        assert diff1["aircraft"]["created"] == 3

        # second run should not create or update anything
        diff2 = ETLService.import_excel(settings.DEFAULT_EXCEL_PATH)
        assert diff2["aircraft"]["created"] == 0
        assert diff2["aircraft"]["updated"] == 0
        assert diff2["aircraft"]["deleted"] == 0
        assert diff2["aircraft"]["total"] == 3

        assert diff2["materials"]["created"] == 0
        assert diff2["materials"]["updated"] == 0
        assert diff2["materials"]["deleted"] == 0
        assert diff2["materials"]["total"] == 20

        assert diff2["orders"]["created"] == 0
        assert diff2["orders"]["updated"] == 0
        assert diff2["orders"]["deleted"] == 0
        assert diff2["orders"]["total"] == 10

    def test_import_with_updates_and_deletions(self):
        ETLService.import_excel(settings.DEFAULT_EXCEL_PATH)

        # modified excel with 1 updated aircraft, 1 new, others removed
        modified_aircraft = pd.DataFrame([
            {
                "Serial Number": "CA33SN12345",
                "Model": "Coyote Aero Modified",
                "Manufacturer": "Acme Corp Ltd",
                "Capacity": 250,
                "Configuration": "16",
            },
            {
                "Serial Number": "NEW_SN_999",
                "Model": "Falcon 900",
                "Manufacturer": "Dassault",
                "Capacity": 19,
                "Configuration": "VIP",
            },
        ])

        materials = pd.DataFrame([
            {"PN": "0001-01", "Name": "Aluminum Sheet Updated", "Type": "Metal", "Weight": 52.5},
        ])

        orders = pd.DataFrame([
            {
                "Aircraft Serial Number": "CA33SN12345",
                "Material PN": "0001-01",
                "Arrival Date": "2023-01-15",
                "Status": "Pending",
            }
        ])

        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            modified_aircraft.to_excel(writer, sheet_name="Aircrafts", index=False)
            materials.to_excel(writer, sheet_name="Materials", index=False)
            orders.to_excel(writer, sheet_name="Orders", index=False)
        buf.seek(0)

        diff = ETLService.import_excel(buf, sync_delete=True)

        assert diff["aircraft"]["created"] == 1
        assert diff["aircraft"]["updated"] == 1
        assert diff["aircraft"]["deleted"] == 2
        assert diff["aircraft"]["total"] == 2

        assert diff["materials"]["created"] == 0
        assert diff["materials"]["updated"] == 1
        assert diff["materials"]["deleted"] == 19

        assert diff["orders"]["updated"] == 1
        assert diff["orders"]["deleted"] == 9

    def test_export_to_excel(self):
        ETLService.import_excel(settings.DEFAULT_EXCEL_PATH)

        buffer = ETLService.export_excel()
        assert isinstance(buffer, io.BytesIO)

        exported_sheets = pd.read_excel(buffer, sheet_name=None)
        assert "Aircrafts" in exported_sheets
        assert "Materials" in exported_sheets
        assert "Orders" in exported_sheets

        assert len(exported_sheets["Aircrafts"]) == 3
        assert len(exported_sheets["Materials"]) == 20
        assert len(exported_sheets["Orders"]) == 10

        assert list(exported_sheets["Aircrafts"].columns) == [
            "Serial Number", "Model", "Manufacturer", "Capacity", "Configuration"
        ]
        assert list(exported_sheets["Materials"].columns) == ["PN", "Name", "Type", "Weight"]
        assert list(exported_sheets["Orders"].columns) == [
            "Aircraft Serial Number", "Material PN", "Arrival Date", "Status"
        ]
