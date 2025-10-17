# Label Printing Fix - Blueprint Fields Display

## Issue
Label printing view was not displaying blueprint fields correctly after switching to the new fields system. Some fields were showing while others weren't.

## Root Cause
The list export and viewing system was only accessing direct properties on product objects (`product.name`, `product.sku`, etc.) but blueprint fields are stored in a separate `blueprint_fields` array structure:

```typescript
product.blueprint_fields = [
  {
    field_name: 'thca_percentage',
    field_value: '25%',
    field_label: 'THCA %',
    ...
  }
]
```

## Files Modified

### 1. `/src/hooks/useProductLists.ts`
**Function:** `extractProductSnapshot()`

**Changes:**
- Added blueprint field detection when column type is 'blueprint'
- Searches through `product.blueprint_fields` array to find matching field by name
- Extracts `field_value` from the blueprint field object

**Before:**
```typescript
snapshot[column.field] = (product as any)[column.field];
```

**After:**
```typescript
if (column.type === 'blueprint') {
  const blueprintField = product.blueprint_fields?.find(
    bf => bf.field_name === fieldName
  );
  snapshot[column.field] = blueprintField?.field_value ?? '';
}
```

### 2. `/src/components/features/ListViewer.tsx`
**Function:** `getValue()`

**Changes:**
- Updated to accept column parameter for type checking
- Added fallback logic to check `blueprint_fields` array when value not in snapshot
- Ensures blueprint fields display correctly in the table view

### 3. `/src/services/list-export-service.ts`
**Methods:** `exportToPDF()` and `exportToCSV()`

**Changes:**
- Both export methods now check if column is a blueprint type
- Search `blueprint_fields` array for matching field name
- Extract `field_value` for proper PDF/CSV rendering

## How It Works

1. **List Creation:** When creating a list, `extractProductSnapshot()` now detects blueprint columns and properly extracts values from the `blueprint_fields` array

2. **List Display:** The viewer now checks column type and searches blueprint fields when displaying values

3. **Export:** Both PDF and CSV exports follow the same logic to ensure blueprint fields appear in exported documents

## Testing Instructions

1. Navigate to the inventory view
2. Select products that have blueprint fields assigned (e.g., THCA %, Effect, Lineage, Nose, Terpene, Type)
3. Create a new list and include blueprint field columns
4. Verify fields display in the list viewer
5. Export to PDF and verify blueprint fields appear
6. Export to CSV and verify blueprint fields appear

## Blueprint Field Types Supported

All field types from the new fields system are now supported:
- Text fields
- Number fields  
- Textarea fields
- Select/dropdown fields
- Email fields
- URL fields
- Any custom field types

## Status
✅ **FIXED** - All blueprint fields now display correctly in:
- List viewer (on-screen display)
- PDF exports (labels)
- CSV exports

## Notes
- The fix maintains backward compatibility with standard product fields
- Includes proper fallbacks if fields are missing
- No breaking changes to existing functionality

