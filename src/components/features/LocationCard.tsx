'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Location, LocationUpdateData } from '../../services/locations-service';
import { Button } from '../ui';
import { TaxConfiguration } from './TaxConfiguration';
import { EmployeeManagement } from './EmployeeManagement';

interface LocationCardProps {
  location: Location;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  visibleColumns?: any[];
  onRefresh?: () => void;
}

type LocationTab = 'details' | 'taxes' | 'employees' | 'settings';

export const LocationCard = React.memo(function LocationCard({ 
  location, 
  isExpanded, 
  onToggleExpand, 
  onEdit,
  isSelected = false, 
  onSelect,
  visibleColumns = [],
  onRefresh
}: LocationCardProps) {
  
  const [activeTab, setActiveTab] = useState<LocationTab>('details');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  
  // Edit mode state
  const [editData, setEditData] = useState<LocationUpdateData>({
    name: location.name || '',
    description: location.description || '',
    address_line_1: location.address_line_1 || '',
    address_line_2: location.address_line_2 || '',
    city: location.city || '',
    state: location.state || '',
    postal_code: location.postal_code || '',
    country: location.country || 'US',
    phone: location.phone || '',
    email: location.email || '',
    is_active: String(location.is_active || '1'),
    is_default: String(location.is_default || '0'),
    priority: Number(location.priority) || 0,
    status: location.status || 'active'
  });

  // Handle collapse cleanup
  useEffect(() => {
    if (!isExpanded) {
      // Reset tab when card collapses
      setActiveTab('details');
      // Deactivate edit mode when card collapses
      setIsEditMode(false);
    }
  }, [isExpanded]);

  // Update edit data when location changes or entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setEditData({
        name: location.name || '',
        description: location.description || '',
        address_line_1: location.address_line_1 || '',
        address_line_2: location.address_line_2 || '',
        city: location.city || '',
        state: location.state || '',
        postal_code: location.postal_code || '',
        country: location.country || 'US',
        phone: location.phone || '',
        email: location.email || '',
        is_active: String(location.is_active || '1'),
        is_default: String(location.is_default || '0'),
        priority: Number(location.priority) || 0,
        status: location.status || 'active'
      });
    }
  }, [isEditMode, location]);

  // Handle save edits
  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/flora/locations/${location.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update location: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Location updated successfully' });
        
        // Clear success message after 2 seconds
        setTimeout(() => setMessage(null), 2000);
        
        // Exit edit mode
        setIsEditMode(false);
        
        // Trigger parent refresh if needed
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(result.error || 'Update failed');
      }
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update location. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset edit data to original values
    setEditData({
      name: location.name || '',
      description: location.description || '',
      address_line_1: location.address_line_1 || '',
      address_line_2: location.address_line_2 || '',
      city: location.city || '',
      state: location.state || '',
      postal_code: location.postal_code || '',
      country: location.country || 'US',
      phone: location.phone || '',
      email: location.email || '',
      is_active: String(location.is_active || '1'),
      is_default: String(location.is_default || '0'),
      priority: Number(location.priority) || 0,
      status: location.status || 'active'
    });
    
    setIsEditMode(false);
  };

  // Render column content (matching ProductTableRow structure)
  const renderColumnContent = () => {
    return (
      <>
        {/* Location Name */}
        <div className="flex-1 min-w-0 transition-all duration-200">
          <div className="truncate">
            {isEditMode ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent text-neutral-400 text-sm font-normal border-none outline-none focus:text-neutral-300 w-full"
                placeholder="Location name"
              />
            ) : (
              <span className={`text-sm font-normal truncate select-none ${
                isEditMode ? 'text-yellow-400 bg-yellow-900/20 px-1 rounded' : 'text-neutral-400'
              }`}>
                {location.name}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="w-32">
          <span className="text-xs px-2 py-0.5 rounded text-neutral-400 bg-neutral-800/50 border border-neutral-600/30">
            {String(location.is_active) === '1' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Address */}
        <div className="w-48">
          <div className="text-xs text-neutral-500 truncate">
            {location.city && location.state 
              ? `${location.city}, ${location.state}` 
              : location.address_line_1 || 'No address'}
          </div>
        </div>

        {/* Default Badge */}
        <div className="w-24">
          {String(location.is_default) === '1' && (
            <span className="text-xs text-neutral-400 bg-neutral-800/50 border border-neutral-600/30 px-2 py-0.5 rounded">
              Default
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div 
      className={`group transition-all mb-2 rounded-lg border-b border-white/[0.02] product-card ${
        isSelected 
        ? 'bg-neutral-800/50 border-l-4 border-l-neutral-400' 
        : 'border border-white/[0.04]'
      }`}
    >
      {/* Row 1: Main location info */}
      <div 
        className="flex items-center gap-3 px-4 py-2 cursor-pointer select-none"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isInteractiveElement = target.tagName === 'INPUT' || 
                                     target.tagName === 'BUTTON' || 
                                     target.tagName === 'SELECT' ||
                                     target.tagName === 'TEXTAREA' ||
                                     target.closest('button') ||
                                     target.closest('input') ||
                                     target.closest('select') ||
                                     target.closest('textarea');
          
          if (!isInteractiveElement && onSelect) {
            onSelect();
          }
        }}
        onDoubleClick={(e) => {
          const target = e.target as HTMLElement;
          const isInteractiveElement = target.tagName === 'INPUT' || 
                                     target.tagName === 'BUTTON' || 
                                     target.tagName === 'SELECT' ||
                                     target.tagName === 'TEXTAREA' ||
                                     target.closest('button') ||
                                     target.closest('input') ||
                                     target.closest('select') ||
                                     target.closest('textarea');
          
          if (!isInteractiveElement) {
            e.stopPropagation();
            onToggleExpand();
          }
        }}
      >
        {/* Expand/Collapse Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-neutral-600"
        >
          <svg
            className={`w-2 h-2 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dynamic Columns */}
        {renderColumnContent()}
      </div>

      {/* Expanded View with Optimized Animation */}
      <div 
        className={`overflow-hidden expand-animation smooth-expand ${
          isExpanded ? 'max-h-[1200px] opacity-100 expanded' : 'max-h-0 opacity-0 collapsed'
        }`}
      >
        <div className="mx-4 mb-2 rounded p-4 border border-white/[0.04] product-card">
          <div className={`transition-opacity duration-100 ease-out ${isExpanded ? 'opacity-100 delay-75' : 'opacity-0'}`}>
          
            {/* Edit Mode Controls */}
            {isEditMode && (
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <div className="text-neutral-300 text-sm font-medium">
                      Edit Mode
                    </div>
                  </div>
                  <div className="text-neutral-500 text-xs">
                    Click on fields to edit them
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="ghost"
                    className="text-xs text-neutral-500"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdits}
                    size="sm"
                    variant="primary"
                    className="text-xs"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`mb-3 px-3 py-2 rounded-lg text-xs border transition-all duration-200 ${
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

            {/* Tab Buttons */}
            <div className="flex items-center gap-2 mb-4 pb-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('details');
                }}
                size="sm"
                variant="ghost"
                className={`text-xs select-none ${
                  activeTab === 'details' 
                    ? 'text-neutral-300 bg-neutral-800/50 border border-neutral-600/30' 
                    : 'text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/30'
                }`}
              >
                Details
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('taxes');
                }}
                size="sm"
                variant="ghost"
                className={`text-xs flex items-center gap-1 select-none ${
                  activeTab === 'taxes' 
                    ? 'text-neutral-300 bg-neutral-800/50 border border-neutral-600/30' 
                    : 'text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/30'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Taxes
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('employees');
                }}
                size="sm"
                variant="ghost"
                className={`text-xs flex items-center gap-1 select-none ${
                  activeTab === 'employees' 
                    ? 'text-neutral-300 bg-neutral-800/50 border border-neutral-600/30' 
                    : 'text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/30'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Employees
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('settings');
                }}
                size="sm"
                variant="ghost"
                className={`text-xs flex items-center gap-1 select-none ${
                  activeTab === 'settings' 
                    ? 'text-neutral-300 bg-neutral-800/50 border border-neutral-600/30' 
                    : 'text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/30'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsEditMode(!isEditMode);
                }}
                size="sm"
                variant="ghost"
                className={`text-xs flex items-center gap-1 select-none ${
                  isEditMode 
                    ? 'text-neutral-300 bg-neutral-800/50 border border-neutral-600/30' 
                    : 'text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/30'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditMode ? 'Editing' : 'Edit'}
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Column 1: Basic Information */}
                <div className="space-y-2">
                  <div className="text-neutral-500 font-medium text-xs mb-2">
                    Basic Information
                  </div>

                  {/* Location Name */}
                  <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                    isEditMode ? 'border-white/[0.08]' : ''
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-neutral-600 text-xs font-medium">Name</div>
                    </div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                        placeholder="Location name"
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs">
                        {location.name || 'No name'}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                    isEditMode ? 'border-white/[0.08]' : ''
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-neutral-600 text-xs font-medium">Description</div>
                    </div>
                    {isEditMode ? (
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-neutral-500 text-xs leading-relaxed border-none outline-none focus:text-neutral-300 w-full resize-none"
                        placeholder="Location description"
                        rows={3}
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs leading-relaxed">
                        {location.description || 'No description'}
                      </div>
                    )}
                  </div>

                  {/* Status Controls */}
                  <div className="border border-white/[0.04] rounded p-2">
                    <div className="text-neutral-600 text-xs font-medium mb-2">Status</div>
                    <div className="space-y-2">
                      {isEditMode ? (
                        <>
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editData.is_active === '1'}
                              onChange={(e) => setEditData(prev => ({ ...prev, is_active: e.target.checked ? '1' : '0' }))}
                              className="rounded border-neutral-600 bg-neutral-800 text-white focus:ring-white/20"
                            />
                            <span className="text-neutral-500">Active</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editData.is_default === '1'}
                              onChange={(e) => setEditData(prev => ({ ...prev, is_default: e.target.checked ? '1' : '0' }))}
                              className="rounded border-neutral-600 bg-neutral-800 text-white focus:ring-white/20"
                            />
                            <span className="text-neutral-500">Default Location</span>
                          </label>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-0.5 rounded text-neutral-400 bg-neutral-800/50 border border-neutral-600/30">
                            {String(location.is_active) === '1' ? 'Active' : 'Inactive'}
                          </span>
                          {String(location.is_default) === '1' && (
                            <span className="text-xs text-neutral-400 bg-neutral-800/50 border border-neutral-600/30 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Address Information */}
                <div className="space-y-2">
                  <div className="text-neutral-500 font-medium text-xs mb-2">
                    Address Information
                  </div>

                  {/* Address Line 1 */}
                  <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                    isEditMode ? 'border-white/[0.08]' : ''
                  }`}>
                    <div className="text-neutral-600 text-xs font-medium mb-1">Address Line 1</div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.address_line_1 || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, address_line_1: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                        placeholder="Street address"
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs">
                        {location.address_line_1 || 'No address'}
                      </div>
                    )}
                  </div>

                  {/* Address Line 2 */}
                  <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                    isEditMode ? 'border-white/[0.08]' : ''
                  }`}>
                    <div className="text-neutral-600 text-xs font-medium mb-1">Address Line 2</div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.address_line_2 || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, address_line_2: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                        placeholder="Apt, suite, etc."
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs">
                        {location.address_line_2 || 'N/A'}
                      </div>
                    )}
                  </div>

                  {/* City, State, Postal Code */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                      isEditMode ? 'border-white/[0.08]' : ''
                    }`}>
                      <div className="text-neutral-600 text-xs font-medium mb-1">City</div>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editData.city || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                          placeholder="City"
                        />
                      ) : (
                        <div className="text-neutral-500 text-xs">
                          {location.city || 'N/A'}
                        </div>
                      )}
                    </div>
                    <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                      isEditMode ? 'border-white/[0.08]' : ''
                    }`}>
                      <div className="text-neutral-600 text-xs font-medium mb-1">State</div>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editData.state || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                          placeholder="State"
                        />
                      ) : (
                        <div className="text-neutral-500 text-xs">
                          {location.state || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                    isEditMode ? 'border-white/[0.08]' : ''
                  }`}>
                    <div className="text-neutral-600 text-xs font-medium mb-1">Postal Code</div>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editData.postal_code || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, postal_code: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                        placeholder="Postal code"
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs">
                        {location.postal_code || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Contact Information */}
                <div className="space-y-2">
                  <div className="text-neutral-500 font-medium text-xs mb-2">
                    Contact Information
                  </div>

                  {/* Phone */}
                  <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                    isEditMode ? 'border-white/[0.08]' : ''
                  }`}>
                    <div className="text-neutral-600 text-xs font-medium mb-1">Phone</div>
                    {isEditMode ? (
                      <input
                        type="tel"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                        placeholder="Phone number"
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs">
                        {location.phone || 'No phone'}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className={`border border-white/[0.04] rounded p-2 transition-all duration-200 ${
                    isEditMode ? 'border-white/[0.08]' : ''
                  }`}>
                    <div className="text-neutral-600 text-xs font-medium mb-1">Email</div>
                    {isEditMode ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-neutral-500 text-xs border-none outline-none focus:text-neutral-300 w-full"
                        placeholder="Email address"
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs">
                        {location.email || 'No email'}
                      </div>
                    )}
                  </div>

                  {/* Additional Info */}
                  <div className="border border-white/[0.04] rounded p-2">
                    <div className="text-neutral-600 text-xs font-medium mb-1">Location ID</div>
                    <div className="text-neutral-500 text-xs">{location.id}</div>
                  </div>

                  {/* Timestamps */}
                  <div className="border border-white/[0.04] rounded p-2">
                    <div className="text-neutral-600 text-xs font-medium mb-1">Created</div>
                    <div className="text-neutral-500 text-xs">
                      {location.created_at ? new Date(location.created_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div className="border border-white/[0.04] rounded p-2">
                    <div className="text-neutral-600 text-xs font-medium mb-1">Last Updated</div>
                    <div className="text-neutral-500 text-xs">
                      {location.updated_at ? new Date(location.updated_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Taxes Tab */}
            {activeTab === 'taxes' && (
              <TaxConfiguration
                locationId={location.id}
                locationName={location.name}
                onRefresh={onRefresh}
              />
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
              <EmployeeManagement
                locationId={location.id}
                locationName={location.name}
                onRefresh={onRefresh}
              />
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="text-neutral-400 text-sm font-medium">Location Settings</div>
                <div className="border border-white/[0.04] rounded p-4">
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-neutral-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-neutral-500 text-sm">Advanced settings will be implemented here</p>
                    <p className="text-neutral-600 text-xs mt-1">Configure location-specific preferences and options</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
