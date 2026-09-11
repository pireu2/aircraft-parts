import pytest
from django.conf import settings
from rest_framework.test import APIClient
from api.models import Aircraft, Material, Order, ImportLog
from api.services.etl import ETLService


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seeded_db():
    ETLService.import_excel(settings.DEFAULT_EXCEL_PATH)


@pytest.mark.django_db
class TestAPIEndpoints:
    def test_get_orders_list(self, api_client, seeded_db):
        response = api_client.get("/api/orders/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10

        # check nested fields and uuids
        first_order = data[0]
        import uuid
        assert uuid.UUID(first_order["id"])
        assert uuid.UUID(first_order["aircraft"]["id"])
        assert uuid.UUID(first_order["material"]["id"])

        assert "aircraft" in first_order
        assert "serial_number" in first_order["aircraft"]
        assert "model" in first_order["aircraft"]

        assert "material" in first_order
        assert "part_number" in first_order["material"]
        assert "name" in first_order["material"]
        assert "weight" in first_order["material"]

        assert "arrival_date" in first_order
        assert "status" in first_order

    def test_orders_filtering_by_status(self, api_client, seeded_db):
        response = api_client.get("/api/orders/?status=Pending")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        for item in data:
            assert item["status"] == "Pending"

    def test_orders_search(self, api_client, seeded_db):
        response = api_client.get("/api/orders/?search=Batplane")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        for item in data:
            assert item["aircraft"]["model"] == "Batplane"

    def test_import_logs_endpoint(self, api_client):
        # initially empty
        res_empty = api_client.get("/api/import-logs/")
        assert res_empty.status_code == 200
        assert len(res_empty.json()) == 0

        # create a test log
        ImportLog.objects.create(
            action=ImportLog.Action.IMPORT,
            status=ImportLog.Status.SUCCESS,
            file_name="test_sheet.xlsx",
            total_created=5,
            total_records=5,
        )

        res = api_client.get("/api/import-logs/")
        assert res.status_code == 200
        logs = res.json()
        assert len(logs) == 1
        assert logs[0]["action"] == "import"
        assert logs[0]["file_name"] == "test_sheet.xlsx"
        assert logs[0]["total_created"] == 5

    def test_aircraft_detail(self, api_client, seeded_db):
        response = api_client.get("/api/aircraft/CA33SN12345/")
        assert response.status_code == 200
        data = response.json()

        assert data["serial_number"] == "CA33SN12345"
        assert data["model"] == "Coyote Aero"
        assert data["manufacturer"] == "Acme Corporation"
        assert data["capacity"] == 200
        assert "orders" in data
        assert len(data["orders"]) > 0
        assert "material_name" in data["orders"][0]

    def test_material_detail(self, api_client, seeded_db):
        response = api_client.get("/api/materials/0001-01/")
        assert response.status_code == 200
        data = response.json()

        assert data["part_number"] == "0001-01"
        assert data["name"] == "Aluminum Sheet"
        assert data["type"] == "Metal"
        assert float(data["weight"]) == 50.0
        assert "orders" in data
        assert len(data["orders"]) > 0
        assert "aircraft_model" in data["orders"][0]

    def test_detail_by_uuid(self, api_client, seeded_db):
        aircraft = Aircraft.objects.first()
        res_ac = api_client.get(f"/api/aircraft/{aircraft.id}/")
        assert res_ac.status_code == 200
        assert res_ac.json()["id"] == str(aircraft.id)

        material = Material.objects.first()
        res_mat = api_client.get(f"/api/materials/{material.id}/")
        assert res_mat.status_code == 200
        assert res_mat.json()["id"] == str(material.id)

    def test_etl_import_api(self, api_client):
        response = api_client.post("/api/etl/import/")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "diff" in data
        assert data["diff"]["aircraft"]["created"] == 3
        assert data["diff"]["materials"]["created"] == 20
        assert data["diff"]["orders"]["created"] == 10

        # verify import log created
        log = ImportLog.objects.filter(action=ImportLog.Action.IMPORT).first()
        assert log is not None
        assert log.status == ImportLog.Status.SUCCESS
        assert log.total_created == 33
        assert log.total_records == 33

    def test_etl_export_api(self, api_client, seeded_db):
        response = api_client.get("/api/etl/export/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert 'attachment; filename="aircraft_materials_export.xlsx"' in response["Content-Disposition"]
        assert len(response.content) > 0

    def test_etl_clear_api(self, api_client, seeded_db):
        assert Order.objects.count() > 0
        response = api_client.post("/api/etl/clear/")
        assert response.status_code == 200
        assert Order.objects.count() == 0
        assert Material.objects.count() == 0
        assert Aircraft.objects.count() == 0

        # verify clear log created
        log = ImportLog.objects.filter(action=ImportLog.Action.CLEAR).first()
        assert log is not None
        assert log.status == ImportLog.Status.SUCCESS
        assert log.total_deleted == 33
        assert log.total_records == 0
