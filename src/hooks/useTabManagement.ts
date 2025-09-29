import { useState, useCallback } from 'react';
import { ViewState } from '../types';

export interface TabData {
  id: string;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
}

export function useTabManagement() {
  const [openTabs, setOpenTabs] = useState<Set<string>>(new Set());
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [minimizedTabs, setMinimizedTabs] = useState<Set<string>>(new Set());

  const generateTabsData = useCallback((viewState: ViewState): TabData[] => {
    const tabs: TabData[] = [];
    
    if (openTabs.has('products')) {
      tabs.push({
        id: 'products',
        title: 'Products',
        isActive: activeTabId === 'products',
        isMinimized: minimizedTabs.has('products'),
      });
    }
    
    if (openTabs.has('customers')) {
      tabs.push({
        id: 'customers',
        title: 'Customers',
        isActive: activeTabId === 'customers' && viewState.isCustomerViewOpen,
        isMinimized: minimizedTabs.has('customers'),
      });
    }
    
    if (openTabs.has('orders')) {
      tabs.push({
        id: 'orders',
        title: 'Orders',
        isActive: activeTabId === 'orders' && viewState.isOrdersViewOpen,
        isMinimized: minimizedTabs.has('orders'),
      });
    }
    
    if (openTabs.has('settings')) {
      tabs.push({
        id: 'settings',
        title: 'Settings',
        isActive: activeTabId === 'settings' && viewState.isSettingsOpen,
        isMinimized: minimizedTabs.has('settings'),
      });
    }
    
    if (openTabs.has('coa')) {
      tabs.push({
        id: 'coa',
        title: 'COA Manager',
        isActive: activeTabId === 'coa' && viewState.isCoaViewOpen,
        isMinimized: minimizedTabs.has('coa'),
      });
    }
    
    if (openTabs.has('media')) {
      tabs.push({
        id: 'media',
        title: 'Media Manager',
        isActive: activeTabId === 'media' && viewState.isMediaViewOpen,
        isMinimized: minimizedTabs.has('media'),
      });
    }
    
    if (openTabs.has('reports')) {
      tabs.push({
        id: 'reports',
        title: 'Reports',
        isActive: activeTabId === 'reports' && viewState.isReportsViewOpen,
        isMinimized: minimizedTabs.has('reports'),
      });
    }
    
    return tabs;
  }, [openTabs, activeTabId, minimizedTabs]);

  const handleTabClick = useCallback((tabId: string, setViewState: (fn: (prev: ViewState) => ViewState) => void) => {
    if (minimizedTabs.has(tabId)) {
      setMinimizedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabId);
        return newSet;
      });
    }
    
    setActiveTabId(tabId);
    
    switch (tabId) {
      case 'products':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'customers':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: true,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'orders':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: true,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'settings':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: true,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'coa':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: true,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'media':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: true,
          isReportsViewOpen: false
        }));
        break;
      case 'reports':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: true
        }));
        break;
    }
  }, [minimizedTabs]);

  const handleTabMinimize = useCallback((tabId: string, setViewState: (fn: (prev: ViewState) => ViewState) => void) => {
    const isCurrentlyMinimized = minimizedTabs.has(tabId);
    
    if (isCurrentlyMinimized) {
      setMinimizedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabId);
        return newSet;
      });
      handleTabClick(tabId, setViewState);
    } else {
      setMinimizedTabs(prev => new Set([...prev, tabId]));
      
      if (activeTabId === tabId) {
        const otherTabs = Array.from(openTabs).filter(id => id !== tabId && !minimizedTabs.has(id));
        if (otherTabs.length > 0) {
          handleTabClick(otherTabs[0], setViewState);
        } else {
          setActiveTabId('');
          setViewState(prev => ({ 
            ...prev, 
            isSettingsOpen: false,
            isCustomerViewOpen: false,
            showOverview: false,
            isOrdersViewOpen: false,
            isCoaViewOpen: false,
            isMediaViewOpen: false,
            isReportsViewOpen: false
          }));
        }
      }
    }
  }, [minimizedTabs, activeTabId, openTabs, handleTabClick]);

  const handleTabClose = useCallback((tabId: string, setViewState: (fn: (prev: ViewState) => ViewState) => void) => {
    const newOpenTabs = new Set(openTabs);
    newOpenTabs.delete(tabId);
    setOpenTabs(newOpenTabs);
    
    switch (tabId) {
      case 'settings':
        setViewState(prev => ({ ...prev, isSettingsOpen: false }));
        break;
      case 'customers':
        setViewState(prev => ({ ...prev, isCustomerViewOpen: false }));
        break;
      case 'orders':
        setViewState(prev => ({ ...prev, isOrdersViewOpen: false }));
        break;
      case 'coa':
        setViewState(prev => ({ ...prev, isCoaViewOpen: false }));
        break;
      case 'media':
        setViewState(prev => ({ ...prev, isMediaViewOpen: false }));
        break;
      case 'reports':
        setViewState(prev => ({ ...prev, isReportsViewOpen: false }));
        break;
      case 'products':
        setViewState(prev => ({ 
          ...prev, 
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
    }
    
    if (activeTabId === tabId || newOpenTabs.size === 0) {
      setActiveTabId('');
      setViewState(prev => ({ 
        ...prev, 
        isSettingsOpen: false,
        isCustomerViewOpen: false,
        showOverview: false,
        isOrdersViewOpen: false,
        isCoaViewOpen: false,
        isMediaViewOpen: false,
        isReportsViewOpen: false
      }));
    }
  }, [openTabs, activeTabId]);

  const openTab = useCallback((tabId: string, setViewState: (fn: (prev: ViewState) => ViewState) => void) => {
    setOpenTabs(prev => new Set([...prev, tabId]));
    setActiveTabId(tabId);
    
    switch (tabId) {
      case 'products':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'settings':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: true,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'customers':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: true,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'orders':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: true,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'coa':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: true,
          isMediaViewOpen: false,
          isReportsViewOpen: false
        }));
        break;
      case 'media':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: true,
          isReportsViewOpen: false
        }));
        break;
      case 'reports':
        setViewState(prev => ({ 
          ...prev, 
          isSettingsOpen: false,
          isCustomerViewOpen: false,
          showOverview: false,
          isOrdersViewOpen: false,
          isCoaViewOpen: false,
          isMediaViewOpen: false,
          isReportsViewOpen: true
        }));
        break;
    }
  }, []);

  const toggleTab = useCallback((tabId: string, setViewState: (fn: (prev: ViewState) => ViewState) => void) => {
    if (openTabs.has(tabId) && activeTabId === tabId) {
      handleTabClose(tabId, setViewState);
    } else {
      openTab(tabId, setViewState);
    }
  }, [openTabs, activeTabId, handleTabClose, openTab]);

  const showDashboard = openTabs.size === 0 || 
    (openTabs.size > 0 && Array.from(openTabs).every(tabId => minimizedTabs.has(tabId)));

  return {
    openTabs,
    activeTabId,
    minimizedTabs,
    showDashboard,
    generateTabsData,
    handleTabClick,
    handleTabMinimize,
    handleTabClose,
    openTab,
    toggleTab,
  };
}