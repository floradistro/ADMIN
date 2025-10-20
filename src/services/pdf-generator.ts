import { ProductList } from '../types/lists';

export function generatePDFHTML(list: ProductList): string {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const rows = list.products.map((product) => {
    const cells = list.columns.map(column => {
      let value = product.snapshot[column.field];
      
      if (value === undefined && column.type === 'blueprint') {
        const blueprintField = product.productData?.blueprint_fields?.find(
          (bf: any) => bf.field_name === column.field
        );
        value = blueprintField?.field_value;
      }
      
      if (value === undefined) {
        value = product.productData[column.field as keyof typeof product.productData];
      }
      
      const formatted = formatCellValue(value, column.field);
      return `<td>${formatted}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('');

  const headers = list.columns.map(col => `<th>${col.label}</th>`).join('');
  const uniqueCategories = countUniqueCategories(list);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${list.name}</title>
  <style>
    @font-face {
      font-family: 'DonGraffiti';
      src: url('/DonGraffiti.otf') format('opentype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }

    @page {
      size: ${list.columns.length > 5 ? 'landscape' : 'portrait'};
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #000;
      font-size: 9pt;
      line-height: 1.3;
      background: #ffffff;
    }

    .container {
      width: 100%;
    }

    .header {
      background: #000000;
      padding: 30px 40px;
      border-bottom: 4px solid #000000;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      height: 40px;
      width: auto;
      display: block;
    }

    .brand-title {
      font-family: 'DonGraffiti', cursive, sans-serif;
      font-size: 32pt;
      color: #ffffff;
      font-weight: 400;
      letter-spacing: 3px;
      margin: 0;
    }

    .title-bar {
      background: #ffffff;
      padding: 24px 40px;
      border-bottom: 2px solid #000000;
    }

    .doc-title {
      font-size: 20pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      color: #000000;
    }

    .doc-meta {
      font-size: 9pt;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .description {
      padding: 20px 40px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      font-size: 9pt;
      color: #333333;
      font-style: italic;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      background: #000000;
      color: #ffffff;
      padding: 12px 20px;
      text-align: left;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 3px solid #000000;
    }

    tbody td {
      padding: 12px 20px;
      border-bottom: 0.5px solid #e5e5e5;
      font-size: 8pt;
      vertical-align: top;
      color: #333333;
    }

    tbody tr:nth-child(even) {
      background-color: #fafafa;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .footer {
      background: #000000;
      padding: 30px 40px;
      text-align: center;
      border-top: 4px solid #000000;
      page-break-inside: avoid;
    }

    .footer-brand {
      font-family: 'DonGraffiti', cursive, sans-serif;
      font-size: 24pt;
      color: #ffffff;
      font-weight: 400;
      letter-spacing: 3px;
      margin-bottom: 8px;
    }

    .footer-tagline {
      font-size: 9pt;
      color: #999999;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }

    .footer-info {
      font-size: 8pt;
      color: #666666;
      margin-top: 4px;
    }

    .footer-copyright {
      font-size: 7pt;
      color: #444444;
      margin-top: 4px;
    }

    @media print {
      body { margin: 0; padding: 0; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <img src="/logo.png" alt="Logo" class="logo" onerror="this.style.display='none'">
        <h1 class="brand-title">FLORA DISTRO</h1>
      </div>
    </div>

    <div class="title-bar">
      <div class="doc-title">${list.name}</div>
      <div class="doc-meta">
        ${list.products.length} ${list.products.length === 1 ? 'Product' : 'Products'} • ${date}
      </div>
    </div>

    ${list.description ? `<div class="description">${list.description}</div>` : ''}

    <table>
      <thead>
        <tr>${headers}</tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">
      <div class="footer-brand">FLORA DISTRO</div>
      <div class="footer-tagline">Premium Cannabis Distribution</div>
      <div class="footer-info">Generated from live inventory data</div>
      <div class="footer-copyright">© ${new Date().getFullYear()} Flora Distribution. All rights reserved.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function formatCellValue(value: any, field: string): string {
  if (value === null || value === undefined) return '-';
  
  if (Array.isArray(value)) {
    if (field === 'categories') {
      return value.map((cat: any) => cat.name || cat).join(', ');
    }
    if (field === 'inventory') {
      const total = value.reduce((sum: number, inv: any) => sum + (inv.stock || inv.quantity || 0), 0);
      return String(total);
    }
    return value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
  }
  
  if (typeof value === 'object') {
    if (field === 'price' || field === 'regular_price' || field === 'sale_price') {
      return String(value);
    }
    return JSON.stringify(value);
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
}

function countUniqueCategories(list: ProductList): number {
  const categories = new Set<string>();
  list.products.forEach(product => {
    const cats = product.snapshot.categories || product.productData.categories;
    if (Array.isArray(cats)) {
      cats.forEach((cat: any) => {
        const name = typeof cat === 'object' ? cat.name : cat;
        if (name) categories.add(name);
      });
    }
  });
  return categories.size;
}

