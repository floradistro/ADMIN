import { ProductList } from '../types/lists';
import { generatePDFHTML } from './pdf-generator';

export class ListExportService {
  static async exportToPDF(list: ProductList): Promise<Blob> {
    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow pop-ups.');
    }

    const html = generatePDFHTML(list);
    printWindow.document.write(html);
    printWindow.document.close();

    await new Promise((resolve) => {
      printWindow.onload = resolve;
      setTimeout(resolve, 300);
    });

    printWindow.focus();
    printWindow.print();

    setTimeout(() => {
      printWindow.close();
    }, 200);

    return new Blob([''], { type: 'application/pdf' });
  }

  static async exportToCSV(list: ProductList): Promise<Blob> {
    const headers = list.columns.map(col => col.label);
    const rows = list.products.map(product => {
      return list.columns.map(column => {
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
        
        return this.formatCellValue(value, column.field);
      });
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        const escaped = String(cell).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',') + '\n';
    });

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static formatCellValue(value: any, field: string): string {
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
}
