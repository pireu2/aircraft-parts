import io
from pathlib import Path
from decimal import Decimal
from typing import Union
import pandas as pd
from django.db import transaction
from api.models import Aircraft, Material, Order


def load_excel(file_source: Union[str, Path, io.BytesIO], sync_delete: bool = True) -> dict:
    """Load aircraft, materials, and orders from an Excel file into SQLite with change stats."""
    sheets = pd.read_excel(file_source, sheet_name=None)

    lower_sheets = {str(k).strip().lower(): v for k, v in sheets.items()}
    df_aircraft = lower_sheets.get("aircrafts") if "aircrafts" in lower_sheets else lower_sheets.get("aircraft")
    df_materials = lower_sheets.get("materials") if "materials" in lower_sheets else lower_sheets.get("material")
    df_orders = lower_sheets.get("orders") if "orders" in lower_sheets else lower_sheets.get("order")

    if df_aircraft is None or df_materials is None or df_orders is None:
        raise ValueError("Excel file must contain Aircrafts, Materials, and Orders sheets.")

    df_aircraft.columns = [str(c).strip() for c in df_aircraft.columns]
    df_materials.columns = [str(c).strip() for c in df_materials.columns]
    df_orders.columns = [str(c).strip() for c in df_orders.columns]

    stats = {
        "aircraft": {"created": 0, "updated": 0, "deleted": 0, "total": 0},
        "materials": {"created": 0, "updated": 0, "deleted": 0, "total": 0},
        "orders": {"created": 0, "updated": 0, "deleted": 0, "total": 0},
    }

    with transaction.atomic():
        # 1. Process Aircraft
        existing_ac = {a.serial_number: (a.model, a.manufacturer, a.capacity, a.configuration) for a in Aircraft.objects.all()}
        incoming_ac_sns = set()
        aircraft_objects = []

        for row in df_aircraft.to_dict("records"):
            sn = str(row.get("Serial Number", "")).strip()
            if not sn or sn.lower() == "nan":
                continue
            incoming_ac_sns.add(sn)
            capacity_raw = pd.to_numeric(row.get("Capacity", 0), errors="coerce")
            capacity = int(capacity_raw) if pd.notnull(capacity_raw) else 0
            model = str(row.get("Model", "")).strip()
            manufacturer = str(row.get("Manufacturer", "")).strip()
            configuration = str(row.get("Configuration", "")).strip()

            if sn in existing_ac:
                if existing_ac[sn] != (model, manufacturer, capacity, configuration):
                    stats["aircraft"]["updated"] += 1
            else:
                stats["aircraft"]["created"] += 1

            aircraft_objects.append(
                Aircraft(
                    serial_number=sn,
                    model=model,
                    manufacturer=manufacturer,
                    capacity=capacity,
                    configuration=configuration,
                )
            )

        Aircraft.objects.bulk_create(
            aircraft_objects,
            update_conflicts=True,
            update_fields=["model", "manufacturer", "capacity", "configuration"],
            unique_fields=["serial_number"],
        )

        if sync_delete:
            deleted_ac = set(existing_ac.keys()) - incoming_ac_sns
            if deleted_ac:
                stats["aircraft"]["deleted"] = len(deleted_ac)
                Aircraft.objects.filter(serial_number__in=deleted_ac).delete()

        # 2. Process Materials
        existing_mat = {m.part_number: (m.name, m.type, m.weight) for m in Material.objects.all()}
        incoming_mat_pns = set()
        material_objects = []

        for row in df_materials.to_dict("records"):
            pn = str(row.get("PN", "")).strip()
            if not pn or pn.lower() == "nan":
                continue
            incoming_mat_pns.add(pn)
            weight_raw = pd.to_numeric(row.get("Weight", 0.0), errors="coerce")
            weight = Decimal(str(round(float(weight_raw), 2))) if pd.notnull(weight_raw) else Decimal("0.00")
            name = str(row.get("Name", "")).strip()
            mat_type = str(row.get("Type", "")).strip()

            if pn in existing_mat:
                if existing_mat[pn] != (name, mat_type, weight):
                    stats["materials"]["updated"] += 1
            else:
                stats["materials"]["created"] += 1

            material_objects.append(
                Material(
                    part_number=pn,
                    name=name,
                    type=mat_type,
                    weight=weight,
                )
            )

        Material.objects.bulk_create(
            material_objects,
            update_conflicts=True,
            update_fields=["name", "type", "weight"],
            unique_fields=["part_number"],
        )

        if sync_delete:
            deleted_mat = set(existing_mat.keys()) - incoming_mat_pns
            if deleted_mat:
                stats["materials"]["deleted"] = len(deleted_mat)
                Material.objects.filter(part_number__in=deleted_mat).delete()

        # 3. Process Orders
        parsed_dates = pd.to_datetime(df_orders["Arrival Date"], errors="coerce").dt.date
        df_orders["Parsed_Arrival_Date"] = parsed_dates

        existing_ord = {o.id: o.status for o in Order.objects.all()}
        valid_ac = set(Aircraft.objects.values_list("serial_number", flat=True))
        valid_mat = set(Material.objects.values_list("part_number", flat=True))

        incoming_ord_ids = set()
        order_objects = []

        for row in df_orders.to_dict("records"):
            ac_sn = str(row.get("Aircraft Serial Number", "")).strip()
            mat_pn = str(row.get("Material PN", "")).strip()
            arr_date = row.get("Parsed_Arrival_Date")
            status = str(row.get("Status", Order.Status.REQUESTED)).strip()

            if not ac_sn or not mat_pn or not arr_date or pd.isnull(arr_date):
                continue
            if ac_sn not in valid_ac or mat_pn not in valid_mat:
                continue

            order_id = f"{ac_sn}_{mat_pn}_{arr_date}"
            incoming_ord_ids.add(order_id)

            if order_id in existing_ord:
                if existing_ord[order_id] != status:
                    stats["orders"]["updated"] += 1
            else:
                stats["orders"]["created"] += 1

            order_objects.append(
                Order(
                    id=order_id,
                    aircraft_id=ac_sn,
                    material_id=mat_pn,
                    arrival_date=arr_date,
                    status=status,
                )
            )

        Order.objects.bulk_create(
            order_objects,
            update_conflicts=True,
            update_fields=["status"],
            unique_fields=["id"],
        )

        if sync_delete:
            deleted_ord = set(existing_ord.keys()) - incoming_ord_ids
            if deleted_ord:
                stats["orders"]["deleted"] = len(deleted_ord)
                Order.objects.filter(id__in=deleted_ord).delete()

    stats["aircraft"]["total"] = Aircraft.objects.count()
    stats["materials"]["total"] = Material.objects.count()
    stats["orders"]["total"] = Order.objects.count()

    return stats


def export_excel() -> io.BytesIO:
    """Export SQLite database records to an Excel workbook buffer."""
    aircraft_qs = Aircraft.objects.all().values("serial_number", "model", "manufacturer", "capacity", "configuration")
    df_ac = pd.DataFrame(list(aircraft_qs))
    if not df_ac.empty:
        df_ac.rename(
            columns={
                "serial_number": "Serial Number",
                "model": "Model",
                "manufacturer": "Manufacturer",
                "capacity": "Capacity",
                "configuration": "Configuration",
            },
            inplace=True,
        )

    materials_qs = Material.objects.all().values("part_number", "name", "type", "weight")
    df_mat = pd.DataFrame(list(materials_qs))
    if not df_mat.empty:
        df_mat.rename(
            columns={
                "part_number": "PN",
                "name": "Name",
                "type": "Type",
                "weight": "Weight",
            },
            inplace=True,
        )

    orders_qs = Order.objects.all().values("aircraft_id", "material_id", "arrival_date", "status")
    df_ord = pd.DataFrame(list(orders_qs))
    if not df_ord.empty:
        df_ord.rename(
            columns={
                "aircraft_id": "Aircraft Serial Number",
                "material_id": "Material PN",
                "arrival_date": "Arrival Date",
                "status": "Status",
            },
            inplace=True,
        )

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df_ac.to_excel(writer, sheet_name="Aircrafts", index=False)
        df_mat.to_excel(writer, sheet_name="Materials", index=False)
        df_ord.to_excel(writer, sheet_name="Orders", index=False)

    buffer.seek(0)
    return buffer
