# Aircraft Parts & Materials Management System

A lean, high-polish full-stack solution featuring:
- **ETL CLI Script**: Python & Pandas loading data from Excel into SQLite.
- **Django REST Framework API**: Clean endpoints for orders, aircraft, and materials.
- **React Frontend**: Modern summary table with client-side status filtering, instant search, sorting, and detail modals.

## Architecture & Data Design

- **Natural Primary Keys**:
  - `Aircraft`: Serial Number (`serial_number`) is the natural primary key (e.g. `CA33SN12345`).
  - `Material`: Part Number (`part_number`) is the natural primary key (e.g. `0001-01`).
  - `Order`: Natural compound key (`{aircraft_serial}_{material_pn}_{arrival_date}`) with explicit unique constraints.
  - Deterministic identifiers without artificial UUIDs.
- **Backend (`/backend`)**:
  - Django 5 & Django REST Framework (DRF)
  - SQLite database (`db.sqlite3`)
  - Idempotent ETL loader (`load_excel`) with bulk upserts
  - CLI management command: `python manage.py load_data [optional_path]`
  - Pytest automated test suite
- **Frontend (`/frontend`)**:
  - React 19 + TypeScript + Vite + Tailwind CSS
  - KPI summary metrics computed on the client
  - Orders summary table with instant search, status filtering, and column sorting
  - Specification dialogs for both Aircraft and Materials

## Quick Start

### 1. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

### 2. Loading Data (ETL Process)

Run the Django management command to load `aircraft_materials.xlsx` into SQLite:

```bash
# Load default aircraft_materials.xlsx from project root
python manage.py load_data

# Or load from an explicit file path:
python manage.py load_data /path/to/aircraft_materials.xlsx
```

### 3. Running Backend Server & Tests

```bash
# Run backend server (http://localhost:8000)
python manage.py runserver

# Run test suite
pytest
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To run the frontend linter and build:
```bash
npm run lint
npm run build
```
