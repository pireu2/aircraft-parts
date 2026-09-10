# Aircraft Materials & Orders - Frontend

React single-page application for managing aircraft parts, orders, and materials reconciliation. Built with React 19, TypeScript, Vite, Tailwind CSS, and shadcn UI.

## Features

- **Orders Management**: Live status filtering (`All`, `Arrived`, `Pending`, `Requested`), client-side text search across aircraft models and part numbers.
- **Bidirectional Table Sorting**: Sortable across all data columns (Aircraft, Material & Part, Type, Weight, Arrival Date, Status).
- **KPI Summary Strip**: High-contrast summary metrics with skeleton loading states.
- **Specification Modals**: Accessible Radix UI dialogs displaying detailed aircraft specs and material specs with reciprocal cross-linking.
- **Excel Import & Reconciliation**: Multipart `.xlsx` workbook upload displaying live diffs (`created`, `updated`, `deleted`, `total`).
- **Data Export & Wipe**: Two-way `.xlsx` workbook export and database wipe with safety confirmation.

## Development

```bash
# install dependencies
npm install

# start local development server
npm run dev

# build for production
npm run build
```
