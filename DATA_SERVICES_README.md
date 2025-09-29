# Data Services Layer - TanStack Query Integration

This document describes the new data services layer implemented with TanStack Query (React Query) for optimal data fetching, caching, and state management.

## 🚀 Features Implemented

### ✅ 3.1 React Query/TanStack Query Setup
- **Package**: `@tanstack/react-query` installed
- **Dev Tools**: `@tanstack/react-query-devtools` for development debugging
- **Provider**: `QueryProvider` wrapping the entire app
- **Configuration**: Optimized `QueryClient` with smart defaults

### ✅ 3.2 Smart Caching Features
- **Request Deduplication**: Automatic deduplication of identical requests
- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Background Refetching**: Data refreshes silently in background
- **Stale-while-revalidate**: Shows cached data while fetching fresh data
- **Intelligent Cache Invalidation**: Related queries invalidated automatically

### ✅ 3.3 Data Services Layer Structure
```
/services
  /api
    /client.ts          # Axios-based API client
    /endpoints.ts       # Centralized endpoint definitions
  /queries
    /products.ts        # Product query hooks
    /locations.ts       # Location query hooks  
    /categories.ts      # Category query hooks
    /index.ts          # Query hooks exports
  /mutations
    /inventory.ts       # Inventory mutation hooks
    /products.ts        # Product mutation hooks
    /index.ts          # Mutation hooks exports
  /index.ts            # Main services export
```

## 🔧 Usage Examples

### Query Hooks

```tsx
import { useProductsQuery, useLocationsQuery } from '@/services';

function InventoryPage() {
  // Products with smart caching
  const { data, isLoading, error } = useProductsQuery({
    search: 'cannabis',
    per_page: 20,
    location_id: 1
  });

  // Locations (cached for 10 minutes)
  const { data: locations } = useLocationsQuery();

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {data && <ProductList products={data.data} />}
    </div>
  );
}
```

### Mutation Hooks with Optimistic Updates

```tsx
import { useUpdateInventoryMutation } from '@/services';

function ProductItem({ product }) {
  const updateInventory = useUpdateInventoryMutation({
    onSuccess: () => {
      toast.success('Inventory updated!');
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });

  const handleStockUpdate = (newQuantity) => {
    updateInventory.mutate({
      product_id: product.id,
      location_id: 1,
      quantity: newQuantity,
      reason: 'Manual adjustment'
    });
  };

  return (
    <div>
      <input 
        type="number" 
        onChange={(e) => handleStockUpdate(Number(e.target.value))}
        disabled={updateInventory.isPending}
      />
      {updateInventory.isPending && <span>Updating...</span>}
    </div>
  );
}
```

### Smart Caching Hook

```tsx
import { useSmartCache } from '@/hooks/useSmartCache';

function App() {
  const { warmCache, smartPrefetch, getCacheStats } = useSmartCache();

  useEffect(() => {
    // Warm cache on app start
    warmCache();
    
    // Smart prefetching based on user behavior
    smartPrefetch({
      currentPage: 'inventory',
      userRole: 'admin',
      recentlyViewed: ['categories', 'locations']
    });
  }, []);

  return <div>...</div>;
}
```

## 📊 Cache Configuration

### Query Defaults
- **Stale Time**: 5 minutes (data considered fresh)
- **Garbage Collection**: 10 minutes (inactive data retention)
- **Retry Logic**: 2 retries with exponential backoff
- **Background Refetch**: Enabled on reconnect, disabled on window focus

### Location-Specific Cache Times
- **Products**: 5 minutes (frequently changing)
- **Locations**: 10 minutes (moderately stable)
- **Categories**: 15 minutes (rarely changing)

## 🔄 Migration Guide

### From Legacy Services
The new query hooks are designed to work alongside existing services:

```tsx
// Old way
import { inventoryService } from '@/services/inventory-service';
const products = await inventoryService.getFilteredProducts(filters);

// New way (with caching, deduplication, etc.)
import { useProductsQuery } from '@/services';
const { data: products } = useProductsQuery(filters);
```

### Gradual Adoption
1. **Keep existing services** - No breaking changes
2. **Use new hooks in new components** - Start with query hooks
3. **Add mutations gradually** - Replace direct API calls with mutation hooks
4. **Optimize over time** - Fine-tune cache settings based on usage

## 🛠️ API Client Features

### Multi-API Support
```tsx
// Flora IM API
const response = await apiClient.get('/products');

// WooCommerce API  
const response = await apiClient.get('/products', {}, 'wc');

// WordPress API
const response = await apiClient.get('/posts', {}, 'wp');
```

### Automatic Authentication
- Flora IM API: Query parameters (`consumer_key`, `consumer_secret`)
- WooCommerce API: Basic authentication
- Error handling and request/response interceptors

## 🎯 Performance Benefits

### Before (Legacy)
- ❌ Duplicate API calls for same data
- ❌ No caching - refetch on every component mount
- ❌ Manual loading states and error handling
- ❌ No optimistic updates
- ❌ Stale data shown until new fetch completes

### After (TanStack Query)
- ✅ Automatic request deduplication
- ✅ Intelligent caching with configurable stale times
- ✅ Built-in loading states, error handling, and retry logic
- ✅ Optimistic updates with automatic rollback
- ✅ Background refetching keeps data fresh
- ✅ Stale-while-revalidate pattern for better UX

## 🔍 Development Tools

### React Query DevTools
- **Development only**: Automatically enabled in dev mode
- **Features**: Query inspection, cache visualization, network monitoring
- **Access**: Toggle panel in bottom of screen during development

### Cache Statistics
```tsx
import { useSmartCache } from '@/hooks/useSmartCache';

const { getCacheStats } = useSmartCache();
const stats = getCacheStats(); // Returns cache metrics
```

## 🚨 Important Notes

### Backward Compatibility
- ✅ **No breaking changes** - existing code continues to work
- ✅ **Legacy services preserved** - can be used alongside new hooks
- ✅ **Gradual migration** - adopt new patterns incrementally

### Best Practices
1. **Use query hooks for data fetching** - Better caching and deduplication
2. **Use mutation hooks for data updates** - Optimistic updates and cache invalidation
3. **Leverage smart caching** - Prefetch likely-needed data
4. **Monitor cache performance** - Use dev tools and cache stats

### Performance Considerations
- **Cache size**: Monitor memory usage with `getCacheStats()`
- **Network requests**: DevTools show request deduplication in action
- **Stale time tuning**: Adjust based on data volatility

## 📈 Next Steps

1. **Gradual Migration**: Start using query hooks in new components
2. **Performance Monitoring**: Track cache hit rates and request reduction
3. **Fine-tuning**: Adjust cache times based on real usage patterns
4. **Advanced Features**: Implement infinite queries, parallel queries as needed

The data services layer is now production-ready with enterprise-grade caching, optimistic updates, and intelligent background synchronization. All existing functionality remains intact while providing significant performance improvements.
