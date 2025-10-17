import React, { useState } from 'react';
import { useProductSettings } from '../../../hooks/useProductSettings';
import { GeneralSettings } from './GeneralSettings';
import { CategoryManagement } from './CategoryManagement';

import { IconButton } from '../../ui';

import { ProductGridTab } from '../../../app/modules/products/useProducts';

interface ProductSettingsProps {
  onClose?: () => void;
  activeTab?: ProductGridTab;
  onTabChange?: (tab: ProductGridTab) => void;
}

export function ProductSettings({ onClose, activeTab = 'general', onTabChange }: ProductSettingsProps) {

  const {
    settings,
    isLoading,
    updateDisplaySettings,
    updateInventorySettings,
    updateCategoryFilterSettings,
  } = useProductSettings();

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto scrollable-container p-2">
        <div className="p-8 text-center">
          <div className="text-neutral-400">Loading settings...</div>
        </div>
      </div>
    );
  }

  // Render content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            displaySettings={settings.display}
            inventorySettings={settings.inventory}
            onDisplaySettingsChange={updateDisplaySettings}
            onInventorySettingsChange={updateInventorySettings}
          />
        );
      case 'categories':
        return (
          <CategoryManagement
            categoryFilterSettings={settings.categoryFilters}
            onCategoryFilterSettingsChange={updateCategoryFilterSettings}
          />
        );
      case 'blueprints':
        return <div className="p-4 text-neutral-500">Blueprint Designer - Coming Soon</div>;
      case 'fields':
        return <div className="p-4 text-neutral-500">Fields Manager - See Fields tab in Settings</div>;
      case 'pricing':
        return <div className="p-4 text-neutral-500">Pricing Rules - Coming Soon</div>;
      case 'recipes':
        return <div className="p-4 text-neutral-500">Recipe Settings - Coming Soon</div>;

      default:
        return (
          <GeneralSettings
            displaySettings={settings.display}
            inventorySettings={settings.inventory}
            onDisplaySettingsChange={updateDisplaySettings}
            onInventorySettingsChange={updateInventorySettings}
          />
        );
    }
  };

  return (
            <div className="flex-1 overflow-y-auto scrollable-container bg-neutral-900 pt-12">
      <div className="p-2 h-full">
        <div className="h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}