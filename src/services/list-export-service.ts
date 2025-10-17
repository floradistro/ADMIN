import { ProductList } from '../types/lists';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class ListExportService {
  static async exportToPDF(list: ProductList): Promise<Blob> {
    const doc = new jsPDF({
      orientation: list.columns.length > 6 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set dark theme colors
    const darkBg = [26, 26, 26];
    const lightText = [255, 255, 255];
    const mutedText = [180, 180, 180];
    const accentColor = [59, 130, 246]; // Blue

    // Add header
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    doc.setTextColor(...lightText);
    doc.setFontSize(20);
    doc.text(list.name, 15, 15);
    
    if (list.description) {
      doc.setFontSize(10);
      doc.setTextColor(...mutedText);
      doc.text(list.description, 15, 25);
    }

    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text(`${list.products.length} products · Generated ${new Date().toLocaleString()}`, 15, 35);

    // Prepare table data
    const headers = list.columns.map(col => col.label);
    const rows = list.products.map(product => {
      return list.columns.map(column => {
        const value = product.snapshot[column.field] || product.productData[column.field as keyof typeof product.productData];
        return this.formatCellValue(value, column.field);
      });
    });

    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 45,
      theme: 'grid',
      styles: {
        fillColor: [42, 42, 42],
        textColor: [220, 220, 220],
        lineColor: [60, 60, 60],
        lineWidth: 0.1,
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [35, 35, 35],
      },
      margin: { top: 45, left: 10, right: 10 },
      didDrawPage: (data: any) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(...mutedText);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    });

    return doc.output('blob');
  }

  static async exportToCSV(list: ProductList): Promise<Blob> {
    const headers = list.columns.map(col => col.label);
    const rows = list.products.map(product => {
      return list.columns.map(column => {
        const value = product.snapshot[column.field] || product.productData[column.field as keyof typeof product.productData];
        return this.formatCellValue(value, column.field);
      });
    });

    // Create CSV content
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
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

