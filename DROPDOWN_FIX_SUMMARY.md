# Dropdown Mobile Centering Fix

## Problem
Dropdowns were not properly centered on mobile devices using various positioning attempts.

## Solution
Use **separate mobile and desktop renders** with flexbox centering for mobile:

### Mobile Approach (< 768px)
```tsx
<div className="md:hidden fixed inset-0 top-auto bottom-16 flex items-end justify-center z-[9999] pointer-events-none">
  <div className="w-[calc(100%-2rem)] max-w-sm ... pointer-events-auto">
    {/* Content */}
  </div>
</div>
```

**Key Classes:**
- `fixed inset-0 top-auto bottom-16` - Fixed to bottom, full width
- `flex items-end justify-center` - **Flexbox horizontal centering**
- `pointer-events-none` on wrapper, `pointer-events-auto` on content
- `w-[calc(100%-2rem)]` - Width with 1rem padding each side
- `max-w-sm` - Maximum 384px width

### Desktop Approach (>= 768px)
```tsx
<div className="hidden md:block absolute right-2 top-full mt-1 w-44 ...">
  {/* Content */}
</div>
```

**Key Classes:**
- `hidden md:block` - Only show on desktop
- `absolute right-2 top-full` - Position relative to button
- `w-44` - Fixed width

## Why This Works

1. **Flexbox `justify-center`** is the most reliable centering method
2. **Separate renders** avoid complex responsive class conflicts
3. **`pointer-events-none` on wrapper** allows clicks through to page
4. **`pointer-events-auto` on dropdown** catches dropdown clicks only

## Files Updated
- ✅ BulkActionsDropdown.tsx
- ⏳ ViewsDropdown.tsx
- ⏳ SettingsDropdown.tsx  
- ⏳ FilesDropdown.tsx

