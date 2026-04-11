
# Fix vehicle make entry + professional invoice linkage

## What I found
- The same custom `VehicleMakeModelSelector` is used in both Add Vehicle and Repairs, so the make-selection bug appears in both places.
- That selector is built with a fragile homemade dropdown (`mousedown` + local open/filter state), which is why click/touch selection and free typing are unreliable.
- The current invoice page already stores invoice links, but the linking is incomplete:
  - Sales and Repairs do not launch invoice creation with their own record prefilled
  - invoice printing currently pulls repairs by `customer_id`, not by the actual `invoice_repairs` links
  - invoice display is not fetching the full linked customer/vehicle/sale/repair context for a clean professional output

## Plan

### 1. Rebuild the shared vehicle make/model/year selector
- Replace the current `FilterableInput` logic in `src/components/VehicleMakeModelSelector.tsx` with a fully controlled combobox-style selector that works for:
  - typing a custom make if it is not in the list
  - tapping/clicking a listed make to select it
  - doing the same for model and year
- Add an explicit “Use custom value” option so missing brands/models can always be saved.
- Keep the make → model dependency so changing make resets model correctly.

### 2. Apply the selector fix everywhere it is reused
- Update:
  - `src/pages/VehicleForm.tsx`
  - `src/pages/RepairsMaintenance.tsx`
- Make sure Repairs handles both flows cleanly:
  - inventory vehicle selected
  - manual make/model/year entered
- Ensure manual values remain editable and are not silently overridden by the inventory dropdown.

### 3. Properly link invoices from Sales and Repairs
- Add a professional “Generate Invoice” action on:
  - `src/pages/Sales.tsx`
  - `src/pages/RepairsMaintenance.tsx`
- When clicked, open the invoice flow with the relevant record already preselected:
  - sale invoice from a sale
  - repair invoice from a repair
- If a repair has no customer yet, require selecting a customer before invoicing it.

### 4. Fix invoice data loading and printing
- Update `src/pages/Invoices.tsx` so invoices load with their real linked data:
  - customer
  - sale and sold vehicle
  - linked repairs via `invoice_repairs`
- Fix the print/download logic so it includes only the repairs attached to that invoice, not every repair for the same customer.
- Show clear sections for customer details, vehicle details, repair lines, totals, notes, due date, and status.

### 5. Polish the invoice experience
- Keep the invoice page as the central place for:
  - creating a sale invoice
  - creating a repair invoice
  - creating a combined invoice
- Improve the layout for a more professional printable result with clean spacing, branded header, and proper Naira formatting.
- Prevent duplicate/disconnected invoice creation by surfacing already-linked invoice data where appropriate.

## Files to update
- `src/components/VehicleMakeModelSelector.tsx`
- `src/pages/VehicleForm.tsx`
- `src/pages/RepairsMaintenance.tsx`
- `src/pages/Sales.tsx`
- `src/pages/Invoices.tsx`

## Technical details
- No new database migration is strictly required for this specific fix because the needed tables/columns already exist:
  - `invoices`
  - `invoice_repairs`
  - `repairs.customer_id`
  - `repairs.manual_make/manual_model/manual_year`
- The main invoice bug is in the current logic that uses all repairs for a customer instead of the repairs actually linked to the invoice.
- The make-entry issue should be fixed once in the shared selector component so both Add Vehicle and Repairs are corrected together.
