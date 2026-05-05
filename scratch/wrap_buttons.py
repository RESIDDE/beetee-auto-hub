import os

def wrap_button(file_path, search_text, has_edit_key):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    found = False
    i = 0
    while i < len(lines):
        line = lines[i]
        if search_text in line and '<Button' in line and not found:
            # Found the button start
            indent = line[:line.find('<Button')]
            new_lines.append(f"{indent}{{hasEdit && (\n")
            
            # Add the button line with more indent
            new_lines.append("  " + line)
            
            # Find the closing </Button>
            j = i + 1
            while j < len(lines) and '</Button>' not in lines[j]:
                new_lines.append("  " + lines[j])
                j += 1
            
            if j < len(lines):
                new_lines.append("  " + lines[j])
                new_lines.append(f"{indent}  )}}\n")
                i = j + 1
                found = True
            else:
                # Should not happen
                i += 1
        else:
            new_lines.append(line)
            i += 1
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

# Fix Sales.tsx
wrap_button('src/pages/Sales.tsx', 'Record Sale', 'sales')

# Fix VehiclesList.tsx
wrap_button('src/pages/VehiclesList.tsx', 'Add Vehicle', 'vehicles')

# Fix ResaleVehicles.tsx
wrap_button('src/pages/ResaleVehicles.tsx', 'Add Vehicle', 'vehicles')

# Fix Customers.tsx
wrap_button('src/pages/Customers.tsx', 'Add Customer', 'customers')

# Fix Invoices.tsx
wrap_button('src/pages/Invoices.tsx', 'Create Invoice', 'invoices')

# Fix Inquiries.tsx
wrap_button('src/pages/Inquiries.tsx', 'New Inquiry', 'inquiries')

# Fix Inspections.tsx
wrap_button('src/pages/Inspections.tsx', 'New Inspection', 'inspections')

# Fix AuthorityToSell.tsx
wrap_button('src/pages/AuthorityToSell.tsx', 'New Authority', 'authority-to-sell')

# Fix PerformanceQuotes.tsx
wrap_button('src/pages/PerformanceQuotes.tsx', 'New Proforma', 'performance-quotes')
