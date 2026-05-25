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
1. `POForm` → auto-generates PO number (MAX + 1, zero-padded to 3 digits), inserts into `purchase_orders` (status `pending`) + `po_items`. Items require name, unit, and quantity (validated via `showErrors` prop on `ItemsTable`).
2. `PendingOrders` → lists pending orders; clicking opens `OrderPreviewModal` which fetches items and shows full details; footer has two actions:
   - **Edit** → opens `EditOrderModal` which updates the order and replaces all `po_items` in place (delete + re-insert; status stays `pending`)
   - **Confirm** → opens `PasswordModal`
3. `PasswordModal` → no `<form>` tag (prevents Chrome save-password prompt); compares input against `VITE_CONFIRM_PASSWORD`; on success updates order to `status='confirmed'`. Has a `deleteMode` prop that changes button styling to red.
4. `ConfirmedOrders` → clicking an order opens `OrderPreviewModal` in `readOnly` mode (no edit/confirm buttons); separate Download button renders `PODocument` into a hidden off-screen `div`, captures with `html2canvas` → `jsPDF` (A4 JPEG), increments `download_count`, sets `status='downloaded'`. Has a payment flow: 💳 button sets `confirmPaidId` state → confirmation modal (z-[60]) → `handleMarkPaid` updates `payment_status='paid'`.

**PDF generation** (`src/utils/pdfExport.js`): uses `html2canvas` with `allowTaint: true` + JPEG encoding (not PNG — jsPDF has PNG corruption issues with cross-origin images). Hidden render div uses `position: absolute; left: -9999px` (never `z-index: -1` — that causes zero-dimension canvas). Content taller than A4 is sliced across pages manually.

**All Armenian text** is centralised in `src/constants.js` as the `T` export object — edit there for any copy changes.

> ⚠️ **Armenian text corruption risk**: When editing `constants.js`, use a Python script with explicit `chr(0xXXXX)` Unicode codepoints rather than typing or pasting Armenian characters directly. Direct edits frequently corrupt characters silently.

**Static assets in `public/`:**
- `aregai-header.png` — full-width dark header banner used in both app UI and PDF
- `director-sig.jpg` — hardcoded director signature; always rendered in the PDF beside the responsible person's name (not uploaded per order)

Images must be in `public/` (not the project root) to be served on Vercel.

## Database

Tables: `purchase_orders`, `po_items` (see `supabase-setup.sql`).  
RLS is **disabled** on both tables — anon key has full access.  
Storage bucket `signatures` must be set to **public**.

Key columns on `purchase_orders`:
- `status`: `'pending'` | `'confirmed'` | `'downloaded'`
- `payment_status`: `'paid'` | `null` (only shown as a green badge when `'paid'`; no badge otherwise)
- `download_count`: integer, incremented on each PDF download

Run `supabase-setup.sql` to create both tables and disable RLS.

## Deployment

Vercel — set the three env vars in the dashboard. `vercel.json` rewrites all routes to `index.html` for SPA routing. Live at https://purchase-order-iota.vercel.app.
