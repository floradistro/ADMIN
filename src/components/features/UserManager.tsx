import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { WordPressUser, usersService } from '../../services/users-service';
import { Button, IconButton } from '../ui';

interface UserManagerProps {
  onClose?: () => void;
}

export interface UserManagerRef {
  handleAddNew: () => void;
  handleRefresh: () => void;
}

interface EditingUser extends Partial<WordPressUser> {
  password?: string;
}

export const UserManager = forwardRef<UserManagerRef, UserManagerProps>(function UserManager({ onClose }, ref) {
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
  const [activeTab, setActiveTab] = useState<'staff' | 'customers'>('staff');
  const [appPasswordName, setAppPasswordName] = useState<string>('');
  const [showAppPasswordForm, setShowAppPasswordForm] = useState<number | null>(null);
  const [userAppPasswords, setUserAppPasswords] = useState<{[userId: number]: any[]}>({});

  // Load users data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersData = await usersService.getUsers(true);
      setUsers(usersData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users data');
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
      // Load app passwords when expanding a card
      loadAppPasswords(id);
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
        roles: ['subscriber'],
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
        // Create new user
        const response = await fetch('/api/users-matrix/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }

        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        setShowAddForm(false);
        
      } else if (typeof editingUser === 'number') {
        // Update existing user
        const response = await fetch(`/api/users-matrix/users/${editingUser}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user');
        }

        const updatedUser = await response.json();
        setUsers(prev => prev.map(user => 
          user.id === editingUser ? updatedUser : user
        ));
        setLastUpdated(editingUser);
        setTimeout(() => setLastUpdated(null), 2000);
      }

      setEditingUser(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError(null);
      
              const response = await fetch(`/api/users-matrix/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
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

  // Get role text color
  const getRoleTextColor = (roles: string[]) => {
    const role = roles[0]; // Primary role
    switch (role) {
      case 'administrator':
        return 'text-red-400';
      case 'editor':
        return 'text-blue-400';
      case 'author':
        return 'text-green-400';
      case 'contributor':
        return 'text-yellow-400';
      case 'subscriber':
        return 'text-neutral-400';
      case 'customer':
        return 'text-purple-400';
      default:
        return 'text-neutral-500';
    }
  };

  // Filter users based on active tab
  const filteredUsers = users.filter(user => {
    if (activeTab === 'customers') {
      return user.roles.includes('customer');
    } else if (activeTab === 'staff') {
      return !user.roles.includes('customer'); // Staff are all non-customer users
    }
    return true;
  });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleAddNew: () => startEditing(),
    handleRefresh: loadData
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-neutral-400">Loading user management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-white/[0.04] pb-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-3 py-1 text-sm rounded-md smooth-hover ${
            activeTab === 'staff'
              ? 'bg-white/[0.08] text-white'
              : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.04]'
          }`}
        >
          Staff ({users.filter(u => !u.roles.includes('customer')).length})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3 py-1 text-sm rounded-md smooth-hover ${
            activeTab === 'customers'
              ? 'bg-white/[0.08] text-white'
              : 'text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.04]'
          }`}
        >
          Customers ({users.filter(u => u.roles.includes('customer')).length})
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div className="mb-6 border border-white/[0.08] rounded-lg p-4 bg-neutral-900/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Add New User</h2>
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
            {/* Column 1: User Details */}
            <div className="space-y-2">
              <div className="text-neutral-500 font-medium text-xs mb-2">
                User Details
              </div>
              
              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Username *:</div>
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                  required
                  placeholder="Enter username"
                />
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Display Name:</div>
                <input
                  type="text"
                  value={editForm.display_name || ''}
                  onChange={(e) => updateField('display_name', e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                  placeholder="Display name"
                />
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Password *:</div>
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Column 2: Contact */}
            <div className="space-y-2">
              <div className="text-neutral-500 font-medium text-xs mb-2">
                Contact
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Email *:</div>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Name:</div>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                  placeholder="Full name"
                />
              </div>
            </div>

            {/* Column 3: Permissions */}
            <div className="space-y-2">
              <div className="text-neutral-500 font-medium text-xs mb-2">
                Permissions
              </div>

              <div className="bg-neutral-900/40 rounded p-2">
                <div className="text-neutral-600 text-xs mb-1">Role:</div>
                <select
                  value={editForm.roles?.[0] || 'subscriber'}
                  onChange={(e) => updateField('roles', [e.target.value])}
                  className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                >
                  <option value="subscriber">Subscriber</option>
                  <option value="customer">Customer</option>
                  <option value="contributor">Contributor</option>
                  <option value="author">Author</option>
                  <option value="editor">Editor</option>
                  <option value="administrator">Administrator</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={saveUser}
              variant="primary"
              disabled={saving}
              size="sm"
              className="flex-1 text-xs"
            >
              {saving ? 'Creating...' : 'Create User'}
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
      )}

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className={`border rounded-lg p-2 smooth-hover mb-2 ${
              selectedUsers.has(user.id)
                ? 'bg-neutral-900/60 hover:bg-neutral-900/80 border-l-2 border-l-white/30 border-white/[0.08]'
                : expandedCards.has(user.id)
                  ? 'bg-neutral-900/60 hover:bg-neutral-900/80 border-l-2 border-l-white/[0.3] border-white/[0.04]'
                  : 'bg-neutral-900/40 hover:bg-neutral-900/60 border-white/[0.04]'
            }`}
          >
            {/* User Header */}
            <div 
              className="cursor-pointer flex items-start gap-3"
              onClick={() => toggleUserSelection(user.id)}
              onDoubleClick={() => toggleExpand(user.id)}
            >
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-400">{user.display_name || user.username}</span>
                    <span className={`text-xs ${getRoleTextColor(user.roles)}`}>
                      {user.roles[0]}
                    </span>
                    {lastUpdated === user.id && (
                      <span className="px-2 py-1 bg-green-600/80 text-green-200 text-xs rounded">
                        Saved!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(user);
                        toggleExpand(user.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="px-3 py-1 text-xs bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-md text-neutral-500 hover:text-neutral-400"
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-neutral-500 space-y-1">
                  <div>
                    <span className="text-neutral-600 text-[10px]">ID:</span>
                    <span className="text-neutral-500 text-[10px] ml-1">{user.id}</span>
                  </div>
                  
                  <div>
                    <span className="text-neutral-600 text-[10px]">Email:</span>
                    <span className="text-neutral-500 text-[10px] ml-1">{user.email}</span>
                  </div>
                  
                  <div>
                    <span className="text-neutral-600 text-[10px]">Username:</span>
                    <span className="text-neutral-500 text-[10px] ml-1">{user.username}</span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-green-400">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded View */}
            {expandedCards.has(user.id) && (
              <div className="mt-4 rounded p-4 bg-black hover:bg-black/90 row-hover">
                {editingUser === user.id ? (
                  /* Edit Form */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Column 1: User Details */}
                    <div className="space-y-2">
                      <div className="text-neutral-500 font-medium text-xs mb-2">
                        User Details
                      </div>
                      
                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Username:</div>
                        <input
                          type="text"
                          value={editForm.username || ''}
                          onChange={(e) => updateField('username', e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                        />
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Display Name:</div>
                        <input
                          type="text"
                          value={editForm.display_name || ''}
                          onChange={(e) => updateField('display_name', e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                        />
                      </div>
                    </div>

                    {/* Column 2: Contact */}
                    <div className="space-y-2">
                      <div className="text-neutral-500 font-medium text-xs mb-2">
                        Contact
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Email:</div>
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => updateField('email', e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                        />
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Name:</div>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => updateField('name', e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                        />
                      </div>
                    </div>

                    {/* Column 3: Account Management */}
                    <div className="space-y-2">
                      <div className="text-neutral-500 font-medium text-xs mb-2">
                        Account Management
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Role:</div>
                        <select
                          value={editForm.roles?.[0] || user.roles[0]}
                          onChange={(e) => updateField('roles', [e.target.value])}
                          className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                        >
                          <option value="subscriber">Subscriber</option>
                          <option value="customer">Customer</option>
                          <option value="contributor">Contributor</option>
                          <option value="author">Author</option>
                          <option value="editor">Editor</option>
                          <option value="administrator">Administrator</option>
                        </select>
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">New Password:</div>
                        <input
                          type="password"
                          value={editForm.password || ''}
                          onChange={(e) => updateField('password', e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg text-neutral-300 focus:bg-neutral-800/60 focus:outline-none text-xs border-b border-white/[0.02] smooth-hover"
                          placeholder="Leave empty to keep current"
                        />
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Password Reset:</div>
                        <button
                          type="button"
                          onClick={() => sendPasswordReset(user.id)}
                          className="w-full px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs smooth-hover"
                        >
                          Send Reset Link
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Column 1: User Details */}
                    <div className="space-y-2">
                      <div className="text-neutral-500 font-medium text-xs mb-2">
                        User Details
                      </div>
                      
                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Username:</div>
                        <div className="text-neutral-300 text-xs">{user.username}</div>
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Display Name:</div>
                        <div className="text-neutral-300 text-xs">{user.display_name}</div>
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Role:</div>
                        <div className="text-neutral-300 text-xs">{user.roles.join(', ')}</div>
                      </div>
                    </div>

                    {/* Column 2: Contact */}
                    <div className="space-y-2">
                      <div className="text-neutral-500 font-medium text-xs mb-2">
                        Contact
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Email:</div>
                        <div className="text-neutral-300 text-xs">{user.email}</div>
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Name:</div>
                        <div className="text-neutral-300 text-xs">{user.name || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Column 3: Account Management */}
                    <div className="space-y-2">
                      <div className="text-neutral-500 font-medium text-xs mb-2">
                        Account Management
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Status:</div>
                        <div className="text-neutral-300 text-xs text-green-400">Active</div>
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">User ID:</div>
                        <div className="text-neutral-300 text-xs">{user.id}</div>
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-1">Password Reset:</div>
                        <button
                          type="button"
                          onClick={() => sendPasswordReset(user.id)}
                          className="w-full px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs smooth-hover"
                        >
                          Send Reset Link
                        </button>
                      </div>

                      <div className="bg-neutral-900/40 rounded p-2">
                        <div className="text-neutral-600 text-xs mb-2">Application Passwords:</div>
                        
                        {/* Application Passwords List */}
                        {userAppPasswords[user.id] && userAppPasswords[user.id].length > 0 && (
                          <div className="mb-2">
                            <div className="grid grid-cols-4 gap-2 text-[10px] text-neutral-500 mb-1 px-1">
                              <div>Name</div>
                              <div>Created</div>
                              <div>Last Used</div>
                              <div>Action</div>
                            </div>
                            {userAppPasswords[user.id].map((appPassword: any) => (
                              <div key={appPassword.uuid} className="grid grid-cols-4 gap-2 text-[10px] text-neutral-400 py-1 px-1 border-b border-white/[0.05] last:border-b-0">
                                <div className="truncate">{appPassword.name}</div>
                                <div>{new Date(appPassword.created * 1000).toLocaleDateString()}</div>
                                <div>{appPassword.last_used ? new Date(appPassword.last_used * 1000).toLocaleDateString() : '—'}</div>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => revokeAppPassword(user.id, appPassword.uuid, appPassword.name)}
                                    className="px-1 py-0.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded text-red-300 text-[9px] smooth-hover"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Application Password Form */}
                        {showAppPasswordForm === user.id ? (
                          <div className="border-t border-white/[0.05] pt-2">
                            <div className="text-neutral-600 text-xs mb-1">New Application Password Name:</div>
                            <input
                              type="text"
                              value={appPasswordName}
                              onChange={(e) => setAppPasswordName(e.target.value)}
                              className="w-full px-2 py-1 bg-black border border-white/[0.1] rounded text-neutral-300 focus:border-white/[0.3] focus:outline-none text-xs mb-2"
                              placeholder="e.g., Mobile App"
                            />
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => createAppPassword(user.id, appPasswordName)}
                                className="flex-1 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs smooth-hover"
                              >
                                Create
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAppPasswordForm(null);
                                  setAppPasswordName('');
                                }}
                                className="flex-1 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-500 hover:text-neutral-400 text-xs smooth-hover"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAppPasswordForm(user.id)}
                            className="w-full px-2 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded text-neutral-400 hover:text-neutral-300 text-xs smooth-hover"
                          >
                            Add Application Password
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  {editingUser === user.id ? (
                    <>
                      <Button
                        onClick={saveUser}
                        variant="primary"
                        disabled={saving}
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
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
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => startEditing(user)}
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteUser(user.id)}
                        variant="danger"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredUsers.length === 0 && users.length > 0 && (
          <div className="p-8 text-center bg-neutral-900/40 rounded-lg border border-white/[0.04]">
            <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-neutral-400">No {activeTab === 'customers' ? 'customers' : 'staff members'} found</p>
            <p className="text-neutral-500 text-sm">
              {activeTab === 'customers' ? 'No customer accounts found' : 'No staff members found'}
            </p>
          </div>
        )}

        {users.length === 0 && (
          <div className="p-8 text-center bg-neutral-900/40 rounded-lg border border-white/[0.04]">
            <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-neutral-400">No users found</p>
            <p className="text-neutral-500 text-sm">Add your first user to get started</p>
          </div>
        )}
      </div>
    </div>
  );
});