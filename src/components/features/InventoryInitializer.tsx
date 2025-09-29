'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { autoInventoryInitializer } from '../../services/auto-inventory-initializer';

interface InventoryInitializerProps {
  productId: number;
  productName: string;
  onSuccess?: () => void;
  className?: string;
}

export function InventoryInitializer({ 
  productId, 
  productName, 
  onSuccess,
  className = '' 
}: InventoryInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    initialized_locations?: number[];
    errors?: string[];
  } | null>(null);

  const handleInitialize = async () => {
    setIsInitializing(true);
    setResult(null);

    try {
      
      const initResult = await autoInventoryInitializer.initializeInventoryForProduct(productId, 0);
      
      setResult(initResult);
      
      if (initResult.success && onSuccess) {
        // Wait a moment then trigger success callback
        setTimeout(onSuccess, 1000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const status = await autoInventoryInitializer.checkInventoryStatus(productId);
      
      if (status.has_inventory) {
        setResult({
          success: true,
          message: `Product has complete inventory at all ${status.total_locations} locations`
        });
      } else {
        setResult({
          success: false,
          message: `Product is missing inventory at ${status.missing_locations.length}/${status.total_locations} locations`
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to check inventory status'
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleInitialize}
          disabled={isInitializing}
          variant="secondary"
          size="sm"
          className="text-xs"
        >
          {isInitializing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
              Initializing...
            </>
          ) : (
            'Initialize Inventory'
          )}
        </Button>
        
        <Button
          onClick={handleCheckStatus}
          variant="ghost"
          size="sm"
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Check Status
        </Button>
      </div>

      {result && (
        <div className={`p-3 rounded-lg text-xs ${
          result.success 
            ? 'bg-green-900/20 border border-green-500/20 text-green-400' 
            : 'bg-red-900/20 border border-red-500/20 text-red-400'
        }`}>
          <div className="font-medium mb-1">
            {result.success ? '✅ Success' : '❌ Error'}
          </div>
          <div className="text-neutral-300">
            {result.message}
          </div>
          
          {result.initialized_locations && result.initialized_locations.length > 0 && (
            <div className="mt-2 text-neutral-400">
              Initialized at {result.initialized_locations.length} locations
            </div>
          )}
          
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2">
              <div className="text-neutral-400 mb-1">Errors:</div>
              <ul className="list-disc list-inside text-neutral-500 space-y-1">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs text-neutral-600">
        This will create inventory records with 0 quantity at all active locations for this product.
      </div>
    </div>
  );
}