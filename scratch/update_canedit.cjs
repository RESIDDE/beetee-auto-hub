const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/VehiclesList.tsx',
  'src/pages/VehicleForm.tsx',
  'src/pages/VehicleDetail.tsx',
  'src/pages/Sales.tsx',
  'src/pages/ResaleVehicles.tsx',
  'src/pages/PerformanceQuotes.tsx',
  'src/pages/Invoices.tsx',
  'src/pages/Inspections.tsx',
  'src/pages/Inquiries.tsx',
  'src/pages/Customers.tsx',
  'src/pages/AuthorityToSell.tsx',
];

const basePath = 'c:/Users/HP/Desktop/bee tee autos';

for (const relPath of files) {
  const filePath = path.join(basePath, relPath);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  // Add import for usePermissions if not present
  if (!content.includes('import { usePermissions }')) {
    content = content.replace(
      /import \{ useAuth \} from "@\/hooks\/useAuth";/,
      `import { useAuth } from "@/hooks/useAuth";\nimport { usePermissions } from "@/hooks/usePermissions";`
    );
    modified = true;
  }

  // Find where useAuth() is called and add usePermissions() right after it
  if (!content.includes('const { permissions } = usePermissions();')) {
    content = content.replace(
      /const \{ role([^}]*)\} = useAuth\(\);/,
      `const { role$1} = useAuth();\n  const { permissions } = usePermissions();`
    );
    modified = true;
  }

  // Update canEdit calls
  const editRegex = /const hasEdit = canEdit\(role, "([^"]+)"\);/g;
  if (editRegex.test(content)) {
    content = content.replace(editRegex, `const hasEdit = canEdit(role, "$1", permissions);`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${relPath}`);
  }
}
