import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { TabHero } from '../../ui/TabHero';
import { DisplaySettings, InventorySettings } from '../../../hooks/useProductSettings';

interface GeneralSettingsProps {
  displaySettings: DisplaySettings;
  inventorySettings: InventorySettings;
  onDisplaySettingsChange: (updates: Partial<DisplaySettings>) => void;
  onInventorySettingsChange: (updates: Partial<InventorySettings>) => void;
}

export function GeneralSettings({
  displaySettings,
  inventorySettings,
  onDisplaySettingsChange,
  onInventorySettingsChange
}: GeneralSettingsProps) {
  const { data: session } = useSession();

  const handleExport = () => {
    // TODO: Implement export functionality
  };

  const handleImport = () => {
    // TODO: Implement import functionality
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="p-4 bg-neutral-800/30 hover:bg-neutral-800/50 row-hover border-t border-white/[0.02] rounded h-full">
      <div className="space-y-6 h-full overflow-y-auto scrollable-container">
        {/* Hero Section */}
        <TabHero 
          title="General"
          description="Essential settings that define how your inventory appears and behaves. Perfect your workflow."
        />

        {/* Configuration Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Display Settings */}
        <div className="space-y-2">
          <div className="text-neutral-500 font-medium text-xs mb-2">
            Display Settings
          </div>
          
          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 hover:bg-neutral-800/50 transition-colors mb-2">
            <div className="text-neutral-500 text-xs mb-1">Default View Mode:</div>
            <select 
              value={displaySettings.viewMode}
              onChange={(e) => onDisplaySettingsChange({ 
                viewMode: e.target.value as 'grid' | 'table' 
              })}
              className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg border-b border-white/[0.02] text-neutral-300 focus:bg-neutral-800/50 focus:outline-none text-xs"
            >
              <option value="grid">Grid View</option>
              <option value="table">Table View</option>
            </select>
          </div>

          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 hover:bg-neutral-800/50 transition-colors mb-2">
            <div className="text-neutral-500 text-xs mb-1">Products Per Page:</div>
            <select 
              value={displaySettings.productsPerPage}
              onChange={(e) => onDisplaySettingsChange({ 
                productsPerPage: parseInt(e.target.value) as 20 | 50 | 100 
              })}
              className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg border-b border-white/[0.02] text-neutral-300 focus:bg-neutral-800/50 focus:outline-none text-xs"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 hover:bg-neutral-800/50 transition-colors mb-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-neutral-500 text-xs">Show Product Images:</div>
                <div className="text-neutral-500 text-xs">Display product thumbnails in listings</div>
              </div>
              <ToggleSwitch
                checked={displaySettings.showProductImages}
                onChange={(checked) => onDisplaySettingsChange({ showProductImages: checked })}
              />
            </div>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="space-y-2">
          <div className="text-neutral-500 font-medium text-xs mb-2">
            Inventory Settings
          </div>
          
          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 hover:bg-neutral-800/50 transition-colors mb-2">
            <div className="text-neutral-500 text-xs mb-1">Low Stock Threshold:</div>
            <input 
              type="number" 
              value={inventorySettings.lowStockThreshold}
              onChange={(e) => onInventorySettingsChange({ 
                lowStockThreshold: parseInt(e.target.value) || 0 
              })}
              className="w-full px-2 py-1 bg-neutral-900/40 rounded-lg border-b border-white/[0.02] text-neutral-300 focus:bg-neutral-800/50 focus:outline-none text-xs"
              placeholder="10"
            />
          </div>

          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 hover:bg-neutral-800/50 transition-colors mb-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-neutral-500 text-xs">Auto-refresh Inventory:</div>
                <div className="text-neutral-500 text-xs">Automatically refresh inventory data</div>
              </div>
              <ToggleSwitch
                checked={inventorySettings.autoRefreshInventory}
                onChange={(checked) => onInventorySettingsChange({ autoRefreshInventory: checked })}
              />
            </div>
          </div>

          <div className="rounded-lg border-b border-white/[0.02] p-2 bg-neutral-900/40 hover:bg-neutral-800/50 transition-colors mb-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-neutral-500 text-xs">Show Stock Levels:</div>
                <div className="text-neutral-500 text-xs">Display current stock quantities</div>
              </div>
              <ToggleSwitch
                checked={inventorySettings.showStockLevels}
                onChange={(checked) => onInventorySettingsChange({ showStockLevels: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="space-y-2">
        <div className="text-neutral-500 font-medium text-xs mb-2">
          Data Management
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-3 p-3 bg-neutral-900/40 hover:bg-neutral-800/50 border border-white/[0.04] rounded transition-colors"
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-left">
              <div className="text-xs font-medium text-white">Export Products</div>
              <div className="text-xs text-neutral-500">Download product data as CSV</div>
            </div>
          </button>

          <button 
            onClick={handleImport}
            className="flex items-center gap-3 p-3 bg-neutral-900/40 hover:bg-neutral-800/50 border border-white/[0.04] rounded transition-colors"
          >
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <div className="text-left">
              <div className="text-xs font-medium text-white">Import Products</div>
              <div className="text-xs text-neutral-500">Upload product data from CSV</div>
            </div>
          </button>
        </div>
      </div>

      {/* Account Section */}
      {session?.user && (
        <div className="space-y-2">
          <div className="text-neutral-500 font-medium text-xs mb-2">
            Account
          </div>
          
          <div className="bg-neutral-900/40 border border-white/[0.08] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-900/40 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-neutral-300 text-sm font-medium">
                    {session.user.username || session.user.name}
                  </div>
                  <div className="text-neutral-500 text-xs">
                    Logged in
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/30 border border-red-800/30 rounded text-red-400 hover:text-red-300 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Helper Components
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
    </label>
  );
}