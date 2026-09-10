# Aircraft Parts & Materials Management System

An end-to-end full-stack solution featuring an ETL pipeline with **Python & Pandas**, a **Django REST Framework (DRF)** backend with **SQLite**, and a modern **React + Vite** frontend.

## Architecture Overview

- **Backend (`/backend`)**:
  - Django 5 & Django REST Framework (DRF)
  - SQLite database
  - Pandas ETL service with automated synchronization and diff metrics (created, updated, deleted)
  - Two-way Excel export and upload sync endpoints
  - Automated tests with pytest
- **Frontend (`/frontend`)**:
  - React + TypeScript + Vite
  - Tailwind CSS with aerospace design system guidelines
  - Orders summary dashboard, live filtering, and detailed specification modals

## Quick Start

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Seed or sync database via API:
```bash
curl -X POST http://localhost:8000/api/etl/import/
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## License
[MIT](LICENSE)
