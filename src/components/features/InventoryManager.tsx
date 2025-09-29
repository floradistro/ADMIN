'use client';

import React, { useState, useEffect } from 'react';
import { Button, Select, Input } from '../ui';
import { FloraLocation, InventoryService } from '../../services/inventory-service';
import { inventoryService } from '../../services/inventory-service';
import { InventoryDuplicatePrevention } from '../../lib/inventory-duplicate-prevention';
import { Product } from '../../types';
import { recipeService, Recipe } from '../../services/recipe-service';
import { varianceHistoryService, ConversionRecord, VarianceReason } from '../../services/variance-history-service';
import { ChevronDown, ChevronUp, Clock, TrendingUp, AlertCircle, CheckCircle, History, Activity } from 'lucide-react';

interface InventoryManagerProps {
  product: Product;
  locations: FloraLocation[];
  onSuccess?: () => void;
  onClose?: () => void;
}

type OperationType = 'transfer' | 'update' | 'convert';

export function InventoryManager({ product, locations, onSuccess, onClose }: InventoryManagerProps) {
  const [activeOperation, setActiveOperation] = useState<OperationType>('update');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transfer state
  const [transferData, setTransferData] = useState({
    fromLocationId: '',
    toLocationId: '',
    quantity: '',
    notes: ''
  });

  // Update state
  const [updateData, setUpdateData] = useState({
    locationId: '',
    quantity: '',
    operation: 'set' as 'set' | 'add' | 'subtract',
    notes: ''
  });

  // Convert state
  const [convertData, setConvertData] = useState({
    targetProductId: '',
    sourceLocationId: '',
    targetLocationId: '',
    sourceQuantity: '',
    targetQuantity: '',
    conversionRatio: '',
    notes: '',
    recipeId: '',
    expectedOutput: 0,
    actualOutput: '',
    varianceReasons: [] as string[],
    conversionId: null as number | null,
    conversionStatus: 'pending' as 'pending' | 'yield_recording' | 'completed'
  });

  // Recipe and variance state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [varianceReasons, setVarianceReasons] = useState<VarianceReason[]>([]);
  const [conversionHistory, setConversionHistory] = useState<ConversionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const flatLocations = React.useMemo(() => {
    const flat: FloraLocation[] = [];
    locations.forEach(location => {
      flat.push(location);
      if (location.children) {
        flat.push(...location.children);
      }
    });
    return flat;
  }, [locations]);

  // Load recipes and variance reasons on mount
  useEffect(() => {
    if (activeOperation === 'convert') {
      loadRecipes();
      loadVarianceReasons();
      loadConversionHistory();
    }
  }, [activeOperation]);

  const loadRecipes = async () => {
    setLoadingRecipes(true);
    
    try {
      // Try to get product-specific recipes first
      const availableRecipes = await varianceHistoryService.getAvailableRecipes(product.id);
      
      if (availableRecipes.length > 0) {
        const activeRecipes = availableRecipes.filter(r => r.status === 'active');
        setRecipes(activeRecipes);
      } else {
        // Fallback to all recipes if no product-specific API
        const fetchedRecipes = await recipeService.getRecipes();
        
        const activeRecipes = fetchedRecipes.filter(r => r.status === 'active');
        setRecipes(activeRecipes);
      }
    } catch (error) {
      // Fallback to all recipes on error
      try {
        const fetchedRecipes = await recipeService.getRecipes();
        const activeRecipes = fetchedRecipes.filter(r => r.status === 'active');
        setRecipes(activeRecipes);
      } catch (fallbackError) {
        setRecipes([]); // Ensure we don't leave it in loading state
      }
    } finally {
      setLoadingRecipes(false);
    }
  };

  const loadVarianceReasons = async () => {
    try {
      const reasons = await varianceHistoryService.getVarianceReasons();
      setVarianceReasons(reasons.filter(r => r.is_active));
    } catch (error) {
    }
  };

  const loadConversionHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await varianceHistoryService.getProductConversionHistory(product.id);
      setConversionHistory(history);
    } catch (error) {
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle recipe selection
  const handleRecipeChange = (recipeId: string) => {
    const recipe = recipes.find(r => r.id.toString() === recipeId);
    setSelectedRecipe(recipe || null);
    
    if (recipe && convertData.sourceQuantity) {
      const expectedOutput = parseFloat(convertData.sourceQuantity) * recipe.base_ratio;
      setConvertData(prev => ({
        ...prev,
        recipeId,
        expectedOutput,
        targetQuantity: expectedOutput.toFixed(2)
      }));
    } else {
      setConvertData(prev => ({ ...prev, recipeId }));
    }
  };

  // Calculate expected output when quantity changes
  const handleSourceQuantityChange = (value: string) => {
    setConvertData(prev => {
      const newData = { ...prev, sourceQuantity: value };
      
      if (selectedRecipe && value) {
        const expectedOutput = parseFloat(value) * selectedRecipe.base_ratio;
        newData.expectedOutput = expectedOutput;
        newData.targetQuantity = expectedOutput.toFixed(2);
      }
      
      return newData;
    });
  };

  const locationOptions = flatLocations.map(loc => ({
    value: loc.id.toString(),
    label: loc.name
  }));

  const handleTransfer = async () => {
    if (!transferData.fromLocationId || !transferData.toLocationId || !transferData.quantity) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (transferData.fromLocationId === transferData.toLocationId) {
      setMessage({ type: 'error', text: 'Source and destination locations must be different' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await inventoryService.transferStock(
        product.id,
        parseInt(transferData.fromLocationId),
        parseInt(transferData.toLocationId),
        parseFloat(transferData.quantity),
        transferData.notes
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Stock transferred successfully!' });
        setTransferData({
          fromLocationId: '',
          toLocationId: '',
          quantity: '',
          notes: ''
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Transfer failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Transfer failed: Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Validate required fields
    if (!updateData.locationId || !updateData.quantity) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Validate quantity is a valid number
    const quantity = parseFloat(updateData.quantity);
    if (isNaN(quantity)) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    if (quantity < 0) {
      setMessage({ type: 'error', text: 'Quantity cannot be negative' });
      return;
    }

    // Validate location ID
    const locationId = parseInt(updateData.locationId);
    if (isNaN(locationId) || locationId <= 0) {
      setMessage({ type: 'error', text: 'Please select a valid location' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Find the inventory record for this product and location
    const inventoryRecord = product.inventory?.find(inv => 
      inv.location_id.toString() === updateData.locationId.toString()
    );

    if (!inventoryRecord) {
      setMessage({ type: 'error', text: 'Inventory record not found for this location' });
      setIsLoading(false);
      return;
    }

    if (!inventoryRecord.id) {
      setMessage({ type: 'error', text: 'Inventory record ID not found - cannot update' });
      setIsLoading(false);
      return;
    }


    // Use Flora IM API directly with product_id and location_id
    const response = await fetch('/api/flora/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: product.id,
        location_id: parseInt(updateData.locationId),
        quantity: quantity
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      setMessage({ type: 'error', text: `API request failed: ${response.status} ${response.statusText} - ${errorText}` });
      setIsLoading(false);
      return;
    }

    const result = await response.json();

    if (result.success) {
      setMessage({ type: 'success', text: 'Stock updated successfully!' });
      setUpdateData({ locationId: '', quantity: '', operation: 'set', notes: '' });
      // Add a small delay to ensure the backend has processed the update
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } else {
      const errorMessage = result.error || 'Update failed';
      setMessage({ type: 'error', text: errorMessage });
    }

    setIsLoading(false);
  };

  const handleConvert = async () => {
    // Handle different conversion stages
    if (convertData.conversionStatus === 'yield_recording') {
      await handleCompleteConversion();
      return;
    }

    // Initial conversion validation
    if (!convertData.sourceLocationId || !convertData.sourceQuantity) {
      setMessage({ type: 'error', text: 'Please fill in source location and quantity' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // If using a recipe, initiate recipe-based conversion
      if (selectedRecipe) {
        const validationResult = await varianceHistoryService.validateConversion({
          recipe_id: selectedRecipe.id,
          input_product_id: product.id,
          location_id: parseInt(convertData.sourceLocationId),
          input_quantity: parseFloat(convertData.sourceQuantity),
          notes: convertData.notes
        });

        if (!validationResult.valid) {
          setMessage({ 
            type: 'error', 
            text: validationResult.errors?.join(', ') || 'Conversion validation failed' 
          });
          setIsLoading(false);
          return;
        }

        // Initiate the conversion
        const conversion = await varianceHistoryService.initiateConversion({
          recipe_id: selectedRecipe.id,
          input_product_id: product.id,
          location_id: parseInt(convertData.sourceLocationId),
          input_quantity: parseFloat(convertData.sourceQuantity),
          notes: convertData.notes
        });

        // Move to yield recording stage
        setConvertData(prev => ({
          ...prev,
          conversionId: conversion.id,
          conversionStatus: 'yield_recording',
          expectedOutput: conversion.expected_output
        }));

        setMessage({ 
          type: 'success', 
          text: `Conversion initiated. Input deducted. Please record actual output.` 
        });
      } else {
        // Fallback to direct conversion without recipe
        if (!convertData.targetProductId || !convertData.targetQuantity) {
          setMessage({ type: 'error', text: 'Please select target product and quantity or use a recipe' });
          setIsLoading(false);
          return;
        }

        const result = await inventoryService.convertStock(
          product.id,
          parseInt(convertData.targetProductId),
          parseInt(convertData.sourceLocationId),
          parseFloat(convertData.sourceQuantity),
          parseFloat(convertData.targetQuantity),
          convertData.notes
        );

        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: `Successfully converted ${convertData.sourceQuantity} units to ${convertData.targetQuantity} units` 
          });
          
          // Reset form
          resetConvertForm();
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          setMessage({ type: 'error', text: result.error || 'Conversion failed' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Conversion failed: Network error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteConversion = async () => {
    if (!convertData.conversionId || !convertData.actualOutput) {
      setMessage({ type: 'error', text: 'Please enter actual output quantity' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const completion = await varianceHistoryService.completeConversion({
        conversion_id: convertData.conversionId,
        actual_output: parseFloat(convertData.actualOutput),
        variance_reasons: convertData.varianceReasons,
        notes: convertData.notes
      });

      const variance = completion.variance_percentage || 0;
      const varianceText = variance > 0 ? `+${variance}%` : `${variance}%`;

      setMessage({ 
        type: 'success', 
        text: `Conversion completed. Actual output: ${convertData.actualOutput} units (${varianceText} variance)` 
      });
      
      // Reset form and reload history
      resetConvertForm();
      loadConversionHistory();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to complete conversion' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetConvertForm = () => {
    setConvertData({
      targetProductId: '',
      sourceLocationId: '',
      targetLocationId: '',
      sourceQuantity: '',
      targetQuantity: '',
      conversionRatio: '',
      notes: '',
      recipeId: '',
      expectedOutput: 0,
      actualOutput: '',
      varianceReasons: [],
      conversionId: null,
      conversionStatus: 'pending'
    });
    setSelectedRecipe(null);
  };

  const toggleVarianceReason = (reasonCode: string) => {
    setConvertData(prev => ({
      ...prev,
      varianceReasons: prev.varianceReasons.includes(reasonCode)
        ? prev.varianceReasons.filter(r => r !== reasonCode)
        : [...prev.varianceReasons, reasonCode]
    }));
  };

  const calculateVariance = () => {
    if (!convertData.expectedOutput || !convertData.actualOutput) return 0;
    const actual = parseFloat(convertData.actualOutput);
    const expected = convertData.expectedOutput;
    return ((actual - expected) / expected) * 100;
  };

  return (
    <div className="p-6 bg-neutral-900 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Inventory Management</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/90 smooth-hover"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-white/70">Product:</span>
          <span className="text-neutral-300 font-normal">{product.name}</span>
          {product.categories && product.categories.length > 0 && (
            <span className="text-neutral-600 text-xs bg-neutral-800/50 px-2 py-0.5 rounded">
              {product.categories[0].name}
            </span>
          )}
        </div>
        <p className="text-sm text-white/70">SKU: <span className="text-white/90">{product.sku}</span></p>
      </div>

      {/* Operation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        {[
          { key: 'update' as const, label: 'Update Stock' },
          { key: 'transfer' as const, label: 'Transfer Stock' },
          { key: 'convert' as const, label: 'Convert Product' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveOperation(key)}
            className={`px-4 py-2 text-sm font-medium smooth-hover border-b-2 ${
              activeOperation === key
                ? 'text-blue-400 border-blue-400'
                : 'text-white/60 border-transparent hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Update Stock */}
      {activeOperation === 'update' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Location</label>
            <Select
              value={updateData.locationId}
              onChange={(e) => setUpdateData(prev => ({ ...prev, locationId: e.target.value }))}
              options={[
                { value: '', label: 'Select Location' },
                ...locationOptions
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Operation</label>
              <Select
                value={updateData.operation}
                onChange={(e) => setUpdateData(prev => ({ ...prev, operation: e.target.value as any }))}
                options={[
                  { value: 'set', label: 'Set Quantity' },
                  { value: 'add', label: 'Add Quantity' },
                  { value: 'subtract', label: 'Subtract Quantity' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Quantity</label>
              <Input
                type="number"
                step="0.1"
                value={updateData.quantity}
                onChange={(e) => setUpdateData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Notes (Optional)</label>
            <Input
              value={updateData.notes}
              onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes about this update"
            />
          </div>

          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update Stock'}
          </Button>
        </div>
      )}

      {/* Transfer Stock */}
      {activeOperation === 'transfer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">From Location</label>
              <Select
                value={transferData.fromLocationId}
                onChange={(e) => setTransferData(prev => ({ ...prev, fromLocationId: e.target.value }))}
                options={[
                  { value: '', label: 'Select Location' },
                  ...locationOptions
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">To Location</label>
              <Select
                value={transferData.toLocationId}
                onChange={(e) => setTransferData(prev => ({ ...prev, toLocationId: e.target.value }))}
                options={[
                  { value: '', label: 'Select Location' },
                  ...locationOptions.filter(opt => opt.value !== transferData.fromLocationId)
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Quantity to Transfer</label>
            <Input
              type="number"
              step="0.1"
              value={transferData.quantity}
              onChange={(e) => setTransferData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Notes (Optional)</label>
            <Input
              value={transferData.notes}
              onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes about this transfer"
            />
          </div>

          <Button
            onClick={handleTransfer}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Transferring...' : 'Transfer Stock'}
          </Button>
        </div>
      )}

      {/* Convert Product */}
      {activeOperation === 'convert' && (
        <div className="space-y-4">
          {/* Note: Conversion history is now available in the unified Audit History panel */}
          <div className="mb-4 p-3 bg-blue-900/10 border border-blue-500/20 rounded">
            <div className="text-xs text-blue-300 flex items-center gap-2">
              <History className="w-3 h-3" />
              <span>View all conversion history in the Audit History panel</span>
            </div>
          </div>

          {/* Conversion Status Badge */}
          {convertData.conversionStatus === 'yield_recording' && (
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Yield Recording Stage</span>
              </div>
              <p className="text-xs text-white/70">
                Input has been deducted. Please record the actual output quantity and any variance reasons.
              </p>
            </div>
          )}

          {/* Recipe Selector */}
          {convertData.conversionStatus === 'pending' && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Recipe (Optional - Use for tracked conversions)
                </label>
                <Select
                  value={convertData.recipeId}
                  onChange={(e) => handleRecipeChange(e.target.value)}
                  options={[
                    { value: '', label: loadingRecipes ? 'Loading recipes...' : 'Select Recipe or Convert Directly' },
                    ...recipes.map(recipe => ({
                      value: recipe.id.toString(),
                      label: `${recipe.name} (${recipe.base_ratio}:1 ${recipe.ratio_unit})`
                    }))
                  ]}
                  disabled={loadingRecipes}
                />
                {selectedRecipe && (
                  <div className="mt-2 p-2 bg-neutral-800 rounded text-xs text-white/70">
                    {selectedRecipe.description}
                    {selectedRecipe.track_variance && (
                      <div className="mt-1 text-yellow-400">
                        Variance tracking enabled (±{(selectedRecipe.acceptable_variance * 100).toFixed(0)}% acceptable)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Direct Conversion Fields (when no recipe selected) */}
              {!selectedRecipe && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Target Product ID</label>
                  <Input
                    type="number"
                    value={convertData.targetProductId}
                    onChange={(e) => setConvertData(prev => ({ ...prev, targetProductId: e.target.value }))}
                    placeholder="Enter target product ID for direct conversion"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Source Location</label>
                  <Select
                    value={convertData.sourceLocationId}
                    onChange={(e) => setConvertData(prev => ({ ...prev, sourceLocationId: e.target.value }))}
                    options={[
                      { value: '', label: 'Select Location' },
                      ...locationOptions
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Source Quantity</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={convertData.sourceQuantity}
                    onChange={(e) => handleSourceQuantityChange(e.target.value)}
                    placeholder="Enter source quantity"
                  />
                </div>
              </div>

              {/* Expected Output (when recipe selected) */}
              {selectedRecipe && convertData.expectedOutput > 0 && (
                <div className="p-3 bg-neutral-800 rounded">
                  <div className="text-sm text-white/70">
                    Expected Output: <span className="text-white font-medium">
                      {convertData.expectedOutput.toFixed(2)} units
                    </span>
                  </div>
                </div>
              )}

              {/* Manual Target Quantity (when no recipe) */}
              {!selectedRecipe && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Target Quantity</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={convertData.targetQuantity}
                    onChange={(e) => setConvertData(prev => ({ ...prev, targetQuantity: e.target.value }))}
                    placeholder="Enter target quantity"
                  />
                </div>
              )}
            </>
          )}

          {/* Enhanced Yield Recording Stage */}
          {convertData.conversionStatus === 'yield_recording' && (
            <>
              {/* Progress Indicator */}
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Yield Recording Phase</span>
                </div>
                <div className="text-xs text-blue-200/80">
                  Input has been deducted. Please record the actual output to complete the conversion.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-800 rounded border border-white/10">
                  <div className="text-xs text-white/60 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Expected Output
                  </div>
                  <div className="text-lg font-medium text-white">
                    {convertData.expectedOutput.toFixed(2)} units
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    Based on recipe ratio
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Actual Output
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={convertData.actualOutput}
                    onChange={(e) => setConvertData(prev => ({ ...prev, actualOutput: e.target.value }))}
                    placeholder="Enter actual output"
                    className={`${
                      convertData.actualOutput && Math.abs(calculateVariance()) > 5
                        ? 'border-yellow-500/50 bg-yellow-900/10'
                        : convertData.actualOutput 
                        ? 'border-green-500/50 bg-green-900/10'
                        : ''
                    }`}
                  />
                  {convertData.actualOutput && (
                    <div className="mt-1 text-xs text-neutral-400">
                      Yield: {((parseFloat(convertData.actualOutput) / convertData.expectedOutput) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Variance Display */}
              {convertData.actualOutput && (
                <div className={`p-3 rounded transition-all ${
                  Math.abs(calculateVariance()) > 10
                    ? 'bg-red-900/20 border border-red-500/30'
                    : Math.abs(calculateVariance()) > 5
                    ? 'bg-yellow-900/20 border border-yellow-500/30'
                    : 'bg-green-900/20 border border-green-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/80">Variance:</span>
                      {Math.abs(calculateVariance()) > 5 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-yellow-400">Alert</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-lg font-medium ${
                      Math.abs(calculateVariance()) > 10 
                        ? 'text-red-400' 
                        : Math.abs(calculateVariance()) > 5 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                    }`}>
                      {calculateVariance() > 0 ? '+' : ''}{calculateVariance().toFixed(2)}%
                    </span>
                  </div>
                  
                  {/* Variance Threshold Indicator */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-neutral-700/50 rounded-full h-1.5">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          Math.abs(calculateVariance()) > 10 
                            ? 'bg-red-400' 
                            : Math.abs(calculateVariance()) > 5 
                            ? 'bg-yellow-400' 
                            : 'bg-green-400'
                        }`}
                        style={{ 
                          width: `${Math.min(Math.abs(calculateVariance()), 20) * 5}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-neutral-500 w-12 text-right">
                      {Math.abs(calculateVariance()) > 10 ? 'High' : Math.abs(calculateVariance()) > 5 ? 'Med' : 'Low'}
                    </span>
                  </div>

                  {/* Variance Impact */}
                  {Math.abs(calculateVariance()) > 0 && (
                    <div className="mt-2 text-xs text-neutral-400">
                      <span>Impact: </span>
                      <span className={Math.abs(calculateVariance()) > 5 ? 'text-yellow-300' : 'text-green-300'}>
                        {calculateVariance() > 0 ? '+' : ''}
                        {((parseFloat(convertData.actualOutput) - convertData.expectedOutput)).toFixed(2)} units
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Variance Reasons */}
              {Math.abs(calculateVariance()) > 3 && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Variance Reasons (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {varianceReasons.map(reason => (
                      <button
                        key={reason.code}
                        onClick={() => toggleVarianceReason(reason.code)}
                        className={`p-2 text-xs rounded border smooth-hover ${
                          convertData.varianceReasons.includes(reason.code)
                            ? 'bg-blue-900/30 border-blue-500/50 text-blue-300'
                            : 'bg-neutral-800 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium">{reason.name}</div>
                        <div className="text-xs opacity-60 mt-1">{reason.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Notes (Optional)</label>
            <Input
              value={convertData.notes}
              onChange={(e) => setConvertData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={
                convertData.conversionStatus === 'yield_recording'
                  ? 'Add notes about the yield variance'
                  : 'Add notes about this conversion'
              }
            />
          </div>

          {/* Action Button */}
          <Button
            onClick={handleConvert}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              convertData.conversionStatus === 'yield_recording'
                ? 'Recording Yield...'
                : 'Converting...'
            ) : (
              convertData.conversionStatus === 'yield_recording'
                ? 'Complete Conversion'
                : 'Start Conversion'
            )}
          </Button>

          {/* Cancel Button for Yield Recording */}
          {convertData.conversionStatus === 'yield_recording' && (
            <Button
              onClick={resetConvertForm}
              variant="secondary"
              className="w-full"
            >
              Cancel Conversion
            </Button>
          )}
        </div>
      )}
    </div>
  );
}