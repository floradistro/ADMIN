import React, { useState, useEffect, useRef } from 'react';
import { WordPressUser, usersService } from '../../services/users-service';
import { Button, IconButton } from '../ui';

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

interface EditingUser extends Partial<WordPressUser> {
  password?: string;
}

type CustomerTab = 'contact' | 'rewards' | 'orders' | 'preferences' | 'manage';

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

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
  const [users, setUsers] = useState<WordPressUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<number | 'new' | null>(null);
  const [editForm, setEditForm] = useState<EditingUser>({});
  const [saving, setSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [activeCustomerTab, setActiveCustomerTab] = useState<{ [userId: number]: CustomerTab }>({});
  const [appPasswordName, setAppPasswordName] = useState<string>('');
  const [showAppPasswordForm, setShowAppPasswordForm] = useState<number | null>(null);
  const [userAppPasswords, setUserAppPasswords] = useState<{[userId: number]: any[]}>({});
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);

  // Column configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'customer', label: 'Customer', visible: true, required: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'joined', label: 'Joined', visible: true },
    { id: 'orders', label: 'Total Orders', visible: false },
    { id: 'spent', label: 'Total Spent', visible: false },
    { id: 'lastOrder', label: 'Last Order', visible: false },
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

  // Load users data (customers only)
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersData = await usersService.getUsers(true);
      // Filter to show only customers
      const customersOnly = usersData.filter(user => user.roles.includes('customer'));
      setUsers(customersOnly);
      
      // Update parent with total customers count
      if (onTotalCustomersChange) {
        onTotalCustomersChange(customersOnly.length);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle expand card
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Set default tab if not set
      if (!activeCustomerTab[id]) {
        setActiveCustomerTab(prev => ({ ...prev, [id]: 'contact' }));
      }
      // Load app passwords when expanding a card
      if (activeCustomerTab[id] === 'manage' || !activeCustomerTab[id]) {
        loadAppPasswords(id);
      }
    }
    setExpandedCards(newExpanded);
  };

  // Toggle selection
  const toggleUserSelection = (id: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
    
    // Update parent with selected customers
    if (onSelectedCustomersChange) {
      onSelectedCustomersChange(newSelected);
    }
  };

  // Start editing
  const startEditing = (user?: WordPressUser) => {
    if (user) {
      setEditingUser(user.id);
      setEditForm({
        name: user.name,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        roles: user.roles
      });
    } else {
      setShowAddForm(true);
      setEditingUser('new');
      setEditForm({
        name: '',
        username: '',
        email: '',
        display_name: '',
        roles: ['customer'], // Default to customer role
        password: ''
      });
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({});
    setShowAddForm(false);
  };

  // Update form field
  const updateField = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Save user
  const saveUser = async () => {
    if (!editForm.username || !editForm.email) {
      setError('Username and email are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      
      if (editingUser === 'new') {
        // Create new customer
        const response = await fetch('/api/users-matrix/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...editForm,
            roles: ['customer'] // Ensure new users are customers
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create customer');
        }

        const newUser = await response.json();
        setShowAddForm(false);
        
        // Refresh data from server to ensure new customer appears
        await loadData();
        
      } else if (typeof editingUser === 'number') {
        // Update existing customer
        const response = await fetch(`/api/users-matrix/users/${editingUser}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update customer');
        }

        const updatedUser = await response.json();
        setLastUpdated(editingUser);
        setTimeout(() => setLastUpdated(null), 3000);
        
        // Refresh data from server to ensure changes are reflected
        await loadData();
      }

      setEditingUser(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  // Send password reset
  const sendPasswordReset = async (userId: number) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/users-matrix/users/${userId}/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset');
      }

      alert('Password reset link sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset');
    }
  };

  // Load application passwords for a user
  const loadAppPasswords = async (userId: number) => {
    try {
      
      const response = await fetch(`/api/users-matrix/users/${userId}/app-passwords`);
      
      if (!response.ok) {
        throw new Error('Failed to load application passwords');
      }

      const passwords = await response.json();
      setUserAppPasswords(prev => ({ ...prev, [userId]: passwords }));
    } catch (err) {
      setUserAppPasswords(prev => ({ ...prev, [userId]: [] }));
    }
  };

  // Create application password
  const createAppPassword = async (userId: number, name: string) => {
    if (!name.trim()) {
      setError('Application password name is required');
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`/api/users-matrix/users/${userId}/app-passwords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create application password');
      }

      const result = await response.json();
      alert(`Application password created!\n\nPassword: ${result.password}\n\nSave this password - it will not be shown again.`);
      setAppPasswordName('');
      setShowAppPasswordForm(null);
      
      // Reload app passwords to show the new one
      loadAppPasswords(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application password');
    }
  };

  // Revoke application password
  const revokeAppPassword = async (userId: number, uuid: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the application password "${name}"?`)) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`/api/users-matrix/users/${userId}/app-passwords/${uuid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke application password');
      }

      // Reload app passwords to reflect the removal
      loadAppPasswords(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke application password');
    }
  };

  // Delete customer
  const deleteCustomer = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      setError(null);
      
      const response = await fetch(`/api/users-matrix/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      // Refresh data from server to ensure deletion is reflected
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  // Set active tab for a customer
  const setCustomerTab = (userId: number, tab: CustomerTab) => {
    setActiveCustomerTab(prev => ({ ...prev, [userId]: tab }));
    
    // Load app passwords when switching to manage tab
    if (tab === 'manage' && !userAppPasswords[userId]) {
      loadAppPasswords(userId);
    }
  };

  // Handle add new customer (called from parent)
  const handleAddNew = () => {
    if (onAddCustomer) {
      onAddCustomer();
    } else {
      startEditing();
    }
  };

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    handleAddNew: handleAddNew,
    handleRefresh: loadData
  }));

  return (
    <div className="flex-1 bg-neutral-900 flex flex-col relative min-h-0">
      {/* Full Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mx-auto mb-2"></div>
            <p className="text-neutral-400">Loading customers...</p>
          </div>
        </div>
      )}
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollable-container p-0 bg-neutral-900 min-h-0">
        
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

        {/* Add Customer Form */}
        {showAddForm && (
          <div className="border-b border-white/[0.08] px-4 py-4 bg-neutral-800/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Customer</h3>
              <IconButton
                onClick={cancelEditing}
                variant="ghost"
                size="sm"
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </IconButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Username *"
                />
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Email *"
                />
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.display_name || ''}
                  onChange={(e) => updateField('display_name', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Display Name"
                />
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-sm"
                  placeholder="Password *"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={saveUser}
                    disabled={saving || !editForm.username?.trim() || !editForm.email?.trim()}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    {saving ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    variant="ghost"
                    disabled={saving}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="min-w-full">
          {/* Table Header */}
          <div className="sticky top-0 bg-neutral-900 backdrop-blur border-b border-white/[0.08] px-4 py-2 z-10">
            <div className="flex items-center gap-3 text-xs font-medium text-neutral-400 relative">
              <div className="w-6"></div> {/* Space for expand icon */}
              {columns.find(c => c.id === 'customer')?.visible && (
                <div className="flex-1">Customer</div>
              )}
              {columns.find(c => c.id === 'email')?.visible && (
                <div className="w-64">Email</div>
              )}
              {columns.find(c => c.id === 'joined')?.visible && (
                <div className="w-40">Joined</div>
              )}
              {columns.find(c => c.id === 'orders')?.visible && (
                <div className="w-32">Total Orders</div>
              )}
              {columns.find(c => c.id === 'spent')?.visible && (
                <div className="w-32">Total Spent</div>
              )}
              {columns.find(c => c.id === 'lastOrder')?.visible && (
                <div className="w-40">Last Order</div>
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
          {users.map((user) => (
            <div
              key={user.id}
              className={`group transition-all mb-2 rounded-lg border-b border-white/[0.02] ${
                selectedUsers.has(user.id)
                  ? 'bg-neutral-800/50 hover:bg-neutral-800/70 border-l-4 border-l-neutral-400'
                  : 'bg-neutral-900/40 hover:bg-neutral-800/60'
              }`}
            >
              {/* Customer Row - Single Line */}
              <div 
                className="flex items-center gap-3 px-4 py-2 cursor-pointer select-none"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isButton = target.closest('button');
                  if (!isButton) {
                    toggleUserSelection(user.id);
                  }
                }}
                onDoubleClick={(e) => {
                  const target = e.target as HTMLElement;
                  const isButton = target.closest('button');
                  if (!isButton) {
                    e.stopPropagation();
                    toggleExpand(user.id);
                  }
                }}
              >
                {/* Expand/Collapse Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(user.id);
                  }}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-neutral-400 smooth-hover"
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-300 ease-out ${expandedCards.has(user.id) ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Customer Name */}
                {columns.find(c => c.id === 'customer')?.visible && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-300 text-sm">
                      {user.display_name || user.name || user.username}
                    </div>
                    <div className="text-xs text-neutral-500">
                      ID: {user.id}
                    </div>
                  </div>
                )}

                {/* Email */}
                {columns.find(c => c.id === 'email')?.visible && (
                  <div className="w-64 text-neutral-400 text-sm truncate">
                    {user.email}
                  </div>
                )}

                {/* Joined Date */}
                {columns.find(c => c.id === 'joined')?.visible && (
                  <div className="w-40 text-neutral-500 text-xs">
                    {new Date().toLocaleDateString()}
                  </div>
                )}

                {/* Total Orders */}
                {columns.find(c => c.id === 'orders')?.visible && (
                  <div className="w-32 text-neutral-500 text-xs">
                    0 orders
                  </div>
                )}

                {/* Total Spent */}
                {columns.find(c => c.id === 'spent')?.visible && (
                  <div className="w-32 text-neutral-500 text-xs">
                    $0.00
                  </div>
                )}

                {/* Last Order */}
                {columns.find(c => c.id === 'lastOrder')?.visible && (
                  <div className="w-40 text-neutral-500 text-xs">
                    Never
                  </div>
                )}
              </div>

              {/* Expanded View */}
              {expandedCards.has(user.id) && (
                <div className="mx-4 mb-2 rounded p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02]">
                  {/* Tab Controls */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.08]">
                    <Button
                      onClick={() => setCustomerTab(user.id, 'contact')}
                      size="sm"
                      variant={activeCustomerTab[user.id] === 'contact' ? 'primary' : 'ghost'}
                      className="text-xs"
                    >
                      Contact
                    </Button>
                    <Button
                      onClick={() => setCustomerTab(user.id, 'rewards')}
                      size="sm"
                      variant={activeCustomerTab[user.id] === 'rewards' ? 'primary' : 'ghost'}
                      className="text-xs"
                    >
                      Rewards
                    </Button>
                    <Button
                      onClick={() => setCustomerTab(user.id, 'orders')}
                      size="sm"
                      variant={activeCustomerTab[user.id] === 'orders' ? 'primary' : 'ghost'}
                      className="text-xs"
                    >
                      Order History
                    </Button>
                    <Button
                      onClick={() => setCustomerTab(user.id, 'preferences')}
                      size="sm"
                      variant={activeCustomerTab[user.id] === 'preferences' ? 'primary' : 'ghost'}
                      className="text-xs"
                    >
                      Preferences
                    </Button>
                    <Button
                      onClick={() => setCustomerTab(user.id, 'manage')}
                      size="sm"
                      variant={activeCustomerTab[user.id] === 'manage' ? 'primary' : 'ghost'}
                      className="text-xs"
                    >
                      Manage
                    </Button>
                  </div>

                  {/* Tab Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Contact Tab */}
                    {activeCustomerTab[user.id] === 'contact' && (
                      <>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Contact Information
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Email:</span>
                              <span className="text-neutral-500 text-xs">{user.email}</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Phone:</span>
                              <span className="text-neutral-500 text-xs">Not set</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Address:</span>
                              <span className="text-neutral-500 text-xs">Not set</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Billing Information
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="text-neutral-600 text-xs mb-1">Billing Address:</div>
                            <div className="text-neutral-500 text-xs">Not configured</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Shipping Information
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="text-neutral-600 text-xs mb-1">Shipping Address:</div>
                            <div className="text-neutral-500 text-xs">Not configured</div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Rewards Tab */}
                    {activeCustomerTab[user.id] === 'rewards' && (
                      <>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Points & Rewards
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Total Points:</span>
                              <span className="text-neutral-500 text-xs">0</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Tier:</span>
                              <span className="text-neutral-500 text-xs">Standard</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Recent Rewards
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="text-neutral-500 text-xs">No rewards earned yet</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Available Offers
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="text-neutral-500 text-xs">No offers available</div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Order History Tab */}
                    {activeCustomerTab[user.id] === 'orders' && (
                      <>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Order Statistics
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Total Orders:</span>
                              <span className="text-neutral-500 text-xs">0</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Total Spent:</span>
                              <span className="text-neutral-500 text-xs">$0.00</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Recent Orders
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="text-neutral-500 text-xs">No orders found</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Order Preferences
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Preferred Delivery:</span>
                              <span className="text-neutral-500 text-xs">Standard</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Preferences Tab */}
                    {activeCustomerTab[user.id] === 'preferences' && (
                      <>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Communication
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Email Notifications:</span>
                              <span className="text-neutral-500 text-xs">Enabled</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">SMS Notifications:</span>
                              <span className="text-neutral-500 text-xs">Disabled</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Shopping Preferences
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Language:</span>
                              <span className="text-neutral-500 text-xs">English</span>
                            </div>
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Currency:</span>
                              <span className="text-neutral-500 text-xs">USD</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Marketing
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 text-xs">Newsletter:</span>
                              <span className="text-neutral-500 text-xs">Subscribed</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Manage Tab */}
                    {activeCustomerTab[user.id] === 'manage' && (
                      <>
                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Account Details
                          </div>
                          {editingUser === user.id ? (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Username:</div>
                                <input
                                  type="text"
                                  value={editForm.username || ''}
                                  onChange={(e) => updateField('username', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                />
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Display Name:</div>
                                <input
                                  type="text"
                                  value={editForm.display_name || ''}
                                  onChange={(e) => updateField('display_name', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                />
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="text-neutral-600 text-xs mb-1">Email:</div>
                                <input
                                  type="email"
                                  value={editForm.email || ''}
                                  onChange={(e) => updateField('email', e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Username:</span>
                                  <span className="text-neutral-500 text-xs">{user.username}</span>
                                </div>
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Display Name:</span>
                                  <span className="text-neutral-500 text-xs">{user.display_name || 'Not set'}</span>
                                </div>
                              </div>
                              <div className="bg-neutral-900/40 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-neutral-600 text-xs">Customer ID:</span>
                                  <span className="text-neutral-500 text-xs">{user.id}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Security
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="text-neutral-600 text-xs mb-1">Password:</div>
                            {editingUser === user.id ? (
                              <input
                                type="password"
                                value={editForm.password || ''}
                                onChange={(e) => updateField('password', e.target.value)}
                                className="w-full px-2 py-1 bg-black border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                placeholder="Leave empty to keep current"
                              />
                            ) : (
                              <button
                                onClick={() => sendPasswordReset(user.id)}
                                className="px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs smooth-hover"
                              >
                                Send Reset Link
                              </button>
                            )}
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            <div className="text-neutral-600 text-xs mb-2">Application Passwords:</div>
                            {userAppPasswords[user.id] && userAppPasswords[user.id].length > 0 ? (
                              <div className="space-y-1">
                                {userAppPasswords[user.id].map((appPassword: any) => (
                                  <div key={appPassword.uuid} className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">{appPassword.name}</span>
                                    <button
                                      onClick={() => revokeAppPassword(user.id, appPassword.uuid, appPassword.name)}
                                      className="px-1 py-0.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded text-red-300 text-[9px]"
                                    >
                                      Revoke
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-neutral-500 text-xs">No application passwords</div>
                            )}
                            {showAppPasswordForm === user.id ? (
                              <div className="mt-2 space-y-2">
                                <input
                                  type="text"
                                  value={appPasswordName}
                                  onChange={(e) => setAppPasswordName(e.target.value)}
                                  className="w-full px-2 py-1 bg-neutral-900/60 border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs"
                                  placeholder="Password name"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => createAppPassword(user.id, appPasswordName)}
                                    className="flex-1 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs"
                                  >
                                    Create
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowAppPasswordForm(null);
                                      setAppPasswordName('');
                                    }}
                                    className="flex-1 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-500 hover:text-neutral-400 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAppPasswordForm(user.id)}
                                className="mt-2 w-full px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs"
                              >
                                Add Application Password
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-neutral-500 font-medium text-xs mb-2">
                            Actions
                          </div>
                          <div className="bg-neutral-900/40 rounded p-2">
                            {editingUser === user.id ? (
                              <div className="flex gap-2">
                                <Button
                                  onClick={saveUser}
                                  disabled={saving}
                                  size="sm"
                                  className="flex-1 text-xs"
                                >
                                  {saving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                  onClick={cancelEditing}
                                  variant="ghost"
                                  disabled={saving}
                                  size="sm"
                                  className="flex-1 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => startEditing(user)}
                                  size="sm"
                                  className="flex-1 text-xs"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => deleteCustomer(user.id)}
                                  variant="danger"
                                  size="sm"
                                  className="flex-1 text-xs"
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
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

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="text-white/60">No customers found</div>
          </div>
        )}
      </div>
    </div>
  );
});

CustomersView.displayName = 'CustomersView';