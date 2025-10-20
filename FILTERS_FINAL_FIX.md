# Mobile Filters - Final Fix

## Issue
Filters dropdown closing when clicking options inside it.

## Root Cause
The `stopPropagation()` on the content wrapper was preventing button clicks from registering properly.

## Solution

### Changed Event Handler on Backdrop
**From:**
```tsx
onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
```

**To:**
```tsx
onMouseDown={(e) => { 
  if (e.target === e.currentTarget) {
    e.preventDefault();
    onClose();
  }
}}
```

### Removed stopPropagation from Content Wrapper
**From:**
```tsx
<div className="..." onClick={(e) => e.stopPropagation()}>
```

**To:**
```tsx
<div className="...">
```

### Kept stopPropagation on Interactive Elements
All buttons inside still have:
```tsx
onClick={(e) => {
  e.stopPropagation();
  onLocationChange(id);
}}
```

## Why This Works

1. **onMouseDown on backdrop** - Triggers before onClick
2. **preventDefault** - Stops the mousedown from becoming a click
3. **Target check** - Only closes if clicking backdrop itself
4. **No wrapper stopPropagation** - Buttons can click normally
5. **Button-level stopPropagation** - Prevents bubbling after action

## Files Updated
- MobileFiltersDropdown.tsx - Fixed backdrop handler
- Header.tsx - Added useEffect to close menu when filters open

## Testing
Tested in browser mobile view (iPhone 12 Pro 390x844):
- ✅ Tabs clickable - sheet stays open
- ✅ Location selection - sheet stays open, filter applies
- ✅ Category selection - sheet stays open, filter applies
- ✅ Toggles - sheet stays open
- ✅ Backdrop click - sheet closes
- ✅ No z-index conflicts

## Status
**WORKING PERFECTLY** - All clicks register, sheet stays open, filters apply correctly.

