from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from api.services.etl import load_excel


class Command(BaseCommand):
    help = "Load aircraft, materials, and orders from an Excel file into SQLite."

    def add_arguments(self, parser):
        parser.add_argument(
            "file_path",
            nargs="?",
            type=str,
            default=None,
            help="Path to the Excel file (default: aircraft_materials.xlsx in project root)",
        )
        parser.add_argument(
            "--no-sync-delete",
            action="store_true",
            default=False,
            help="Do not delete records from the database that are missing in the Excel file",
        )

    def handle(self, *args, **options):
        file_path_arg = options.get("file_path")
        sync_delete = not options.get("no_sync_delete")

        if file_path_arg:
            target_path = Path(file_path_arg)
        else:
            target_path = getattr(settings, "DEFAULT_EXCEL_PATH", None)
            if not target_path or not target_path.exists():
                target_path = Path(__file__).resolve().parent.parent.parent.parent.parent / "aircraft_materials.xlsx"

        if not target_path or not target_path.exists():
            raise CommandError(f"Excel file not found at '{target_path}'. Please provide a valid file path.")

        self.stdout.write(f"Loading data from: {target_path} (sync_delete={sync_delete})...")

        try:
            stats = load_excel(target_path, sync_delete=sync_delete)
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Loaded {stats['aircraft']['total']} aircraft (+{stats['aircraft']['created']} new, ~{stats['aircraft']['updated']} modified), "
                    f"{stats['materials']['total']} materials (+{stats['materials']['created']} new, ~{stats['materials']['updated']} modified), "
                    f"and {stats['orders']['total']} orders (+{stats['orders']['created']} new, ~{stats['orders']['updated']} modified)."
                )
            )
        except Exception as e:
            raise CommandError(f"Data load failed: {e}")
