'use client';

import React, { useState, useEffect } from 'react';
import { WordPressUser } from '../../services/users-service';
import { Button } from '../ui';

interface LocationEmployee extends WordPressUser {
  is_manager?: boolean;
}

interface EmployeeManagementProps {
  locationId: number;
  locationName: string;
  onRefresh?: () => void;
}

export function EmployeeManagement({ locationId, locationName, onRefresh }: EmployeeManagementProps) {
  const [assignedEmployees, setAssignedEmployees] = useState<LocationEmployee[]>([]);
  const [availableStaff, setAvailableStaff] = useState<WordPressUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState<Set<number>>(new Set());
  const [removeLoading, setRemoveLoading] = useState<Set<number>>(new Set());
  const [showStaffSearch, setShowStaffSearch] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadEmployeeData();
  }, [locationId]);

  const loadEmployeeData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load assigned employees and all available staff in parallel
      const [assignedResponse, staffResponse] = await Promise.allSettled([
        fetch(`/api/flora/locations/${locationId}/employees`),
        fetch('/api/users-matrix/users')
      ]);

      if (assignedResponse.status === 'fulfilled' && assignedResponse.value.ok) {
        const assigned = await assignedResponse.value.json();
        setAssignedEmployees(assigned);
      } else {
        setAssignedEmployees([]);
      }

      if (staffResponse.status === 'fulfilled' && staffResponse.value.ok) {
        const allUsers = await staffResponse.value.json();
        // Filter to only show staff (non-customer users)
        const staff = allUsers.filter((user: WordPressUser) => 
          user.roles && !user.roles.includes('customer')
        );
        setAvailableStaff(staff);
      } else {
        setAvailableStaff([]);
      }

      // If staff loading failed, show error
      if (staffResponse.status === 'rejected') {
        setError('Failed to load staff data');
      }
    } catch (err) {
      setError('Failed to load employee data');
      console.error('Error loading employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle assigning employee to location
  const handleAssignEmployee = async (userId: number, isManager: boolean = false) => {
    setAssignLoading(prev => new Set([...prev, userId]));
    try {
      const response = await fetch(`/api/flora/locations/${locationId}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          is_manager: isManager
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign employee');
      }

      setMessage({ type: 'success', text: 'Employee assigned successfully' });
      setTimeout(() => setMessage(null), 3000);
      await loadEmployeeData(); // Reload data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign employee' });
      setTimeout(() => setMessage(null), 3000);
      console.error('Error assigning employee:', error);
    } finally {
      setAssignLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Handle removing employee from location
  const handleRemoveEmployee = async (userId: number) => {
    setRemoveLoading(prev => new Set([...prev, userId]));
    try {
      const response = await fetch(`/api/flora/locations/${locationId}/employees/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove employee');
      }

      setMessage({ type: 'success', text: 'Employee removed successfully' });
      setTimeout(() => setMessage(null), 3000);
      await loadEmployeeData(); // Reload data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove employee' });
      setTimeout(() => setMessage(null), 3000);
      console.error('Error removing employee:', error);
    } finally {
      setRemoveLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Toggle manager role for employee
  const handleToggleManager = async (userId: number, currentIsManager: boolean) => {
    try {
      const response = await fetch(`/api/flora/locations/${locationId}/employees/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_manager: !currentIsManager
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee role');
      }

      setMessage({ type: 'success', text: 'Employee role updated successfully' });
      setTimeout(() => setMessage(null), 3000);
      await loadEmployeeData(); // Reload data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update employee role' });
      setTimeout(() => setMessage(null), 3000);
      console.error('Error updating employee role:', error);
    }
  };

  // Check if a staff member is already assigned to this location
  const isStaffAssigned = (userId: number) => {
    return assignedEmployees.some(emp => emp.id === userId);
  };

  // Filter available staff based on search and assignment status
  const filteredAvailableStaff = availableStaff.filter(staff => {
    const matchesSearch = staffSearchQuery === '' || 
      staff.username.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      staff.display_name.toLowerCase().includes(staffSearchQuery.toLowerCase());
    
    const notAssigned = !isStaffAssigned(staff.id);
    
    return matchesSearch && notAssigned;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-neutral-800 rounded w-32"></div>
          <div className="h-3 bg-neutral-800 rounded w-48"></div>
          <div className="h-3 bg-neutral-800 rounded w-40"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadEmployeeData} variant="secondary" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-neutral-400 text-sm font-medium">Employee Management for {locationName}</div>

      {/* Message Display */}
      {message && (
        <div className={`px-3 py-2 rounded-lg text-xs border transition-all duration-200 ${
          message.type === 'success' 
            ? 'bg-green-900/10 border-green-500/20 text-green-400' 
            : message.type === 'warning'
            ? 'bg-yellow-900/10 border-yellow-500/20 text-yellow-400'
            : 'bg-red-900/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' && (
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Assigned Employees */}
      <div className="border border-white/[0.04] rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-neutral-400">Assigned Employees</h4>
          <span className="text-xs text-neutral-500">{assignedEmployees.length} assigned</span>
        </div>
        
        {assignedEmployees.length > 0 ? (
          <div className="space-y-2">
            {assignedEmployees.map((employee) => {
              const isRemoving = removeLoading.has(employee.id);
              
              return (
                <div key={employee.id} className="flex items-center justify-between p-3 border border-white/[0.04] rounded min-w-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-neutral-400 text-sm font-medium truncate">{employee.display_name}</span>
                      <span className="text-neutral-500 text-xs bg-neutral-800/50 px-2 py-0.5 rounded flex-shrink-0">
                        @{employee.username}
                      </span>
                      {employee.is_manager && (
                        <span className="text-neutral-400 bg-neutral-800/50 border border-neutral-600/30 text-xs px-2 py-0.5 rounded flex-shrink-0">
                          Manager
                        </span>
                      )}
                      {employee.roles && employee.roles.length > 0 && (
                        <span className="text-neutral-500 text-xs bg-neutral-800/50 px-2 py-0.5 rounded flex-shrink-0">
                          {employee.roles[0]}
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-600 text-xs mt-1 truncate">
                      {employee.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleToggleManager(employee.id, employee.is_manager || false)}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-neutral-300 text-xs whitespace-nowrap"
                    >
                      {employee.is_manager ? 'Remove Manager' : 'Make Manager'}
                    </Button>
                    <Button
                      onClick={() => handleRemoveEmployee(employee.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 text-xs whitespace-nowrap"
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Removing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <svg className="w-8 h-8 text-neutral-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-neutral-500 text-sm">No employees assigned to this location</p>
            <p className="text-neutral-600 text-xs mt-1">Assign staff members from the available staff below</p>
          </div>
        )}
      </div>

      {/* Available Staff to Assign */}
      <div className="border border-white/[0.04] rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-neutral-400">Available Staff</h4>
          <Button
            onClick={() => setShowStaffSearch(!showStaffSearch)}
            variant="ghost"
            size="sm"
            className="text-xs flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {showStaffSearch ? 'Hide Search' : 'Search Staff'}
          </Button>
        </div>

        {/* Search Input */}
        {showStaffSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-white/[0.08] rounded text-sm text-neutral-300 bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        )}

        {/* Available Staff List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredAvailableStaff.map((staff) => {
            const isAssigning = assignLoading.has(staff.id);
            
            return (
              <div key={staff.id} className="flex items-center justify-between p-3 border border-white/[0.04] rounded min-w-0">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-neutral-400 text-sm font-medium truncate">{staff.display_name}</span>
                    <span className="text-neutral-500 text-xs bg-neutral-800/50 px-2 py-0.5 rounded flex-shrink-0">
                      @{staff.username}
                    </span>
                    {staff.roles && staff.roles.length > 0 && (
                      <span className="text-neutral-500 text-xs bg-neutral-800/50 px-2 py-0.5 rounded flex-shrink-0">
                        {staff.roles[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-600 text-xs mt-1 truncate">
                    {staff.email}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleAssignEmployee(staff.id, false)}
                    variant="ghost"
                    size="sm"
                    className="text-green-400 hover:text-green-300 text-xs whitespace-nowrap"
                    disabled={isAssigning}
                  >
                    {isAssigning ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Assigning...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Assign</span>
                      </div>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAssignEmployee(staff.id, true)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap"
                    disabled={isAssigning}
                  >
                    {isAssigning ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Assigning...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>As Manager</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAvailableStaff.length === 0 && availableStaff.length > 0 && (
          <div className="text-center py-6">
            <p className="text-neutral-500 text-sm">
              {staffSearchQuery ? 'No staff found matching search criteria' : 'All available staff are already assigned'}
            </p>
            <p className="text-neutral-600 text-xs mt-1">
              {staffSearchQuery ? 'Try a different search term' : 'Create new staff members in User Management to add more options'}
            </p>
          </div>
        )}
        
        {availableStaff.length === 0 && (
          <div className="text-center py-6">
            <p className="text-neutral-500 text-sm">No staff members found in the system</p>
            <p className="text-neutral-600 text-xs mt-1">Create staff members in User Management first, then assign them to locations</p>
          </div>
        )}
      </div>
    </div>
  );
}
