import io
import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.conf import settings
from api.models import Aircraft, Material, Order


@pytest.mark.django_db
class TestLoadDataCLI:
    def test_load_data_default(self):
        out = io.StringIO()
        call_command("load_data", stdout=out)
        output = out.getvalue()

        assert "Loaded 3 aircraft" in output
        assert Aircraft.objects.count() == 3
        assert Material.objects.count() == 20
        assert Order.objects.count() == 10

    def test_load_data_with_explicit_path(self):
        out = io.StringIO()
        call_command("load_data", str(settings.DEFAULT_EXCEL_PATH), stdout=out)
        output = out.getvalue()

        assert "Loaded 3 aircraft" in output
        assert Aircraft.objects.count() == 3

    def test_load_data_nonexistent_file(self):
        with pytest.raises(CommandError) as exc:
            call_command("load_data", "/non/existent/path.xlsx")
        assert "not found" in str(exc.value)
