import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, TextArea, Select } from './';
import { locationsService, LocationUpdateData } from '../../services/locations-service';

interface LocationCreateDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLocation: () => void;
}

export function LocationCreateDropdown({ 
  isOpen, 
  onClose, 
  onCreateLocation
}: LocationCreateDropdownProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
    email: '',
    is_active: '1',
    is_default: '0',
    priority: 0,
    status: 'active'
  });
  
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset form when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: '',
        email: '',
        is_active: '1',
        is_default: '0',
        priority: 0,
        status: 'active'
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowCreateForm(false);
    onClose();
  };

  const handleCreateLocationClick = () => {
    setShowCreateForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Location name is required');
      return;
    }
    
    setIsCreatingLocation(true);
    
    try {
      const response = await locationsService.createLocation(formData as LocationUpdateData);
      
      if (response && response.success) {
        // Call the parent callback to refresh the list
        onCreateLocation();
        
        // Close the form
        handleClose();
        
        // Show success message
        alert(`✅ Location "${formData.name}" created successfully!`);
      } else {
        throw new Error('Failed to create location');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Failed to create location: ${errorMessage}`);
    } finally {
      setIsCreatingLocation(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={`absolute right-0 top-full mt-1 bg-neutral-900/95 border border-white/[0.08] rounded-lg shadow-2xl backdrop-blur-sm z-50 overflow-hidden transition-all duration-200 ${
        showCreateForm ? 'w-96' : 'w-64'
      }`}
    >
      {!showCreateForm ? (
        <div className="p-3">
          <div className="text-neutral-400 text-xs font-medium mb-3 px-1">Add Locations</div>
          
          <div className="space-y-2">
            <button
              onClick={handleCreateLocationClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md hover:bg-white/[0.05] transition-colors group"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-white/[0.08] rounded-md flex items-center justify-center group-hover:bg-white/[0.12] transition-colors">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <div className="text-neutral-300 text-sm font-medium">New Location</div>
                <div className="text-neutral-500 text-xs">Create a new warehouse or retail location</div>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1 hover:bg-white/[0.05] rounded transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-neutral-300 text-sm font-medium">Create Location</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/[0.05] rounded transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="Location Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter location name"
                required
              />
            </div>

            <div>
              <Input
                label="Address Line 1"
                value={formData.address_line_1}
                onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
              />
              <Input
                label="State"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="Postal code"
              />
              <Select
                label="Country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                options={[
                  { value: 'US', label: 'United States' },
                  { value: 'CA', label: 'Canada' },
                  { value: 'GB', label: 'United Kingdom' }
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Phone number"
              />
              <Input
                label="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email address"
                type="email"
              />
            </div>

            <div>
              <TextArea
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-white/[0.08]">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isCreatingLocation}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFormSubmit}
                variant="primary"
                disabled={!formData.name || isCreatingLocation}
              >
                {isCreatingLocation ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Location...
                  </div>
                ) : (
                  'Create Location'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}