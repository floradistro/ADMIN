import React, { useState } from 'react';
import { Button, Card } from '../../ui';
import { PricingRules } from './PricingRules';
import { PricingMatrix } from './PricingMatrix';

interface PricingEngineProps {
  productId?: number;
}

type PricingView = 'rules' | 'matrix';

export function PricingEngine({ productId }: PricingEngineProps) {
  const [activeView, setActiveView] = useState<PricingView>('rules');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 mb-1">
            Pricing Engine
          </h1>
          <p className="text-sm text-neutral-400">
            Stage 4 — Configure pricing rules and view denormalized price matrices
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => setActiveView('rules')}
            className={`px-4 py-2 text-sm font-medium rounded-md smooth-hover ${
              activeView === 'rules'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
          >
            Pricing Rules
          </button>
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-4 py-2 text-sm font-medium rounded-md smooth-hover ${
              activeView === 'matrix'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
          >
            Price Matrix
          </button>
        </div>
      </div>

      {/* Stage 4 Overview */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">4</span>
            </div>
            <div>
              <h3 className="text-blue-400 font-medium mb-1">Pricing Engine Active</h3>
              <p className="text-sm text-neutral-300 mb-2">
                Define pricing rules (quantity breaks, customer tiers, channels, stores, time windows) 
                with simple formulas that automatically generate denormalized price matrices.
              </p>
              <div className="flex gap-4 text-xs text-neutral-400">
                <div>• Rules → Price Lists</div>
                <div>• Real-time Evaluation</div>
                <div>• API Endpoints Active</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      {activeView === 'rules' ? (
        <PricingRules productId={productId} />
      ) : (
        <PricingMatrix productId={productId} />
      )}

      {/* API Information */}
      <Card className="border-neutral-700/50">
        <div className="p-4">
          <h3 className="text-neutral-100 font-medium mb-3">API Endpoints</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-green-400 font-mono mb-1">GET /fd/v1/price/product/{'{id}'}</div>
              <div className="text-neutral-400">Get evaluated price with context</div>
            </div>
            <div>
              <div className="text-green-400 font-mono mb-1">GET /fd/v1/price/quote</div>
              <div className="text-neutral-400">Get multi-product price quote</div>
            </div>
            <div>
              <div className="text-blue-400 font-mono mb-1">POST /fd/v1/pricing-rules</div>
              <div className="text-neutral-400">Create new pricing rule</div>
            </div>
            <div>
              <div className="text-blue-400 font-mono mb-1">POST /fd/v1/price/regenerate</div>
              <div className="text-neutral-400">Regenerate price lists</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-700">
            <div className="text-xs text-neutral-500">
              Authentication: Consumer Key/Secret or API Key header
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}