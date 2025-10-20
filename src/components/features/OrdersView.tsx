import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton } from '../ui';

interface OrdersViewProps {
  onClose?: () => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  onClearSelection?: () => void;
  onSelectedOrdersChange?: (selected: Set<number>) => void;
  onTotalOrdersChange?: (total: number) => void;
  locationId?: string;
  employee?: string;
  dateFrom?: string;
  dateTo?: string;
  showSelectedOnly?: boolean;
}

export interface OrdersViewRef {
  handleRefresh: () => void;
}

interface WooCommerceOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  date_created: string;
  date_modified: string;
  customer_id: number;
  created_via: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id?: number;
    quantity: number;
    total: string;
    subtotal: string;
    sku: string;
    price: number;
    meta_data?: Array<{
      key: string;
      value: string;
      display_key: string;
      display_value: string;
    }>;
  }>;
  shipping_lines: Array<{
    method_title: string;
    total: string;
  }>;
  meta_data: Array<{
    key: string;
    value: any;
  }>;
}

type OrderTab = 'items' | 'customer' | 'shipping' | 'payment' | 'notes';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

export const OrdersView = React.forwardRef<OrdersViewRef, OrdersViewProps>(({ 
  onClose, 
  statusFilter = 'any',
  onStatusFilterChange,
  onClearSelection,
  onSelectedOrdersChange,
  onTotalOrdersChange,
  locationId = '',
  employee = '',
  dateFrom = '',
  dateTo = '',
  showSelectedOnly = false
}, ref) => {
  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [activeOrderTab, setActiveOrderTab] = useState<{ [orderId: number]: OrderTab }>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Column configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'order', label: 'Order', visible: true, required: true },
    { id: 'origin', label: 'Origin', visible: true },
    { id: 'customer', label: 'Customer', visible: true },
    { id: 'date', label: 'Date', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'total', label: 'Total', visible: true },
    { id: 'payment', label: 'Payment Method', visible: false },
    { id: 'shipping', label: 'Shipping Method', visible: false },
    { id: 'items', label: 'Items Count', visible: false },
  ]);

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Close column selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load orders data
  const loadData = async (page: number = 1, status: string = 'any', location: string = '', emp: string = '', from: string = '', to: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '50',
        status,
        orderby: 'date',
        order: 'desc',
      });

      // Add optional filters
      if (location) params.append('location', location);
      if (emp) params.append('employee', emp);
      if (from) params.append('date_from', from);
      if (to) params.append('date_to', to);

      const response = await fetch(`/api/orders?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
        setTotalOrders(result.meta.total);
        setTotalPages(result.meta.pages);
        setCurrentPage(result.meta.current_page);
        
        // Update parent with total orders count
        if (onTotalOrdersChange) {
          onTotalOrdersChange(result.meta.total);
        }
        
      } else {
        throw new Error(result.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentPage, statusFilter, locationId, employee, dateFrom, dateTo);
  }, [currentPage, statusFilter, locationId, employee, dateFrom, dateTo]);

  // Handle status filter changes from parent
  const handleStatusFilterChange = (status: string) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(status);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle clear selection
  const handleClearSelection = () => {
    const emptySet = new Set<number>();
    setSelectedOrders(emptySet);
    if (onSelectedOrdersChange) {
      onSelectedOrdersChange(emptySet);
    }
    if (onClearSelection) {
      onClearSelection();
    }
  };

  // Toggle expand card
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Set default tab if not set
      if (!activeOrderTab[id]) {
        setActiveOrderTab(prev => ({ ...prev, [id]: 'items' }));
      }
    }
    setExpandedCards(newExpanded);
  };

  // Toggle selection
  const toggleOrderSelection = (id: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrders(newSelected);
    
    // Update parent with selected orders
    if (onSelectedOrdersChange) {
      onSelectedOrdersChange(newSelected);
    }
  };

  // Set active tab for an order
  const setOrderTab = (orderId: number, tab: OrderTab) => {
    setActiveOrderTab(prev => ({ ...prev, [orderId]: tab }));
  };

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setError(null);
      
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const result = await response.json();
      if (result.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  // Delete order
  const deleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete order');
      }

      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format status text
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  // Get order origin from meta data
  const getOrderOrigin = (order: WooCommerceOrder): string => {
    // Check for source_name first (most descriptive)
    const sourceName = order.meta_data?.find(meta => meta.key === 'source_name')?.value;
    if (sourceName) return sourceName;

    // Check for _order_source_system
    const sourceSystem = order.meta_data?.find(meta => meta.key === '_order_source_system')?.value;
    if (sourceSystem) return sourceSystem;

    // Check for _order_source
    const orderSource = order.meta_data?.find(meta => meta.key === '_order_source')?.value;
    if (orderSource) return orderSource;

    // Fallback to created_via
    if (order.created_via) {
      switch (order.created_via.toLowerCase()) {
        case 'posv1':
          return 'Point of Sale';
        case 'checkout':
          return 'E-commerce';
        case 'admin':
          return 'Admin Panel';
        case 'rest-api':
          return 'API';
        default:
          return order.created_via;
      }
    }

    return 'Unknown';
  };

  // Get detailed origin information
  const getOrderOriginDetail = (order: WooCommerceOrder): string => {
    // Check for UTM source (location specific info)
    const utmSource = order.meta_data?.find(meta => meta.key === '_wc_order_attribution_utm_source')?.value;
    if (utmSource) {
      // Clean up the UTM source for display
      return utmSource.replace('posv1-', '').replace('-', ' ');
    }

    // Check for source type
    const sourceType = order.meta_data?.find(meta => meta.key === '_wc_order_attribution_source_type')?.value;
    if (sourceType) {
      switch (sourceType.toLowerCase()) {
        case 'pos':
          return 'In-Store';
        case 'organic':
          return 'Direct';
        case 'referral':
          return 'Referral';
        default:
          return sourceType;
      }
    }

    return '';
  };

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    handleRefresh: () => loadData(currentPage, statusFilter, locationId, employee, dateFrom, dateTo)
  }));

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col relative min-h-0">
      {/* Full Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mx-auto mb-2"></div>
            <p className="text-neutral-400">Loading orders...</p>
          </div>
        </div>
      )}
      
      {/* Content Area */}
      <div 
        className="flex-1 overflow-y-scroll scrollable-container p-0 bg-neutral-900 min-h-0 relative"
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          overscrollBehavior: 'contain',
          height: '100%'
        }}
      >
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="min-w-full">
          {/* Table Header */}
          <div className="sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] px-4 py-2 z-10">
            <div className="flex items-center gap-3 text-xs font-medium text-neutral-400 relative">
              <div className="w-6"></div> {/* Space for expand icon */}
              {columns.find(c => c.id === 'order')?.visible && (
                <div className="w-32">Order</div>
              )}
              {columns.find(c => c.id === 'origin')?.visible && (
                <div className="w-40">Origin</div>
              )}
              {columns.find(c => c.id === 'customer')?.visible && (
                <div className="flex-1">Customer</div>
              )}
              {columns.find(c => c.id === 'date')?.visible && (
                <div className="w-40">Date</div>
              )}
              {columns.find(c => c.id === 'status')?.visible && (
                <div className="w-32">Status</div>
              )}
              {columns.find(c => c.id === 'total')?.visible && (
                <div className="w-32">Total</div>
              )}
              {columns.find(c => c.id === 'payment')?.visible && (
                <div className="w-40">Payment</div>
              )}
              {columns.find(c => c.id === 'shipping')?.visible && (
                <div className="w-40">Shipping</div>
              )}
              {columns.find(c => c.id === 'items')?.visible && (
                <div className="w-24">Items</div>
              )}

              {/* Column Selector Icon - Far Right */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2" ref={columnSelectorRef}>
                <button
                  onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/[0.05] text-neutral-300 rounded-lg hover:bg-white/[0.08] transition text-xs relative"
                  title="Configure table columns"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>

                {/* Column Selector Dropdown */}
                {isColumnSelectorOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-800 border border-white/[0.08] rounded-lg shadow-lg" style={{ zIndex: 99999 }}>
                    <div className="p-3">
                      <div className="text-xs font-medium text-neutral-300 mb-3">Configure Table Columns</div>
                      
                      <div className="space-y-2">
                        {columns.map(column => (
                          <label key={column.id} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-neutral-200">
                            <input
                              type="checkbox"
                              checked={column.visible}
                              onChange={() => toggleColumn(column.id)}
                              disabled={column.required}
                              className="rounded text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500 focus:ring-1 disabled:opacity-50"
                            />
                            <span className={column.required ? 'text-neutral-500' : ''}>
                              {column.label}
                            </span>
                            {column.required && (
                              <span className="text-neutral-600 text-[10px]">(required)</span>
                            )}
                          </label>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/[0.08] flex gap-2">
                        <button
                          onClick={() => {
                            setColumns(prev => prev.map(col => ({ ...col, visible: true })));
                          }}
                          className="flex-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-white/[0.05]"
                        >
                          Show All
                        </button>
                        <button
                          onClick={() => {
                            setColumns(prev => prev.map(col => ({ ...col, visible: col.required || false })));
                          }}
                          className="flex-1 text-xs text-neutral-400 hover:text-neutral-300 px-2 py-1 rounded hover:bg-white/[0.05]"
                        >
                          Hide All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div>
            {orders.map((order) => (
              <div
                key={order.id}
              className={`group product-card transition-all duration-280 mb-2 rounded-lg border ${
                selectedOrders.has(order.id)
                  ? 'bg-neutral-800/50 border-l-4 border-l-neutral-400 border-white/[0.06] shadow-sm'
                  : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-neutral-800/30 hover:shadow-sm'
              }`}
              >
              {/* Order Row - Single Line */}
              <div 
                className="flex items-center gap-3 px-4 py-2 cursor-pointer select-none product-card-row"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    const isButton = target.closest('button');
                    if (!isButton) {
                      toggleOrderSelection(order.id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    const target = e.target as HTMLElement;
                    const isButton = target.closest('button');
                    if (!isButton) {
                      e.stopPropagation();
                      toggleExpand(order.id);
                    }
                  }}
                >
                  {/* Expand/Collapse Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(order.id);
                    }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-800 hover:text-neutral-600 rounded-md expand-button transition-colors"
                  >
                  <svg
                    className={`w-2 h-2 expand-icon ${expandedCards.has(order.id) ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                  </button>
                  
                {/* Order Number */}
                {columns.find(c => c.id === 'order')?.visible && (
                  <div className="w-32">
                    <div className="text-neutral-400 text-sm font-medium product-text">
                      #{order.id}
                    </div>
                  </div>
                )}

                {/* Origin */}
                {columns.find(c => c.id === 'origin')?.visible && (
                  <div className="w-40">
                    <div className="text-neutral-400 text-sm product-text">
                      {getOrderOrigin(order)}
                    </div>
                    <div className="text-xs text-neutral-600 product-text">
                      {getOrderOriginDetail(order)}
                    </div>
                  </div>
                )}

                {/* Customer */}
                {columns.find(c => c.id === 'customer')?.visible && (
                  <div className="flex-1 min-w-0">
                    <div className="text-neutral-400 text-sm product-text">
                      {order.billing.first_name} {order.billing.last_name}
                    </div>
                    <div className="text-xs text-neutral-600 truncate product-text">
                      {order.billing.email}
                    </div>
                  </div>
                )}

                {/* Date */}
                {columns.find(c => c.id === 'date')?.visible && (
                  <div className="w-40 text-neutral-500 text-xs product-text">
                    {formatDate(order.date_created)}
                  </div>
                )}

                {/* Status */}
                {columns.find(c => c.id === 'status')?.visible && (
                  <div className="w-32">
                    <span className="px-2 py-1 bg-neutral-800/50 text-neutral-400 text-xs rounded product-text">
                      {formatStatus(order.status)}
                    </span>
                  </div>
                )}

                {/* Total */}
                {columns.find(c => c.id === 'total')?.visible && (
                  <div className="w-32 text-neutral-300 text-sm font-medium product-text">
                    {order.currency} {order.total}
                  </div>
                )}

                  {/* Payment Method */}
                  {columns.find(c => c.id === 'payment')?.visible && (
                    <div className="w-40 text-neutral-500 text-xs">
                      {order.payment_method_title || 'N/A'}
                    </div>
                  )}

                  {/* Shipping Method */}
                  {columns.find(c => c.id === 'shipping')?.visible && (
                    <div className="w-40 text-neutral-500 text-xs">
                      {order.shipping_lines?.[0]?.method_title || 'N/A'}
                    </div>
                  )}

                  {/* Items Count */}
                  {columns.find(c => c.id === 'items')?.visible && (
                    <div className="w-24 text-neutral-500 text-xs">
                      {order.line_items?.length || 0} items
                    </div>
                  )}
                </div>

              {/* Expanded View */}
              {expandedCards.has(order.id) && (
                <div className="mx-4 mb-2 rounded p-4 bg-neutral-800/20 border border-white/[0.04] product-expanded-content">
                  {/* Tab Controls */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.04]">
                      <Button
                        onClick={() => setOrderTab(order.id, 'items')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'items' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Items
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'customer')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'customer' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Customer
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'shipping')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'shipping' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Shipping
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'payment')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'payment' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Payment
                      </Button>
                      <Button
                        onClick={() => setOrderTab(order.id, 'notes')}
                        size="sm"
                        variant={activeOrderTab[order.id] === 'notes' ? 'primary' : 'ghost'}
                        className="text-xs"
                      >
                        Notes
                      </Button>
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Items Tab */}
                      {activeOrderTab[order.id] === 'items' && (
                        <>
                          <div className="lg:col-span-2 space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                              Order Items
                            </div>
                            {order.line_items?.map((item) => (
                              <div key={item.id} className="bg-neutral-900/40 rounded p-2 border border-white/[0.04] transition-all hover:border-white/[0.08] hover:bg-neutral-900/60">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="text-neutral-300 text-sm product-text">{item.name}</div>
                                    <div className="text-neutral-600 text-xs product-text">
                                      SKU: {item.sku || 'N/A'}
                                      {item.variation_id && <span className="ml-2 text-neutral-500">(Variation ID: {item.variation_id})</span>}
                                    </div>
                                    {item.meta_data && item.meta_data.length > 0 && (
                                      <div className="mt-1 space-y-0.5">
                                        {item.meta_data.map((meta, idx) => (
                                          <div key={idx} className="text-neutral-600 text-xs product-text">
                                            {meta.display_key}: <span className="text-neutral-500">{meta.display_value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-neutral-500 text-xs product-text">Qty: {item.quantity}</div>
                                    <div className="text-neutral-400 text-sm font-medium product-text">{order.currency} {item.total}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Order Summary
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Subtotal:</span>
                                <span className="text-neutral-400 text-xs">{order.currency} {order.total}</span>
                              </div>
                            </div>
                            {order.shipping_lines?.length > 0 && (
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Shipping:</span>
                                  <span className="text-neutral-400 text-xs">{order.currency} {order.shipping_lines[0].total}</span>
                                </div>
                              </div>
                            )}
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs font-medium">Total:</span>
                                <span className="text-neutral-400 text-sm font-medium">{order.currency} {order.total}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Customer Tab */}
                      {activeOrderTab[order.id] === 'customer' && (
                        <>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Customer Information
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Name:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.first_name} {order.billing.last_name}</span>
                              </div>
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Email:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.email}</span>
                              </div>
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Phone:</span>
                                <span className="text-neutral-500 text-xs">{order.billing.phone || 'Not provided'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Billing Address
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">
                                {order.billing.address_1}<br />
                                {order.billing.address_2 && <>{order.billing.address_2}<br /></>}
                                {order.billing.city}, {order.billing.state} {order.billing.postcode}<br />
                                {order.billing.country}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Customer ID
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">User ID:</span>
                                <span className="text-neutral-500 text-xs">{order.customer_id || 'Guest'}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Shipping Tab */}
                      {activeOrderTab[order.id] === 'shipping' && (
                        <>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Shipping Address
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">
                                {order.shipping.first_name} {order.shipping.last_name}<br />
                                {order.shipping.address_1}<br />
                                {order.shipping.address_2 && <>{order.shipping.address_2}<br /></>}
                                {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}<br />
                                {order.shipping.country}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Shipping Method
                            </div>
                            {order.shipping_lines?.map((shipping, index) => (
                              <div key={index} className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-500 text-xs">{shipping.method_title}</span>
                                  <span className="text-neutral-400 text-xs">{order.currency} {shipping.total}</span>
                                </div>
                              </div>
                            ))}
                            {(!order.shipping_lines || order.shipping_lines.length === 0) && (
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-500 text-xs">No shipping method selected</div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Tracking
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">No tracking information available</div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Payment Tab */}
                      {activeOrderTab[order.id] === 'payment' && (
                        <>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Payment Method
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Method:</span>
                                <span className="text-neutral-500 text-xs">{order.payment_method_title || 'Not specified'}</span>
                              </div>
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Transaction ID:</span>
                                <span className="text-neutral-500 text-xs">N/A</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Payment Status
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 text-xs">Status:</span>
                                <span className="text-neutral-500 text-xs">
                                  {formatStatus(order.status)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Actions
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                                <option value="failed">Failed</option>
                              </select>
                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="w-full mt-2 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs"
                              >
                                Delete Order
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Notes Tab */}
                      {activeOrderTab[order.id] === 'notes' && (
                        <>
                          <div className="lg:col-span-2 space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Order Notes
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="text-neutral-500 text-xs">No notes available for this order</div>
                            </div>
                            <div className="text-neutral-500 font-medium text-xs mb-2 mt-4">
                              Order Metadata
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Order ID:</span>
                                  <span className="text-neutral-500 text-xs">#{order.id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Created:</span>
                                  <span className="text-neutral-500 text-xs">{formatDate(order.date_created)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Modified:</span>
                                  <span className="text-neutral-500 text-xs">{formatDate(order.date_modified)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-neutral-500 font-medium text-xs mb-2">
                              Order Origin Details
                            </div>
                            <div className="bg-neutral-900/40 rounded p-2">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Source:</span>
                                  <span className="text-neutral-400 text-xs">{getOrderOrigin(order)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Location:</span>
                                  <span className="text-neutral-400 text-xs">{getOrderOriginDetail(order) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Created Via:</span>
                                  <span className="text-neutral-400 text-xs">{order.created_via || 'N/A'}</span>
                                </div>
                                {order.meta_data?.find(meta => meta.key === '_wc_order_attribution_source_type') && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-neutral-600 text-xs">Source Type:</span>
                                    <span className="text-neutral-400 text-xs">{order.meta_data.find(meta => meta.key === '_wc_order_attribution_source_type')?.value}</span>
                                  </div>
                                )}
                                {order.meta_data?.find(meta => meta.key === '_order_source') && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-neutral-600 text-xs">Order Source:</span>
                                    <span className="text-neutral-400 text-xs">{order.meta_data.find(meta => meta.key === '_order_source')?.value}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="sticky bottom-0 bg-neutral-900 border-t border-white/[0.08] px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-400">
                Page {currentPage} of {totalPages} ({totalOrders} orders)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="text-white/60">No orders found</div>
          </div>
        )}
      </div>
    </div>
  );
});

OrdersView.displayName = 'OrdersView';
