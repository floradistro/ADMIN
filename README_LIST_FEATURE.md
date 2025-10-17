# Product List Management Feature

## Overview

A powerful, industry-leading list management system that allows users to create, manage, export, and email curated product lists with full customization.

## Features

### 1. **List Creation**
- Select products from the main grid
- Configure which columns/fields to include
- Customize export settings (images, COA, pricing, inventory)
- Add name and description for easy organization

### 2. **List Management**
- View all saved lists
- Search and filter lists
- Sort by name, date, or product count
- View list metadata (creation date, export count, last exported)
- Duplicate lists for quick templates
- Delete lists

### 3. **List Viewing**
- Full table view of list data
- All selected columns visible
- Quick export and email options

### 4. **Export Options**
- **PDF Export**: Beautiful dark-themed PDFs with auto-table formatting
- **CSV Export**: Standard CSV format for Excel/Sheets
- Configurable page orientation and paper size
- Includes header with list name, description, and metadata

### 5. **Email Integration**
- Send lists via email directly from the dashboard
- WordPress/WooCommerce integration
- Beautiful HTML email template with dark theme
- Support for multiple recipients
- Custom message option
- Email tracking (export count)

## Usage

### Creating a List

1. Select products from the product grid
2. Click "Create List" button (appears when products are selected)
3. Configure your list:
   - Enter name and description
   - Select columns to include
   - Choose export settings
4. Click "Create List"

### Managing Lists

1. Click "My Lists" button to view all lists
2. Use search and filters to find specific lists
3. Actions available:
   - View: Open full table view
   - Export: Download as PDF or CSV
   - Email: Send to recipients
   - Duplicate: Create a copy
   - Delete: Remove list

### Exporting

**PDF:**
- Dark theme matching dashboard aesthetic
- Auto-sized columns
- Page numbers and metadata
- Professional formatting

**CSV:**
- Standard format
- All columns included
- Compatible with Excel, Google Sheets, etc.

### Emailing

1. Click "Email" on any list
2. Enter recipient email addresses (comma-separated)
3. Customize subject and add message
4. Click "Send Email"

The email includes:
- Beautiful dark-themed HTML template
- Product table with images
- List configuration badges
- Professional branding

## Technical Details

### Components

- `ListFeature`: Main wrapper component
- `CreateListModal`: List creation dialog
- `ListManager`: List management interface
- `ListViewer`: Full list table view
- `EmailListDialog`: Email composition dialog

### State Management

- Uses React Context (`ListContext`) for global state
- Local storage for persistence
- Hooks: `useProductLists` for list operations

### Services

- `ListExportService`: Handles PDF and CSV generation
- Uses `jspdf` and `jspdf-autotable` for PDF export

### API Endpoints

- `POST /api/lists/email`: Send list via email
- WordPress integration via Flora REST API

### WordPress Integration

- Email handler: `/wp-json/flora/v1/email/send`
- Located in `flora-inventory-matrix` plugin
- Uses WordPress `wp_mail()` function
- Supports custom email templates

## Data Structure

### ProductList
```typescript
{
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  products: ListProduct[];
  columns: ListColumn[];
  settings: {
    theme: 'dark' | 'light';
    includeImages: boolean;
    includeCOA: boolean;
    includePricing: boolean;
    includeInventory: boolean;
  };
  metadata: {
    totalProducts: number;
    lastExported?: string;
    exportCount: number;
  };
}
```

## Future Enhancements

- Excel (.xlsx) export format
- Scheduled email sending
- List sharing with team members
- Custom email templates
- Automated list generation based on rules
- Integration with pricing matrix
- QR codes for quick list access
- List versioning/history

## Notes

- Lists are stored in browser local storage
- All data snapshots at time of list creation
- Export counts tracked for analytics
- Email integration requires WordPress plugin active
- Dark theme maintained across all interfaces

