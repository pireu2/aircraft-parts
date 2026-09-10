import io
from pathlib import Path
from typing import Dict, Any, Union

import pandas as pd
from django.db import transaction

from api.models import Aircraft, Material, Order


def _find_sheet(sheet_dict: Dict[str, pd.DataFrame], *candidates: str) -> pd.DataFrame:
    lower_map = {k.strip().lower(): v for k, v in sheet_dict.items()}
    for candidate in candidates:
        candidate_lower = candidate.lower()
        if candidate_lower in lower_map:
            return lower_map[candidate_lower]
    raise ValueError(f"sheet not found, expected one of {candidates}")


def _parse_dates(series: pd.Series) -> pd.Series:
    # excel serial date (days since 1899-12-30) or standard string
    numeric_s = pd.to_numeric(series, errors="coerce")
    dates_from_num = pd.to_datetime(numeric_s, unit="D", origin="1899-12-30", errors="coerce")
    dates_from_str = pd.to_datetime(series, errors="coerce")
    return dates_from_num.fillna(dates_from_str).dt.date


class ETLService:
    @classmethod
    def import_excel(cls, file_source: Union[str, Path, io.BytesIO], sync_delete: bool = True) -> Dict[str, Any]:
        # read sheets
        sheets = pd.read_excel(file_source, sheet_name=None)
        df_aircraft = _find_sheet(sheets, "Aircrafts", "Aircraft")
        df_materials = _find_sheet(sheets, "Materials", "Material")
        df_orders = _find_sheet(sheets, "Orders", "Order")

        # clean column names
        df_aircraft.columns = [str(c).strip() for c in df_aircraft.columns]
        df_materials.columns = [str(c).strip() for c in df_materials.columns]
        df_orders.columns = [str(c).strip() for c in df_orders.columns]

        diff = {
            "aircraft": {"created": 0, "updated": 0, "deleted": 0, "total": 0},
            "materials": {"created": 0, "updated": 0, "deleted": 0, "total": 0},
            "orders": {"created": 0, "updated": 0, "deleted": 0, "total": 0},
        }

        with transaction.atomic():
            initial_order_ids = set(Order.objects.values_list("id", flat=True))

            # sync aircraft
            existing_aircraft = {a.serial_number: a for a in Aircraft.objects.all()}
            seen_aircraft_keys = set()

            for _, row in df_aircraft.iterrows():
                sn = str(row.get("Serial Number", "")).strip()
                if not sn or sn == "nan":
                    continue
                seen_aircraft_keys.add(sn)

                model = str(row.get("Model", "")).strip()
                manufacturer = str(row.get("Manufacturer", "")).strip()
                capacity_raw = pd.to_numeric(row.get("Capacity", 0), errors="coerce")
                capacity = int(capacity_raw) if pd.notnull(capacity_raw) else 0
                configuration = str(row.get("Configuration", "")).strip()

                if sn in existing_aircraft:
                    obj = existing_aircraft[sn]
                    changed = (
                        obj.model != model
                        or obj.manufacturer != manufacturer
                        or obj.capacity != capacity
                        or obj.configuration != configuration
                    )
                    if changed:
                        obj.model = model
                        obj.manufacturer = manufacturer
                        obj.capacity = capacity
                        obj.configuration = configuration
                        obj.save()
                        diff["aircraft"]["updated"] += 1
                else:
                    new_obj = Aircraft.objects.create(
                        serial_number=sn,
                        model=model,
                        manufacturer=manufacturer,
                        capacity=capacity,
                        configuration=configuration,
                    )
                    existing_aircraft[sn] = new_obj
                    diff["aircraft"]["created"] += 1

            if sync_delete:
                to_delete = set(existing_aircraft.keys()) - seen_aircraft_keys
                if to_delete:
                    Aircraft.objects.filter(serial_number__in=to_delete).delete()
                    diff["aircraft"]["deleted"] += len(to_delete)

            diff["aircraft"]["total"] = Aircraft.objects.count()

            # sync materials
            existing_materials = {m.part_number: m for m in Material.objects.all()}
            seen_material_keys = set()

            for _, row in df_materials.iterrows():
                pn = str(row.get("PN", "")).strip()
                if not pn or pn == "nan":
                    continue
                seen_material_keys.add(pn)

                name = str(row.get("Name", "")).strip()
                mat_type = str(row.get("Type", "")).strip()
                weight_raw = pd.to_numeric(row.get("Weight", 0.0), errors="coerce")
                weight = round(float(weight_raw), 2) if pd.notnull(weight_raw) else 0.00

                if pn in existing_materials:
                    obj = existing_materials[pn]
                    changed = (
                        obj.name != name
                        or obj.type != mat_type
                        or float(obj.weight) != weight
                    )
                    if changed:
                        obj.name = name
                        obj.type = mat_type
                        obj.weight = weight
                        obj.save()
                        diff["materials"]["updated"] += 1
                else:
                    new_obj = Material.objects.create(
                        part_number=pn,
                        name=name,
                        type=mat_type,
                        weight=weight,
                    )
                    existing_materials[pn] = new_obj
                    diff["materials"]["created"] += 1

            if sync_delete:
                to_delete = set(existing_materials.keys()) - seen_material_keys
                if to_delete:
                    Material.objects.filter(part_number__in=to_delete).delete()
                    diff["materials"]["deleted"] += len(to_delete)

            diff["materials"]["total"] = Material.objects.count()

            # sync orders
            current_aircraft = {a.serial_number: a for a in Aircraft.objects.all()}
            current_materials = {m.part_number: m for m in Material.objects.all()}

            df_orders["Parsed_Arrival_Date"] = _parse_dates(df_orders["Arrival Date"])
            existing_orders = list(Order.objects.select_related("aircraft", "material").all())

            existing_order_map: Dict[tuple, list] = {}
            for o in existing_orders:
                key = (o.aircraft.serial_number, o.material.part_number, o.arrival_date)
                existing_order_map.setdefault(key, []).append(o)

            seen_order_ids = set()

            for _, row in df_orders.iterrows():
                ac_sn = str(row.get("Aircraft Serial Number", "")).strip()
                mat_pn = str(row.get("Material PN", "")).strip()
                arr_date = row.get("Parsed_Arrival_Date")
                status = str(row.get("Status", "Requested")).strip()

                if not ac_sn or not mat_pn or not arr_date or pd.isnull(arr_date):
                    continue

                if ac_sn not in current_aircraft or mat_pn not in current_materials:
                    continue

                key = (ac_sn, mat_pn, arr_date)
                order_list = existing_order_map.get(key, [])

                matched_order = None
                for candidate in order_list:
                    if candidate.id not in seen_order_ids:
                        matched_order = candidate
                        break

                if matched_order:
                    seen_order_ids.add(matched_order.id)
                    if matched_order.status != status:
                        matched_order.status = status
                        matched_order.save()
                        diff["orders"]["updated"] += 1
                else:
                    new_order = Order.objects.create(
                        aircraft=current_aircraft[ac_sn],
                        material=current_materials[mat_pn],
                        arrival_date=arr_date,
                        status=status,
                    )
                    seen_order_ids.add(new_order.id)
                    existing_order_map.setdefault(key, []).append(new_order)
                    diff["orders"]["created"] += 1

            if sync_delete:
                current_db_order_ids = set(Order.objects.values_list("id", flat=True))
                to_delete_ids = current_db_order_ids - seen_order_ids
                if to_delete_ids:
                    Order.objects.filter(id__in=to_delete_ids).delete()
                diff["orders"]["deleted"] = len(initial_order_ids - seen_order_ids)

            diff["orders"]["total"] = Order.objects.count()

        return diff

    @classmethod
    def export_excel(cls) -> io.BytesIO:
        aircraft_qs = Aircraft.objects.all().values(
            "serial_number", "model", "manufacturer", "capacity", "configuration"
        )
        df_aircraft = pd.DataFrame(list(aircraft_qs))
        if not df_aircraft.empty:
            df_aircraft = df_aircraft.rename(
                columns={
                    "serial_number": "Serial Number",
                    "model": "Model",
                    "manufacturer": "Manufacturer",
                    "capacity": "Capacity",
                    "configuration": "Configuration",
                }
            )
        else:
            df_aircraft = pd.DataFrame(
                columns=["Serial Number", "Model", "Manufacturer", "Capacity", "Configuration"]
            )

        materials_qs = Material.objects.all().values("part_number", "name", "type", "weight")
        df_materials = pd.DataFrame(list(materials_qs))
        if not df_materials.empty:
            df_materials["weight"] = df_materials["weight"].astype(float)
            df_materials = df_materials.rename(
                columns={
                    "part_number": "PN",
                    "name": "Name",
                    "type": "Type",
                    "weight": "Weight",
                }
            )
        else:
            df_materials = pd.DataFrame(columns=["PN", "Name", "Type", "Weight"])

        orders_qs = Order.objects.select_related("aircraft", "material").all()
        orders_data = [
            {
                "Aircraft Serial Number": o.aircraft.serial_number,
                "Material PN": o.material.part_number,
                "Arrival Date": o.arrival_date.strftime("%Y-%m-%d"),
                "Status": o.status,
            }
            for o in orders_qs
        ]
        df_orders = pd.DataFrame(orders_data)
        if df_orders.empty:
            df_orders = pd.DataFrame(
                columns=["Aircraft Serial Number", "Material PN", "Arrival Date", "Status"]
            )

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df_aircraft.to_excel(writer, sheet_name="Aircrafts", index=False)
            df_materials.to_excel(writer, sheet_name="Materials", index=False)
            df_orders.to_excel(writer, sheet_name="Orders", index=False)

        output.seek(0)
        return output
