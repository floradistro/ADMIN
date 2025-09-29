'use client';

import React, { useState, useEffect } from 'react';
import { TaxRate, CreateTaxRateData, LocationTaxMapping, taxService } from '../../services/tax-service';
import { Button } from '../ui';

interface TaxConfigurationProps {
  locationId: number;
  locationName: string;
  onRefresh?: () => void;
}

export function TaxConfiguration({ locationId, locationName, onRefresh }: TaxConfigurationProps) {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [locationTaxRates, setLocationTaxRates] = useState<TaxRate[]>([]);
  const [locationTaxMappings, setLocationTaxMappings] = useState<LocationTaxMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState<Set<number>>(new Set());
  const [removeLoading, setRemoveLoading] = useState<Set<number>>(new Set());
  const [showAddTaxForm, setShowAddTaxForm] = useState(false);
  const [addTaxForm, setAddTaxForm] = useState<CreateTaxRateData>({
    name: '',
    rate: '',
    country: 'US',
    state: '',
    city: '',
    postcode: '',
    priority: 1,
    compound: false,
    shipping: false,
    order: 0,
    class: 'standard'
  });
  const [isCreatingTax, setIsCreatingTax] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadTaxData();
  }, [locationId]);

  const loadTaxData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    // Validate location ID - must be a valid positive number (accept both string and numeric)
    const numericLocationId = Number(locationId);
    if (!locationId || isNaN(numericLocationId) || numericLocationId <= 0) {
      console.log('Skipping tax data load for invalid location ID:', locationId, 'converted to:', numericLocationId);
      setError(`Invalid location ID provided: ${locationId}`);
      setLoading(false);
      return;
    }

    try {
      // Force fresh data load with cache busting - no cached data allowed
      console.log('Loading fresh tax data with cache busting for location:', locationId);
      
      const [allRatesResponse, locationRatesResponse, mappingsResponse] = await Promise.allSettled([
        taxService.getTaxRates({ per_page: 100 }),
        taxService.getTaxRatesForLocation(locationId),
        taxService.getLocationTaxMappings(locationId)
      ]);

      if (allRatesResponse.status === 'fulfilled') {
        console.log('All tax rates loaded:', allRatesResponse.value?.length || 0);
        setTaxRates(allRatesResponse.value);
      } else {
        console.error('Failed to load all tax rates:', allRatesResponse.reason);
      }

      if (locationRatesResponse.status === 'fulfilled') {
        console.log('Location tax rates loaded:', locationRatesResponse.value?.length || 0);
        console.log('Location tax rates data:', locationRatesResponse.value);
        // Log each tax rate's id specifically
        locationRatesResponse.value?.forEach((rate, index) => {
          console.log(`Tax rate ${index}:`, { id: rate.id, name: rate.name, originalId: rate.tax_rate_id });
        });
        setLocationTaxRates(locationRatesResponse.value);
      } else {
        console.error('Failed to load location tax rates:', locationRatesResponse.reason);
      }

      if (mappingsResponse.status === 'fulfilled') {
        console.log('Tax mappings loaded:', mappingsResponse.value?.length || 0);
        setLocationTaxMappings(mappingsResponse.value);
      } else {
        console.error('Failed to load tax mappings:', mappingsResponse.reason);
      }

      // If any critical request failed, show error
      if (allRatesResponse.status === 'rejected' && locationRatesResponse.status === 'rejected') {
        setError('Failed to load tax configuration data');
      }
    } catch (err) {
      setError('Failed to load tax configuration');
      console.error('Error loading tax data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle assigning tax rate to location with optimistic updates
  const handleAssignTaxRate = async (taxRateId: number, isDefault: boolean = false) => {
    // Find the actual tax rate to get the correct tax_rate_id for assignment
    const globalTaxRate = taxRates.find(rate => rate.id === taxRateId);
    const actualTaxRateId = globalTaxRate?.tax_rate_id || taxRateId;
    
    console.log('Starting tax assignment:', { locationId, taxRateId, actualTaxRateId, isDefault });
    
    // Check if this tax rate is already assigned to this location
    const alreadyAssigned = locationTaxRates.some(rate => 
      rate.id === taxRateId || rate.tax_rate_id === taxRateId || 
      rate.id === actualTaxRateId || rate.tax_rate_id === actualTaxRateId
    );
    if (alreadyAssigned) {
      const confirmUpdate = confirm(
        `This tax rate is already assigned to this location. ` +
        `Do you want to update its default status?`
      );
      if (!confirmUpdate) {
        return;
      }
    }

    setAssignLoading(prev => new Set([...prev, taxRateId]));
    
    // Optimistic update - add tax rate immediately if not already assigned
    if (!alreadyAssigned && globalTaxRate) {
      const optimisticTaxRate: TaxRate = {
        id: taxRateId,
        tax_rate_id: actualTaxRateId,
        name: globalTaxRate.name,
        rate: globalTaxRate.rate,
        country: globalTaxRate.country,
        state: globalTaxRate.state,
        city: globalTaxRate.city,
        postcode: globalTaxRate.postcode,
        priority: globalTaxRate.priority,
        compound: globalTaxRate.compound,
        shipping: globalTaxRate.shipping,
        order: globalTaxRate.order,
        class: globalTaxRate.class,
        postcodes: globalTaxRate.postcodes || [],
        cities: globalTaxRate.cities || []
      };

      setLocationTaxRates(prev => [...prev, optimisticTaxRate]);
      setLocationTaxMappings(prev => [...prev, {
        id: Date.now(),
        location_id: locationId,
        tax_rate_id: actualTaxRateId,
        is_default: isDefault,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    }
    
    const successMessage = alreadyAssigned ? 'Tax rate updated successfully' : 'Tax rate assigned successfully';
    setMessage({ type: 'success', text: successMessage });
    
    try {
      const result = await taxService.assignTaxToLocation(locationId, actualTaxRateId, isDefault);
      console.log('Tax assignment successful:', result);
      
      // Refresh data in background to sync with server (no loading spinner)
      await loadTaxData(false);
      setTimeout(() => setMessage(null), 2000);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      // Rollback optimistic update on error
      if (!alreadyAssigned) {
        setLocationTaxRates(prev => prev.filter(rate => 
          !(rate.id === taxRateId || rate.tax_rate_id === actualTaxRateId)
        ));
        setLocationTaxMappings(prev => prev.filter(mapping => 
          mapping.tax_rate_id !== actualTaxRateId
        ));
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Tax assignment error details:', error);
      
      let displayMessage = `Failed to assign tax rate: ${errorMessage}`;
      if (errorMessage.includes('Magic2 API error')) {
        displayMessage = `API Error: ${errorMessage.split(' - ')[1] || errorMessage}`;
      } else if (errorMessage.includes('Failed to assign tax to location')) {
        displayMessage = errorMessage;
      }
      
      setMessage({ type: 'error', text: displayMessage });
      setTimeout(() => setMessage(null), 6000);
    } finally {
      setAssignLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(taxRateId);
        return newSet;
      });
    }
  };

  // Handle removing tax rate from location with optimistic updates
  const handleRemoveTaxRate = async (taxRateId: number) => {
    // Find the actual tax rate to get the correct tax_rate_id
    const taxRate = locationTaxRates.find(rate => rate.id === taxRateId);
    const actualTaxRateId = taxRate?.tax_rate_id || taxRateId;
    
    console.log(`Removing tax rate ${taxRateId} (actual ID: ${actualTaxRateId}) from location ${locationId}`);
    
    setRemoveLoading(prev => new Set([...prev, taxRateId]));
    
    // Store current state for rollback
    const currentTaxRates = [...locationTaxRates];
    const currentMappings = [...locationTaxMappings];
    
    // Optimistic update - remove immediately
    setLocationTaxRates(prev => prev.filter(rate => 
      !(rate.id === taxRateId || rate.tax_rate_id === actualTaxRateId)
    ));
    setLocationTaxMappings(prev => prev.filter(mapping => 
      mapping.tax_rate_id !== actualTaxRateId
    ));
    
    setMessage({ type: 'success', text: 'Tax rate removed successfully' });
    
    try {
      const result = await taxService.removeTaxFromLocation(locationId, actualTaxRateId);
      console.log('Tax removal successful:', result);
      
      // Refresh data in background to sync with server (no loading spinner)
      await loadTaxData(false);
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      // Rollback optimistic update on error
      setLocationTaxRates(currentTaxRates);
      setLocationTaxMappings(currentMappings);
      
      console.error('Error removing tax rate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Failed to remove tax rate: ${errorMessage}` });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setRemoveLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(taxRateId);
        return newSet;
      });
    }
  };

  // Handle creating new tax rate
  const handleCreateTaxRate = async () => {
    if (!addTaxForm.name || !addTaxForm.rate) {
      setMessage({ type: 'error', text: 'Name and rate are required' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsCreatingTax(true);
    try {
      const newTaxRate = await taxService.createTaxRate(addTaxForm);
      setMessage({ type: 'success', text: 'Tax rate created successfully' });
      setTimeout(() => setMessage(null), 3000);
      
      // Reset form
      setAddTaxForm({
        name: '',
        rate: '',
        country: 'US',
        state: '',
        city: '',
        postcode: '',
        priority: 1,
        compound: false,
        shipping: false,
        order: 0,
        class: 'standard'
      });
      setShowAddTaxForm(false);
      
      await loadTaxData(); // Reload data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create tax rate' });
      setTimeout(() => setMessage(null), 3000);
      console.error('Error creating tax rate:', error);
    } finally {
      setIsCreatingTax(false);
    }
  };

  // Check if a tax rate is assigned to this location
  const isTaxRateAssigned = (taxRateId: number) => {
    // Check both id and tax_rate_id to handle potential mismatches
    const isAssigned = locationTaxRates.some(rate => 
      rate.id === taxRateId || rate.tax_rate_id === taxRateId
    );
    console.log(`Checking if tax rate ${taxRateId} is assigned:`, isAssigned);
    console.log('Available locationTaxRates:', locationTaxRates.map(r => ({ 
      id: r.id, 
      tax_rate_id: r.tax_rate_id, 
      name: r.name 
    })));
    return isAssigned;
  };

  // Get mapping info for a tax rate
  const getTaxRateMapping = (taxRateId: number) => {
    return locationTaxMappings.find(mapping => mapping.tax_rate_id === taxRateId);
  };

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
          <Button onClick={() => loadTaxData()} variant="secondary" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-neutral-400 text-sm font-medium">Tax Configuration for {locationName}</div>

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

      {/* Currently Assigned Tax Rates */}
      <div className="border border-white/[0.04] rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-neutral-400">Assigned Tax Rates</h4>
          <span className="text-xs text-neutral-500">{locationTaxRates.length} assigned</span>
        </div>
        
        {locationTaxRates.length > 0 ? (
          <div className="space-y-2">
            {locationTaxRates.map((rate) => {
              const mapping = getTaxRateMapping(rate.id);
              const isRemoving = removeLoading.has(rate.id);
              
              return (
                <div key={rate.id} className="flex items-center justify-between p-3 border border-white/[0.04] rounded min-w-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-neutral-400 text-sm font-medium truncate">{rate.name}</span>
                      <span className="text-neutral-500 text-xs bg-neutral-800 px-2 py-0.5 rounded flex-shrink-0">
                        {rate.rate}%
                      </span>
                      {mapping?.is_default && (
                        <span className="text-blue-400 text-xs bg-blue-900/20 px-2 py-0.5 rounded flex-shrink-0">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-600 text-xs mt-1 truncate">
                      {rate.country && `${rate.country}`}
                      {rate.state && `, ${rate.state}`}
                      {rate.city && `, ${rate.city}`}
                      {rate.postcode && ` ${rate.postcode}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleRemoveTaxRate(rate.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 text-xs whitespace-nowrap flex items-center"
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Unassigning...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Unassign</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-neutral-500 text-sm">No tax rates assigned to this location</p>
            <p className="text-neutral-600 text-xs mt-1">Assign tax rates from the available rates below</p>
          </div>
        )}
      </div>

      {/* Available Tax Rates to Assign */}
      <div className="border border-white/[0.04] rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-neutral-400">Available Tax Rates</h4>
          <Button
            onClick={() => setShowAddTaxForm(!showAddTaxForm)}
            variant="ghost"
            size="sm"
            className="text-xs flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Tax Rate
          </Button>
        </div>

        {/* Add Tax Rate Form */}
        {showAddTaxForm && (
          <div className="mb-4 p-4 border border-white/[0.04] rounded bg-neutral-800/30">
            <h5 className="text-sm font-medium text-neutral-400 mb-3">Create New Tax Rate</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Name *</label>
                <input
                  type="text"
                  value={addTaxForm.name}
                  onChange={(e) => setAddTaxForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-white/[0.08] rounded text-sm text-neutral-300 bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g., Sales Tax"
                  disabled={isCreatingTax}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={addTaxForm.rate}
                  onChange={(e) => setAddTaxForm(prev => ({ ...prev, rate: e.target.value }))}
                  className="w-full px-3 py-2 border border-white/[0.08] rounded text-sm text-neutral-300 bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="e.g., 8.25"
                  disabled={isCreatingTax}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Country</label>
                <input
                  type="text"
                  value={addTaxForm.country}
                  onChange={(e) => setAddTaxForm(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-white/[0.08] rounded text-sm text-neutral-300 bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="US"
                  disabled={isCreatingTax}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">State</label>
                <input
                  type="text"
                  value={addTaxForm.state}
                  onChange={(e) => setAddTaxForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-white/[0.08] rounded text-sm text-neutral-300 bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="CA"
                  disabled={isCreatingTax}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                onClick={() => setShowAddTaxForm(false)}
                variant="ghost"
                size="sm"
                disabled={isCreatingTax}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTaxRate}
                variant="primary"
                size="sm"
                disabled={isCreatingTax || !addTaxForm.name || !addTaxForm.rate}
              >
                {isCreatingTax ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Tax Rate'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Available Tax Rates List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {taxRates.filter(rate => !isTaxRateAssigned(rate.id)).map((rate) => {
            const isAssigning = assignLoading.has(rate.id);
            
            return (
              <div key={rate.id} className="flex items-center justify-between p-3 border border-white/[0.04] rounded min-w-0">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-neutral-400 text-sm font-medium truncate">{rate.name}</span>
                    <span className="text-neutral-500 text-xs bg-neutral-800 px-2 py-0.5 rounded flex-shrink-0">
                      {rate.rate}%
                    </span>
                    {rate.compound && (
                      <span className="text-orange-400 text-xs bg-orange-900/20 px-2 py-0.5 rounded flex-shrink-0">
                        Compound
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-600 text-xs mt-1 truncate">
                    {rate.country && `${rate.country}`}
                    {rate.state && `, ${rate.state}`}
                    {rate.city && `, ${rate.city}`}
                    {rate.postcode && ` ${rate.postcode}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleAssignTaxRate(rate.id, false)}
                    variant="ghost"
                    size="sm"
                    className="text-green-400 hover:text-green-300 text-xs whitespace-nowrap flex items-center"
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
                </div>
              </div>
            );
          })}
        </div>

        {taxRates.filter(rate => !isTaxRateAssigned(rate.id)).length === 0 && (
          <div className="text-center py-6">
            <p className="text-neutral-500 text-sm">All available tax rates are already assigned</p>
            <p className="text-neutral-600 text-xs mt-1">Create a new tax rate to add more options</p>
          </div>
        )}
      </div>
    </div>
  );
}
