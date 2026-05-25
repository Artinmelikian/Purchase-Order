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

`src/lib/supabase.js` exports an `isConfigured` boolean (checks URL starts with `https://` and key length > 10) — all components guard against `null` supabase when env vars are missing. A yellow warning banner is shown in the app when unconfigured.

## Architecture

Single-page app with three tabs managed in `App.jsx`: **Նոր Հայտ** (create), **Ակտիվ Հայտեր** (pending approval), **Հաuтатвад Hayтер** (confirmed + download).

After a successful form submit, `App.jsx` auto-switches to the pending tab and bumps a `pendingRefresh` counter passed as `key` to `PendingOrders` — this forces a fresh mount and re-fetch.

**Data flow:**
1. `POForm` → auto-generates PO number (MAX + 1, zero-padded to 3 digits by querying `po_number` descending), inserts into `purchase_orders` (status `'pending'`) + `po_items`. Items require name, unit, and quantity — validated via `showErrors` prop on `ItemsTable` (highlights missing fields red on first submit attempt).
2. `PendingOrders` → lists `status='pending'` orders; clicking opens `OrderPreviewModal` with full details. Footer actions:
   - **Edit** → opens `EditOrderModal`: pre-fills all fields, on save updates `purchase_orders` row then deletes + re-inserts all `po_items` (status stays `'pending'`)
   - **Delete** → opens `PasswordModal` in `deleteMode` (red styling); on correct password deletes the order (cascade deletes items via FK)
   - **Confirm** → opens `PasswordModal`; on correct password sets `status='confirmed'`, `confirmed_at=NOW()`
3. `PasswordModal` → no `<form>` tag (prevents Chrome save-password prompt); uses `autoComplete="new-password"`; compares input against `VITE_CONFIRM_PASSWORD`. Has a `deleteMode` prop for red button styling. `onSuccess(order.id)` is called on correct password.
4. `ConfirmedOrders` → fetches `status IN ('confirmed','downloaded')`; clicking a card opens `OrderPreviewModal` in `readOnly` mode (hides Edit + Confirm buttons, shows Delete). Actions per card:
   - **💳 Mark Paid** → sets `confirmPaidId` state → confirmation modal at `z-[60]` → on confirm, updates `payment_status='paid'`. Green **"Վchарved е"** badge appears only when paid; no badge shown otherwise.
   - **Download PDF** → renders `PODocument` into a hidden off-screen div, captures with `html2canvas` → `jsPDF` (A4 JPEG), saves file, increments `download_count`, sets `status='downloaded'`.

**`OrderPreviewModal`** is shared between Pending and Confirmed tabs via the `readOnly` prop. It always shows the Delete button (password-protected). It fetches `po_items` on mount.

**`ItemsTable`** is shared between `POForm` and `EditOrderModal`. Props: `items`, `onChange`, `readOnly` (default false), `showErrors` (default false). Quantity field is `type="number"`. Minimum 1 row; rows cannot be removed below 1.

**PDF generation** (`src/utils/pdfExport.js`): uses `html2canvas` with `allowTaint: true` + JPEG encoding at 0.92 quality (not PNG — jsPDF has PNG corruption issues with cross-origin images). Hidden render div uses `position: absolute; left: -9999px` (never `z-index: -1` — that causes zero-dimension canvas). Content taller than A4 is sliced across pages manually using canvas `drawImage` offsets.

**`PODocument`** renders a fixed `210mm` wide A4 div with inline styles (no Tailwind — html2canvas doesn't reliably capture utility classes). Always includes `/director-sig.jpg` inline beside the responsible person's name. Pads the items table with empty rows to a minimum of 3 rows.

**All Armenian text** is centralised in `src/constants.js` as the `T` export object — edit there for any copy changes.

> ⚠️ **Armenian text corruption risk**: When editing `constants.js`, use a Python script with explicit `chr(0xXXXX)` Unicode codepoints rather than typing or pasting Armenian characters directly. Direct edits frequently corrupt characters silently. Safe pattern:
> ```python
> lines = open('src/constants.js', 'rb').read().decode('utf-8').split('\n')
> # modify lines by index
> open('src/constants.js', 'w', encoding='utf-8').write('\n'.join(lines))
> ```

**Static assets in `public/`:**
- `aregai-header.png` — full-width dark header banner; used in both `App.jsx` header and `PODocument` PDF
- `director-sig.jpg` — hardcoded director signature rendered in every PDF beside the responsible person's name (not per-order; no upload UI)

Images must be in `public/` (not the project root) to be served correctly on Vercel.

## Database

Tables: `purchase_orders`, `po_items` (see `supabase-setup.sql`).  
RLS is **disabled** on both tables — anon key has full access.  
Storage bucket `signatures` must be set to **public**.

Key columns on `purchase_orders`:
- `status`: `'pending'` | `'confirmed'` | `'downloaded'`
- `payment_status`: `'paid'` | `null`
- `download_count`: integer, incremented on each PDF download
- `confirmed_at`: timestamptz, set when confirmed
- `po_number`: text, unique, zero-padded (e.g. `'001'`)

`po_items` has a foreign key `po_id → purchase_orders.id ON DELETE CASCADE`.

Run `supabase-setup.sql` to create both tables and disable RLS.

## Deployment

Vercel — set the three env vars in the dashboard. `vercel.json` rewrites all routes to `index.html` for SPA routing. Live at https://purchase-order-iota.vercel.app.
