import pytest
from django.conf import settings
from rest_framework.test import APIClient
from api.services.etl import load_excel


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seeded_db():
    load_excel(settings.DEFAULT_EXCEL_PATH)


@pytest.mark.django_db
class TestAPIEndpoints:
    def test_get_orders_list(self, api_client, seeded_db):
        response = api_client.get("/api/orders/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10

        # Check natural compound key and nested objects
        first_order = data[0]
        assert "id" in first_order
        assert "aircraft" in first_order
        assert "serial_number" in first_order["aircraft"]
        assert "material" in first_order
        assert "part_number" in first_order["material"]
        assert "arrival_date" in first_order
        assert "status" in first_order

    def test_aircraft_list_and_detail(self, api_client, seeded_db):
        response = api_client.get("/api/aircraft/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        detail_response = api_client.get("/api/aircraft/CA33SN12345/")
        assert detail_response.status_code == 200
        detail = detail_response.json()
        assert detail["serial_number"] == "CA33SN12345"
        assert detail["model"] == "Coyote Aero"
        assert detail["name"] == "Acme Corporation Coyote Aero"

    def test_material_list_and_detail(self, api_client, seeded_db):
        response = api_client.get("/api/materials/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 20

        detail_response = api_client.get("/api/materials/0001-01/")
        assert detail_response.status_code == 200
        detail = detail_response.json()
        assert detail["part_number"] == "0001-01"
        assert detail["name"] == "Aluminum Sheet"
        assert float(detail["weight"]) == 50.0

    def test_etl_import_api(self, api_client):
        response = api_client.post("/api/etl/import/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "stats" in data
        assert data["stats"]["aircraft"]["created"] == 3
        assert data["stats"]["materials"]["created"] == 20
        assert data["stats"]["orders"]["created"] == 10

    def test_etl_export_api(self, api_client, seeded_db):
        response = api_client.get("/api/etl/export/")
        assert response.status_code == 200
        assert response["Content-Type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert 'attachment; filename="aircraft_materials_export.xlsx"' in response["Content-Disposition"]
        assert len(response.content) > 0
