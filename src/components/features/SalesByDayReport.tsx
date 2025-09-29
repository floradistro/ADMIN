'use client';

import React, { useState } from 'react';
import { useReports, SalesByDayData, DateRange } from '../../hooks/useReports';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface SalesByDayReportProps {
  refreshing?: boolean;
}

export function SalesByDayReport({ refreshing }: SalesByDayReportProps) {
  const { salesByDayData, loading, error, dateRange, updateDateRange, fetchSalesByDay } = useReports();
  
  // Debug logging
  console.log('SalesByDayReport render:', { salesByDayData: salesByDayData.length, loading, error });
  
  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-900">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 mb-2 font-medium">Unable to Load Report</p>
          <p className="text-neutral-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => fetchSalesByDay()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleDateRangeChange = async (newRange: DateRange) => {
    updateDateRange(newRange);
    await fetchSalesByDay(newRange);
    setCurrentPage(1); // Reset to first page when date changes
    setSelectedRows(new Set()); // Clear selection when data changes
  };

  // Selection handlers
  const handleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, index) => startIndex + index)));
    }
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // Calculate pagination - only paginate if we have more items than itemsPerPage
  const totalItems = salesByDayData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = totalItems <= itemsPerPage ? salesByDayData : salesByDayData.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when items per page changes
    setSelectedRows(new Set()); // Clear selection when pagination changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRows(new Set()); // Clear selection when changing pages
  };

  // Calculate totals for the current paginated view
  const calculateTotals = (data: SalesByDayData[]) => {
    if (data.length === 0) return null;
    
    return data.reduce((totals, day) => {
      return {
        'Gross Sales': totals['Gross Sales'] + (day['Gross Sales'] || 0),
        'Gross Profit': totals['Gross Profit'] + (day['Gross Profit'] || 0),
        'Invoices Sold': totals['Invoices Sold'] + (day['Invoices Sold'] || 0),
        'Transaction Average': 0, // Will calculate after
        'Total Item Count': totals['Total Item Count'] + (day['Total Item Count'] || 0),
        'Gross Margin': 0, // Will calculate after
        'Total Invoiced': totals['Total Invoiced'] + (day['Total Invoiced'] || 0),
        'Subtotal': totals['Subtotal'] + (day['Subtotal'] || 0),
        'Cash': totals['Cash'] + (day['Cash'] || 0),
        'CARD': totals['CARD'] + (day['CARD'] || 0),
        'Integrated Card Payment (US)': totals['Integrated Card Payment (US)'] + (day['Integrated Card Payment (US)'] || 0)
      };
    }, {
      'Gross Sales': 0,
      'Gross Profit': 0,
      'Invoices Sold': 0,
      'Transaction Average': 0,
      'Total Item Count': 0,
      'Gross Margin': 0,
      'Total Invoiced': 0,
      'Subtotal': 0,
      'Cash': 0,
      'CARD': 0,
      'Integrated Card Payment (US)': 0
    });
  };

  // Calculate totals for ALL data in the filtered view, not just current page
  const totals = calculateTotals(salesByDayData);
  if (totals && totals['Invoices Sold'] > 0) {
    totals['Transaction Average'] = totals['Gross Sales'] / totals['Invoices Sold'];
    totals['Gross Margin'] = totals['Subtotal'] > 0 ? (totals['Gross Profit'] / totals['Subtotal']) * 100 : 0;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Export Functions
  const exportToCSV = () => {
    if (salesByDayData.length === 0) return;

    const headers = [
      'Date',
      'Gross Sales',
      'Gross Profit', 
      'Invoices Sold',
      'Transaction Average',
      'Total Item Count',
      'Cash',
      'CARD',
      'Integrated Card Payment (US)',
      'Gross Margin (%)',
      'Subtotal',
      'Total Tax',
      'Total Invoiced',
      'Total Cost',
      'Total Discount',
      'Items Per Transaction',
      'Total Quantity',
      'Gift Card Sales'
    ];

    const csvData = salesByDayData.map(day => [
      formatDate(day.Date),
      day['Gross Sales'] || 0,
      day['Gross Profit'] || 0,
      day['Invoices Sold'] || 0,
      day['Transaction Average'] || 0,
      day['Total Item Count'] || 0,
      day['Cash'] || 0,
      day['CARD'] || 0,
      day['Integrated Card Payment (US)'] || 0,
      day['Gross Margin'] || 0,
      day['Subtotal'] || 0,
      day['Total Tax'] || 0,
      day['Total Invoiced'] || 0,
      day['Total Cost'] || 0,
      day['Total Discount'] || 0,
      day['Items Per Transaction'] || 0,
      day['Total Quantity'] || 0,
      day['Gift Card Sales'] || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-by-day-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (salesByDayData.length === 0) return;

    const exportData = {
      dateRange,
      generatedAt: new Date().toISOString(),
      totalRecords: salesByDayData.length,
      totals,
      data: salesByDayData
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-by-day-${dateRange.startDate}-to-${dateRange.endDate}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (salesByDayData.length === 0) return;

    try {
      // Dynamic import for client-side only
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      
      // Load and add company logo
      try {
        const logoResponse = await fetch('/logo.png');
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
        
        // Add logo (top left corner)
        doc.addImage(logoBase64, 'PNG', 15, 15, 12, 12);
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }
      
      // OFFICIAL BANK-STYLE LETTERHEAD
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 25, 25);
      doc.text('FLORA DISTRO', 32, 22);
      
      // Company details in smaller, professional font
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('4111 E Rose Lake Dr, Charlotte, NC 28217', 32, 27);
      
      // Statement date area in top right
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.3);
      doc.rect(130, 15, 65, 20, 'FD');
      
      // Statement period and details in top right box
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 25, 25);
      doc.text('STATEMENT PERIOD', 135, 21);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`${dateRange.startDate} to ${dateRange.endDate}`, 135, 26);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`, 135, 30);
      
      // Statement-style header box (smaller now)
      doc.setFillColor(240, 242, 247);
      doc.setDrawColor(200, 205, 215);
      doc.setLineWidth(0.3);
      doc.rect(15, 40, 180, 15, 'FD');
      
      // Report title in statement style
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 25, 25);
      doc.text('SALES BY DAY STATEMENT', 20, 50);
      
      // ACCOUNT SUMMARY SECTION (Bank statement style)
      if (totals) {
        doc.setFillColor(250, 251, 252);
        doc.setDrawColor(220, 225, 235);
        doc.rect(15, 60, 180, 45, 'FD');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 25, 25);
        doc.text('ACCOUNT SUMMARY', 20, 70);
        
        // Summary grid - bank statement style
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        // Left column
        doc.text('Total Business Days:', 20, 80);
        doc.text('Gross Sales Amount:', 20, 87);
        doc.text('Gross Profit Amount:', 20, 94);
        doc.text('Total Transactions:', 20, 101);
        
        // Left values - bold and right aligned
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 25, 25);
        doc.text(`${salesByDayData.length}`, 85, 80, { align: 'right' });
        doc.text(`${formatCurrency(totals['Gross Sales'])}`, 85, 87, { align: 'right' });
        doc.text(`${formatCurrency(totals['Gross Profit'])}`, 85, 94, { align: 'right' });
        doc.text(`${totals['Invoices Sold'].toLocaleString()}`, 85, 101, { align: 'right' });
        
        // Right column
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Average Transaction:', 105, 80);
        doc.text('Total Items Sold:', 105, 87);
        doc.text('Cash Receipts:', 105, 94);
        doc.text('Card Receipts:', 105, 101);
        
        // Right values - bold and right aligned
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 25, 25);
        doc.text(`${formatCurrency(totals['Transaction Average'])}`, 175, 80, { align: 'right' });
        doc.text(`${totals['Total Item Count'].toLocaleString()}`, 175, 87, { align: 'right' });
        doc.text(`${formatCurrency(totals['Cash'] || 0)}`, 175, 94, { align: 'right' });
        doc.text(`${formatCurrency(totals['CARD'] || 0)}`, 175, 101, { align: 'right' });
      }

      // TRANSACTION DETAILS HEADER
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(25, 25, 25);
      doc.text('DAILY TRANSACTION DETAILS', 20, 120);

      // Table data
      const tableData = salesByDayData.map(day => [
        formatDate(day.Date).toUpperCase(),
        formatCurrency(day['Gross Sales']),
        formatCurrency(day['Gross Profit']),
        day['Invoices Sold'].toLocaleString(),
        formatCurrency(day['Transaction Average']),
        day['Total Item Count'].toLocaleString(),
        formatPercent(day['Gross Margin'])
      ]);

      // Bank statement style table
      autoTable(doc, {
        head: [['DATE', 'GROSS SALES', 'GROSS PROFIT', 'TRANSACTIONS', 'AVG TRANSACTION', 'ITEMS SOLD', 'MARGIN %']],
        body: tableData,
        startY: 130,
        margin: { left: 15, right: 15 },
        styles: { 
          fontSize: 8,
          cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
          lineColor: [220, 225, 235],
          lineWidth: 0.3,
          textColor: [25, 25, 25],
          font: 'helvetica'
        },
        headStyles: { 
          fillColor: [45, 55, 72],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: { 
          fillColor: [248, 250, 252] 
        },
        columnStyles: {
          0: { cellWidth: 28, halign: 'left', fontStyle: 'bold' }, // Date
          1: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }, // Gross Sales
          2: { cellWidth: 26, halign: 'right' }, // Gross Profit
          3: { cellWidth: 22, halign: 'center' }, // Invoices
          4: { cellWidth: 26, halign: 'right' }, // Avg Transaction
          5: { cellWidth: 22, halign: 'center' }, // Items
          6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' } // Margin
        },
        theme: 'grid'
      });
      
      // OFFICIAL FOOTER - Bank statement style
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 205, 215);
        doc.setLineWidth(0.3);
        doc.line(15, 275, 195, 275);
        
        // Footer content
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('FLORA DISTRO - CONFIDENTIAL BUSINESS STATEMENT', 15, 282);
        doc.text(`Page ${i} of ${pageCount}`, 95, 282, { align: 'center' });
        doc.text(`${new Date().toLocaleDateString()}`, 195, 282, { align: 'right' });
        
        doc.setFontSize(6);
        doc.text('This statement contains confidential and proprietary business information.', 15, 287);
      }

      doc.save(`FLORA-DISTRO-Sales-Statement-${dateRange.startDate}-to-${dateRange.endDate}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const keyMetrics = salesByDayData.length > 0 ? salesByDayData[0] : null;

  return (
    <>
      {/* Header */}
      <div className="px-4 py-1 border-b border-white/[0.04] bg-neutral-900 flex-shrink-0">
        <div className="flex items-center justify-between w-full relative">
          {/* Left section - Report Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-white/[0.05] border border-white/[0.08]">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-white font-tiempos">Sales by Day</h2>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-2 py-1 text-xs rounded border transition-colors font-tiempos ${
                showFilters 
                  ? 'bg-white/[0.08] border-white/[0.12] text-neutral-300' 
                  : 'bg-white/[0.05] border-white/[0.08] text-neutral-400 hover:bg-white/[0.08] hover:text-neutral-300'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filters
            </button>
            
            {/* Export Buttons */}
            {salesByDayData.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-neutral-300 rounded transition-colors font-tiempos"
                  title="Export as CSV"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={exportToJSON}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-neutral-300 rounded transition-colors font-tiempos"
                  title="Export as JSON"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  JSON
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-neutral-300 rounded transition-colors font-tiempos"
                  title="Export as PDF"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
              </div>
            )}
          </div>

          {/* Right section - Date Range and Items Per Page */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-tiempos">
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="bg-neutral-900/40 border border-white/[0.08] rounded px-2 py-1 text-neutral-300 text-xs focus:border-white/[0.2] focus:outline-none font-tiempos"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
            <div className="text-xs text-neutral-400 font-tiempos">
              {dateRange.startDate} to {dateRange.endDate}
            </div>
          </div>
        </div>

        {/* Date Range Filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-neutral-900/40 rounded border border-white/[0.08]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 font-tiempos">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.08] rounded text-neutral-300 text-xs focus:border-white/[0.2] focus:outline-none font-tiempos"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 font-tiempos">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.08] rounded text-neutral-300 text-xs focus:border-white/[0.2] focus:outline-none font-tiempos"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollable-container bg-neutral-900 relative min-h-0">
        {/* Loading Overlay */}
        {(loading || refreshing) && (
          <div className="absolute inset-0 bg-neutral-900/80 flex items-center justify-center z-50">
            <div className="text-center">
              <LoadingSpinner />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="border-b border-white/[0.04] px-4 py-3 bg-neutral-900/60">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-neutral-300 text-sm font-tiempos">{error}</span>
              <button
                onClick={() => fetchSalesByDay()}
                className="ml-4 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-neutral-300 rounded text-xs transition-colors font-tiempos"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !refreshing && !error && salesByDayData.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="text-center text-neutral-400">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.05] border border-white/[0.08] mb-4 mx-auto">
                <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-2 text-neutral-300 font-tiempos">No Sales Data</h3>
              <p className="text-xs text-neutral-500 font-tiempos">No sales data found for the selected date range.</p>
            </div>
          </div>
        )}

        {/* Table View */}
        {!loading && !refreshing && !error && salesByDayData.length > 0 && (
          <div className="min-w-full">
            {/* Table Header */}
            <div className="sticky top-0 bg-neutral-800/80 backdrop-blur border-b border-white/[0.08] px-4 py-2 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-neutral-400 font-tiempos">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} days
                  </div>
                  {selectedRows.size > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-blue-400 font-tiempos">
                        {selectedRows.size} selected
                      </div>
                      <button
                        onClick={clearSelection}
                        className="text-xs text-neutral-400 hover:text-neutral-300 underline font-tiempos"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-neutral-300 rounded transition-colors font-tiempos"
                  >
                    {selectedRows.size === paginatedData.length && paginatedData.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-neutral-400 uppercase tracking-wider font-tiempos">
                <div className="flex-1 min-w-24">Date</div>
                <div className="flex-1 min-w-24 text-right">Sales</div>
                <div className="flex-1 min-w-24 text-right">Profit</div>
                <div className="flex-1 min-w-16 text-right">Orders</div>
                <div className="flex-1 min-w-20 text-right">Avg</div>
                <div className="flex-1 min-w-16 text-right">Items</div>
                <div className="flex-1 min-w-20 text-right">Cash</div>
                <div className="flex-1 min-w-20 text-right">Card</div>
                <div className="flex-1 min-w-20 text-right">Integrated</div>
                <div className="flex-1 min-w-16 text-right">Margin</div>
              </div>
            </div>

            {/* Totals Row */}
            {totals && (
              <div className="bg-neutral-800/50 border-b border-white/[0.08] px-4 py-2">
                <div className="flex items-center gap-3 text-xs font-medium text-white font-tiempos">
                  <div className="flex-1 min-w-24">TOTALS ({totalItems} days)</div>
                  <div className="flex-1 min-w-24 text-right">{formatCurrency(totals['Gross Sales'])}</div>
                  <div className="flex-1 min-w-24 text-right">{formatCurrency(totals['Gross Profit'])}</div>
                  <div className="flex-1 min-w-16 text-right">{totals['Invoices Sold']}</div>
                  <div className="flex-1 min-w-20 text-right">{formatCurrency(totals['Transaction Average'])}</div>
                  <div className="flex-1 min-w-16 text-right">{totals['Total Item Count']}</div>
                  <div className="flex-1 min-w-20 text-right">{formatCurrency(totals['Cash'] || 0)}</div>
                  <div className="flex-1 min-w-20 text-right">{formatCurrency(totals['CARD'] || 0)}</div>
                  <div className="flex-1 min-w-20 text-right">{formatCurrency(totals['Integrated Card Payment (US)'] || 0)}</div>
                  <div className="flex-1 min-w-16 text-right">{formatPercent(totals['Gross Margin'])}</div>
                </div>
              </div>
            )}

            {/* Data Rows */}
            <div>
              {paginatedData.map((day, index) => {
                const globalIndex = startIndex + index;
                const isSelected = selectedRows.has(globalIndex);
                
                return (
                  <div
                    key={index}
                    className={`group transition-all mb-2 rounded-lg border-b border-white/[0.02] product-card cursor-pointer ${
                      isSelected 
                        ? 'bg-neutral-800/50 border-l-4 border-l-neutral-400' 
                        : 'border border-white/[0.04]'
                    }`}
                    onClick={(e) => {
                      // Only trigger selection if clicking on the main row area, not on interactive elements
                      const target = e.target as HTMLElement;
                      const isInteractiveElement = target.tagName === 'INPUT' || 
                                                 target.tagName === 'BUTTON' || 
                                                 target.tagName === 'SELECT' ||
                                                 target.tagName === 'TEXTAREA' ||
                                                 target.closest('button') ||
                                                 target.closest('input') ||
                                                 target.closest('select') ||
                                                 target.closest('textarea');
                      
                      if (!isInteractiveElement) {
                        handleRowSelection(globalIndex);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 px-4 py-2 cursor-pointer select-none">
                      <div className="flex items-center gap-3 text-xs text-neutral-300 font-tiempos w-full">
                        <div className="flex-1 min-w-24">{formatDate(day.Date)}</div>
                        <div className="flex-1 min-w-24 text-right font-medium">{formatCurrency(day['Gross Sales'])}</div>
                        <div className="flex-1 min-w-24 text-right font-medium">{formatCurrency(day['Gross Profit'])}</div>
                        <div className="flex-1 min-w-16 text-right">{day['Invoices Sold']}</div>
                        <div className="flex-1 min-w-20 text-right">{formatCurrency(day['Transaction Average'])}</div>
                        <div className="flex-1 min-w-16 text-right">{day['Total Item Count']}</div>
                        <div className="flex-1 min-w-20 text-right text-neutral-400">{formatCurrency(day['Cash'] || 0)}</div>
                        <div className="flex-1 min-w-20 text-right text-neutral-400">{formatCurrency(day['CARD'] || 0)}</div>
                        <div className="flex-1 min-w-20 text-right text-neutral-400">{formatCurrency(day['Integrated Card Payment (US)'] || 0)}</div>
                        <div className="flex-1 min-w-16 text-right font-medium">{formatPercent(day['Gross Margin'])}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !refreshing && !error && totalPages > 1 && (
          <div className="sticky bottom-0 bg-neutral-900 border-t border-white/[0.08] px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-400 font-tiempos">
                Page {currentPage} of {totalPages} ({totalItems} days)
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] disabled:bg-neutral-800/50 disabled:text-neutral-500 disabled:cursor-not-allowed rounded border border-white/[0.08] transition-colors text-neutral-300 font-tiempos"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 py-1 text-xs rounded border transition-colors font-tiempos ${
                          pageNum === currentPage
                            ? 'bg-white/[0.12] border-white/[0.16] text-white'
                            : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08] text-neutral-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs bg-white/[0.05] hover:bg-white/[0.08] disabled:bg-neutral-800/50 disabled:text-neutral-500 disabled:cursor-not-allowed rounded border border-white/[0.08] transition-colors text-neutral-300 font-tiempos"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
