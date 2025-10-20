'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WordPressUser, usersService } from '../../services/users-service';
import { Button } from '../ui';

interface CustomersViewProps {
  onClose?: () => void;
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
  showSelectedOnly?: boolean;
  onShowSelectedOnlyChange?: (show: boolean) => void;
  onSelectedCustomersChange?: (selected: Set<number>) => void;
  onTotalCustomersChange?: (total: number) => void;
  onAddCustomer?: () => void;
}

export interface CustomersViewRef {
  handleAddNew: () => void;
  handleRefresh: () => void;
}

type CustomerTab = 'contact' | 'account' | 'activity';

export const CustomersView = React.forwardRef<CustomersViewRef, CustomersViewProps>(({ 
  onClose,
  selectedLocationId = '',
  onLocationChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  onSelectedCustomersChange,
  onTotalCustomersChange,
  onAddCustomer
}, ref) => {
  const [customers, setCustomers] = useState<WordPressUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<{ [customerId: number]: CustomerTab }>({});
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    display_name: '',
    password: ''
  });

  // Load customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const users = await usersService.getUsers(true);
      const customersOnly = users.filter(user => user.roles.includes('customer'));
      setCustomers(customersOnly);
      
      if (onTotalCustomersChange) {
        onTotalCustomersChange(customersOnly.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Toggle expand
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      if (!activeTab[id]) {
        setActiveTab(prev => ({ ...prev, [id]: 'contact' }));
      }
    }
    setExpandedCards(newExpanded);
  };

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomers(newSelected);
    
    if (onSelectedCustomersChange) {
      onSelectedCustomersChange(newSelected);
    }
  };

  // Start editing
  const startEditing = (customer: WordPressUser) => {
    setEditingCustomer(customer.id);
    setEditData({
      username: customer.username,
      email: customer.email,
      display_name: customer.display_name || '',
      password: ''
    });
  };

  // Save customer
  const saveCustomer = async (customerId: number) => {
    try {
      const response = await fetch(`/api/users-matrix/users/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (!response.ok) throw new Error('Failed to update customer');

      setEditingCustomer(null);
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    }
  };

  // Delete customer
  const deleteCustomer = async (customerId: number) => {
    if (!confirm('Delete this customer?')) return;

    try {
      const response = await fetch(`/api/users-matrix/users/${customerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to delete customer');

      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  // Expose methods
  React.useImperativeHandle(ref, () => ({
    handleAddNew: () => onAddCustomer?.(),
    handleRefresh: loadCustomers
  }));

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col relative min-h-0">
      {/* Loading Overlay */}
      {loading && customers.length === 0 && (
        <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mx-auto mb-2"></div>
            <p className="text-neutral-400 product-text">Loading customers...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-300 product-text">{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        className="flex-1 overflow-y-scroll scrollable-container p-4 bg-neutral-900 min-h-0 relative"
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          overscrollBehavior: 'contain',
          height: '100%'
        }}
      >
        {/* Table Header */}
        <div className="sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] px-2 md:px-4 py-3 mb-2 z-10 -mx-4 -mt-4">
          <div className="flex items-center gap-2 md:gap-3 text-xs font-medium text-neutral-500 uppercase tracking-wider product-text overflow-hidden">
            <div className="w-6 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">Customer</div>
          </div>
        </div>

        {/* Customer Cards */}
        <div className="space-y-2">
          {customers.map((customer) => {
            const isExpanded = expandedCards.has(customer.id);
            const isSelected = selectedCustomers.has(customer.id);
            const isEditing = editingCustomer === customer.id;

            return (
              <div
                key={customer.id}
                className={`group product-card transition-all duration-280 rounded-lg border ${
                  isSelected
                    ? 'bg-neutral-800/50 border-l-4 border-l-neutral-400 border-white/[0.06] shadow-sm'
                    : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-neutral-800/30 hover:shadow-sm'
                } ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Main Row */}
                <div
                  className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-3 cursor-pointer select-none product-card-row overflow-hidden"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('input')) {
                      toggleSelection(customer.id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('button') && !target.closest('input')) {
                      e.stopPropagation();
                      toggleExpand(customer.id);
                    }
                  }}
                >
                  {/* Expand Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(customer.id);
                    }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 rounded-md expand-button"
                  >
                    <svg
                      className={`w-3 h-3 expand-icon ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Customer Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-neutral-300 text-sm product-text truncate">
                      {(() => {
                        // Build name from first_name/last_name if available
                        const firstName = (customer as any).first_name;
                        const lastName = (customer as any).last_name;
                        if (firstName || lastName) {
                          return `${firstName || ''} ${lastName || ''}`.trim();
                        }
                        // Fallback to other name fields
                        return customer.name || customer.display_name || customer.username;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="mx-4 mb-2 rounded p-4 bg-neutral-800/20 border border-white/[0.04] product-expanded-content">
                    {/* Tabs */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.04] overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-600">
                      <Button
                        onClick={() => setActiveTab(prev => ({ ...prev, [customer.id]: 'contact' }))}
                        size="sm"
                        variant={activeTab[customer.id] === 'contact' ? 'primary' : 'ghost'}
                        className="text-xs flex-shrink-0"
                      >
                        Contact
                      </Button>
                      <Button
                        onClick={() => setActiveTab(prev => ({ ...prev, [customer.id]: 'account' }))}
                        size="sm"
                        variant={activeTab[customer.id] === 'account' ? 'primary' : 'ghost'}
                        className="text-xs flex-shrink-0"
                      >
                        Account
                      </Button>
                      <Button
                        onClick={() => setActiveTab(prev => ({ ...prev, [customer.id]: 'activity' }))}
                        size="sm"
                        variant={activeTab[customer.id] === 'activity' ? 'primary' : 'ghost'}
                        className="text-xs flex-shrink-0"
                      >
                        Activity
                      </Button>
                      <Button
                        onClick={() => {
                          if (isEditing) {
                            setEditingCustomer(null);
                          } else {
                            startEditing(customer);
                          }
                        }}
                        size="sm"
                        variant={isEditing ? 'primary' : 'ghost'}
                        className="text-xs flex-shrink-0"
                      >
                        {isEditing ? 'Editing' : 'Edit'}
                      </Button>
                    </div>

                    {/* Tab Content */}
                    {activeTab[customer.id] === 'contact' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Contact Information
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs product-text">Email:</span>
                              <span className="text-neutral-500 text-xs product-text">{customer.email}</span>
                            </div>
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs product-text">Phone:</span>
                              <span className="text-neutral-500 text-xs product-text">Not set</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Billing Address
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="text-neutral-600 text-xs product-text">
                              Not configured
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Shipping Address
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="text-neutral-600 text-xs product-text">
                              Not configured
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab[customer.id] === 'account' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Account Details
                          </div>
                          {isEditing ? (
                            <>
                              <div className="border border-white/[0.08] rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1 product-text">Username</div>
                                <input
                                  type="text"
                                  value={editData.username}
                                  onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                                  className="bg-transparent text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="border border-white/[0.08] rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1 product-text">Email</div>
                                <input
                                  type="email"
                                  value={editData.email}
                                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                  className="bg-transparent text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="border border-white/[0.08] rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1 product-text">Display Name</div>
                                <input
                                  type="text"
                                  value={editData.display_name}
                                  onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
                                  className="bg-transparent text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="border border-white/[0.04] rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs product-text">Username:</span>
                                  <span className="text-neutral-500 text-xs product-text">{customer.username}</span>
                                </div>
                              </div>
                              <div className="border border-white/[0.04] rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs product-text">Display Name:</span>
                                  <span className="text-neutral-500 text-xs product-text">{customer.display_name || 'Not set'}</span>
                                </div>
                              </div>
                              <div className="border border-white/[0.04] rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs product-text">Customer ID:</span>
                                  <span className="text-neutral-500 text-xs product-text">{customer.id}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Security
                          </div>
                          {isEditing ? (
                            <div className="border border-white/[0.08] rounded p-2">
                              <div className="text-neutral-600 text-xs mb-1 product-text">New Password (optional)</div>
                              <input
                                type="password"
                                value={editData.password}
                                onChange={(e) => setEditData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="Leave empty to keep current"
                                className="bg-transparent text-neutral-400 text-xs border-none outline-none focus:text-neutral-300 w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            <div className="border border-white/[0.04] rounded p-2">
                              <div className="text-neutral-600 text-xs mb-2 product-text">Password</div>
                              <Button
                                onClick={() => {/* Send password reset */}}
                                size="sm"
                                variant="ghost"
                                className="text-xs w-full"
                              >
                                Send Reset Link
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Actions
                          </div>
                          {isEditing ? (
                            <div className="space-y-2">
                              <Button
                                onClick={() => saveCustomer(customer.id)}
                                size="sm"
                                variant="primary"
                                className="text-xs w-full"
                              >
                                Save Changes
                              </Button>
                              <Button
                                onClick={() => setEditingCustomer(null)}
                                size="sm"
                                variant="ghost"
                                className="text-xs w-full"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => deleteCustomer(customer.id)}
                              size="sm"
                              variant="ghost"
                              className="text-xs w-full text-red-400 hover:text-red-300"
                            >
                              Delete Customer
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab[customer.id] === 'activity' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Order Statistics
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs product-text">Total Orders:</span>
                              <span className="text-neutral-500 text-xs product-text">0</span>
                            </div>
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs product-text">Total Spent:</span>
                              <span className="text-neutral-500 text-xs product-text">$0.00</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Recent Orders
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="text-neutral-600 text-xs product-text">
                              No orders found
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2 product-text">
                            Last Activity
                          </div>
                          <div className="border border-white/[0.04] rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs product-text">Last Order:</span>
                              <span className="text-neutral-500 text-xs product-text">Never</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {!loading && customers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-neutral-500 mb-4 product-text">No customers found</div>
            <Button
              onClick={() => onAddCustomer?.()}
              size="sm"
              variant="primary"
              className="text-xs"
            >
              Add Customer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

CustomersView.displayName = 'CustomersView';
