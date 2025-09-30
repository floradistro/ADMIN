import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// Tab state type definitions
export interface TabState {
  id: string;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
  isPinned: boolean;
  order: number;
  lastAccessedAt: number;
  metadata?: Record<string, any>;
}

export interface TabManagerState {
  tabs: Map<string, TabState>;
  activeTabId: string | null;
  tabOrder: string[];
  history: string[];
}

interface UseTabManagementOptions {
  maxTabs?: number;
  persistState?: boolean;
  defaultTab?: string;
  onTabChange?: (tabId: string | null) => void;
  onTabClose?: (tabId: string) => void;
  onTabOpen?: (tabId: string) => void;
}

const DEFAULT_OPTIONS: UseTabManagementOptions = {
  maxTabs: 10,
  persistState: true,
  defaultTab: undefined,
};

// Local storage key for persisting tab state
const STORAGE_KEY = 'portal-admin-tabs-v3'; // Changed to clear old state

export function useTabManagementV2(options: UseTabManagementOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const historyRef = useRef<string[]>([]);
  
  // Initialize state - always start fresh for now
  const initializeState = (): TabManagerState => {
    // Always start with empty state to ensure chat interface shows
    return {
      tabs: new Map(),
      activeTabId: null,
      tabOrder: [],
      history: []
    };
  };

  const [state, setState] = useState<TabManagerState>(initializeState);

  // Persist state to localStorage
  useEffect(() => {
    if (opts.persistState && typeof window !== 'undefined') {
      try {
        const toSave = {
          ...state,
          tabs: Object.fromEntries(state.tabs)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Failed to save tab state:', error);
      }
    }
  }, [state, opts.persistState]);

  // Open a new tab or activate existing one
  const openTab = useCallback((id: string, title: string, metadata?: Record<string, any>) => {
    setState(prev => {
      const newTabs = new Map(prev.tabs);
      
      // If tab already exists, just activate it
      if (newTabs.has(id)) {
        const tab = newTabs.get(id)!;
        tab.isActive = true;
        tab.isMinimized = false;
        tab.lastAccessedAt = Date.now();
        
        // Update history
        const newHistory = [...prev.history.filter(h => h !== id), id];
        if (newHistory.length > 50) newHistory.shift(); // Keep history limited
        
        opts.onTabChange?.(id);
        
        return {
          ...prev,
          tabs: newTabs,
          activeTabId: id,
          history: newHistory
        };
      }
      
      // Check if we've reached max tabs
      if (newTabs.size >= (opts.maxTabs || 10)) {
        // Find and close the least recently used non-pinned tab
        let lruTab: TabState | null = null;
        newTabs.forEach(tab => {
          if (!tab.isPinned && (!lruTab || tab.lastAccessedAt < lruTab.lastAccessedAt)) {
            lruTab = tab;
          }
        });
        
        if (lruTab) {
          newTabs.delete((lruTab as TabState).id);
        } else {
          // All tabs are pinned, can't open new one
          return prev;
        }
      }
      
      // Create new tab
      const newTab: TabState = {
        id,
        title,
        isActive: true,
        isMinimized: false,
        isPinned: false,
        order: prev.tabOrder.length,
        lastAccessedAt: Date.now(),
        metadata
      };
      
      newTabs.set(id, newTab);
      
      // Update tab order
      const newTabOrder = [...prev.tabOrder, id];
      
      // Update history
      const newHistory = [...prev.history, id];
      if (newHistory.length > 50) newHistory.shift();
      
      opts.onTabOpen?.(id);
      opts.onTabChange?.(id);
      
      return {
        tabs: newTabs,
        activeTabId: id,
        tabOrder: newTabOrder,
        history: newHistory
      };
    });
  }, [opts]);

  // Close a tab
  const closeTab = useCallback((id: string) => {
    setState(prev => {
      if (!prev.tabs.has(id)) return prev;
      
      const newTabs = new Map(prev.tabs);
      const closedTab = newTabs.get(id);
      
      // Don't close pinned tabs unless forced
      if (closedTab?.isPinned) return prev;
      
      newTabs.delete(id);
      
      // Update tab order
      const newTabOrder = prev.tabOrder.filter(tabId => tabId !== id);
      
      // Update history
      const newHistory = prev.history.filter(tabId => tabId !== id);
      
      // Determine new active tab
      let newActiveTabId: string | null = null;
      
      if (prev.activeTabId === id) {
        // If closing the active tab, activate the most recent from history
        for (let i = newHistory.length - 1; i >= 0; i--) {
          if (newTabs.has(newHistory[i])) {
            newActiveTabId = newHistory[i];
            break;
          }
        }
        
        // If no history, activate the first available tab
        if (!newActiveTabId && newTabOrder.length > 0) {
          newActiveTabId = newTabOrder[0];
        }
      } else {
        newActiveTabId = prev.activeTabId;
      }
      
      // Update active status
      newTabs.forEach(tab => {
        tab.isActive = tab.id === newActiveTabId;
      });
      
      opts.onTabClose?.(id);
      if (newActiveTabId !== prev.activeTabId) {
        opts.onTabChange?.(newActiveTabId);
      }
      
      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
        tabOrder: newTabOrder,
        history: newHistory
      };
    });
  }, [opts]);

  // Activate a tab
  const activateTab = useCallback((id: string) => {
    setState(prev => {
      if (!prev.tabs.has(id) || prev.activeTabId === id) return prev;
      
      const newTabs = new Map(prev.tabs);
      
      // Update active status
      newTabs.forEach(tab => {
        tab.isActive = tab.id === id;
        if (tab.id === id) {
          tab.isMinimized = false;
          tab.lastAccessedAt = Date.now();
        }
      });
      
      // Update history
      const newHistory = [...prev.history.filter(h => h !== id), id];
      if (newHistory.length > 50) newHistory.shift();
      
      opts.onTabChange?.(id);
      
      return {
        ...prev,
        tabs: newTabs,
        activeTabId: id,
        history: newHistory
      };
    });
  }, [opts]);

  // Minimize/restore a tab
  const toggleMinimize = useCallback((id: string) => {
    setState(prev => {
      if (!prev.tabs.has(id)) return prev;
      
      const newTabs = new Map(prev.tabs);
      const tab = newTabs.get(id)!;
      tab.isMinimized = !tab.isMinimized;
      
      // If restoring a minimized tab, activate it
      if (!tab.isMinimized) {
        return {
          ...prev,
          tabs: newTabs,
          activeTabId: id
        };
      }
      
      // If minimizing the active tab, activate another
      if (prev.activeTabId === id) {
        const nextTab = prev.tabOrder.find(tabId => 
          tabId !== id && !newTabs.get(tabId)?.isMinimized
        );
        
        if (nextTab) {
          newTabs.forEach(t => {
            t.isActive = t.id === nextTab;
          });
          opts.onTabChange?.(nextTab);
          return {
            ...prev,
            tabs: newTabs,
            activeTabId: nextTab
          };
        }
      }
      
      return {
        ...prev,
        tabs: newTabs
      };
    });
  }, [opts]);

  // Pin/unpin a tab
  const togglePin = useCallback((id: string) => {
    setState(prev => {
      if (!prev.tabs.has(id)) return prev;
      
      const newTabs = new Map(prev.tabs);
      const tab = newTabs.get(id)!;
      tab.isPinned = !tab.isPinned;
      
      return {
        ...prev,
        tabs: newTabs
      };
    });
  }, []);

  // Reorder tabs
  const reorderTabs = useCallback((newOrder: string[]) => {
    setState(prev => {
      // Validate that all tab IDs exist
      const validOrder = newOrder.filter(id => prev.tabs.has(id));
      if (validOrder.length !== prev.tabOrder.length) {
        console.error('Invalid tab order');
        return prev;
      }
      
      // Update order property in each tab
      const newTabs = new Map(prev.tabs);
      validOrder.forEach((id, index) => {
        const tab = newTabs.get(id);
        if (tab) tab.order = index;
      });
      
      return {
        ...prev,
        tabs: newTabs,
        tabOrder: validOrder
      };
    });
  }, []);

  // Close all tabs except pinned ones
  const closeAllTabs = useCallback((exceptId?: string) => {
    setState(prev => {
      const newTabs = new Map<string, TabState>();
      const newTabOrder: string[] = [];
      
      prev.tabs.forEach(tab => {
        if (tab.isPinned || tab.id === exceptId) {
          newTabs.set(tab.id, tab);
          newTabOrder.push(tab.id);
        }
      });
      
      const newActiveTabId = exceptId || newTabOrder[0] || null;
      
      // Update active status
      newTabs.forEach(tab => {
        tab.isActive = tab.id === newActiveTabId;
      });
      
      opts.onTabChange?.(newActiveTabId);
      
      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
        tabOrder: newTabOrder,
        history: [newActiveTabId].filter(Boolean) as string[]
      };
    });
  }, [opts]);

  // Force close ALL tabs (including pinned ones)
  const forceCloseAllTabs = useCallback(() => {
    setState(prev => {
      opts.onTabChange?.(null);
      
      return {
        tabs: new Map(),
        activeTabId: null,
        tabOrder: [],
        history: []
      };
    });
  }, [opts]);

  // Get computed values
  const openTabsSet = useMemo(() => new Set(state.tabOrder), [state.tabOrder]);
  
  const visibleTabs = useMemo(() => 
    state.tabOrder
      .map(id => state.tabs.get(id))
      .filter((tab): tab is TabState => !!tab && !tab.isMinimized),
    [state.tabs, state.tabOrder]
  );
  
  const minimizedTabs = useMemo(() => 
    state.tabOrder
      .map(id => state.tabs.get(id))
      .filter((tab): tab is TabState => !!tab && tab.isMinimized),
    [state.tabs, state.tabOrder]
  );

  const pinnedTabs = useMemo(() => 
    state.tabOrder
      .map(id => state.tabs.get(id))
      .filter((tab): tab is TabState => !!tab && tab.isPinned),
    [state.tabs, state.tabOrder]
  );

  return {
    // State
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    tabOrder: state.tabOrder,
    openTabsSet,
    visibleTabs,
    minimizedTabs,
    pinnedTabs,
    
    // Actions
    openTab,
    closeTab,
    activateTab,
    toggleMinimize,
    togglePin,
    reorderTabs,
    closeAllTabs,
    forceCloseAllTabs,
    
    // Utilities
    hasTab: (id: string) => state.tabs.has(id),
    getTab: (id: string) => state.tabs.get(id),
    isActive: (id: string) => state.activeTabId === id,
    canClose: (id: string) => {
      const tab = state.tabs.get(id);
      return tab ? !tab.isPinned : false;
    },
  };
}
