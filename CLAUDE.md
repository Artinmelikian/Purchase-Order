# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

No test suite or linter is configured.

## Environment

Requires `.env.local` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_CONFIRM_PASSWORD=...
```

`src/lib/supabase.js` exports an `isConfigured` boolean — all components guard against `null` supabase when env vars are missing.

## Architecture

Single-page app with three tabs managed in `App.jsx`: **Նոր Հայտ** (create), **Ակտիվ Հայտեր** (pending approval), **Հաստատված հայտեր** (confirmed + download).

**Data flow:**
1. `POForm` → inserts into `purchase_orders` (status `pending`) + `po_items`
2. `PendingOrders` → lists pending orders; clicking opens `OrderPreviewModal` which fetches items and shows full details; footer has two actions:
   - **Խmbagrел (Edit)** → opens `EditOrderModal` which updates the order and replaces all `po_items` in place (status stays `pending`)
   - **Hastatел (Confirm)** → opens `PasswordModal`
3. `PasswordModal` → compares input against `VITE_CONFIRM_PASSWORD`; on success updates order to `status='confirmed'`
4. `ConfirmedOrders` → lists confirmed/downloaded orders; download renders `PODocument` into a hidden off-screen div, captures it with `html2canvas` → `jsPDF` (A4 JPEG), then increments `download_count` and sets `status='downloaded'`

**PDF generation** (`src/utils/pdfExport.js`): uses `html2canvas` with `allowTaint: true` + JPEG encoding (not PNG — jsPDF has PNG corruption issues with cross-origin images). Content taller than A4 is sliced across pages manually.

**All Armenian text** is centralised in `src/constants.js` as the `T` export object — edit there for any copy changes.

**Static assets in `public/`:**
- `aregai-header.png` — full-width dark header banner used in both app UI and PDF
- `director-sig.jpg` — hardcoded director signature; always rendered in the PDF beside the responsible person's name (not uploaded per order)

## Database

Tables: `purchase_orders`, `po_items` (see `supabase-setup.sql`).  
RLS is **disabled** on both tables — anon key has full access.  
Storage bucket `signatures` must be set to **public**.

Run `supabase-setup.sql` to create both tables and disable RLS.

## Deployment

Vercel — set the three env vars in the dashboard. `vercel.json` rewrites all routes to `index.html` for SPA routing.
