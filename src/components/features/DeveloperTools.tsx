'use client';

import React, { useState, useCallback } from 'react';
import { Trash2, RefreshCw, Database, Terminal, Zap, Eye, Download } from 'lucide-react';
import { Button, LoadingSpinner } from '../ui';

interface DeveloperTool {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void> | void;
  dangerous?: boolean;
}

export function DeveloperTools() {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleToolClick = useCallback(async (tool: DeveloperTool) => {
    if (isProcessing) return;

    // Confirm dangerous actions
    if (tool.dangerous) {
      const confirmed = confirm(`Are you sure you want to ${tool.label.toLowerCase()}? This action cannot be undone.`);
      if (!confirmed) return;
    }

    setIsProcessing(tool.id);
    
    try {
      await tool.action();
    } catch (error) {
      console.error(`Error executing ${tool.label}:`, error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(null);
    }
  }, [isProcessing]);

  const clearCache = useCallback(async () => {
    // Clear browser cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reload the page
    window.location.reload();
  }, []);

  const clearLocalStorage = useCallback(() => {
    localStorage.clear();
    alert('Local storage cleared successfully');
  }, []);

  const clearSessionStorage = useCallback(() => {
    sessionStorage.clear();
    alert('Session storage cleared successfully');
  }, []);

  const downloadLogs = useCallback(() => {
    // Get console logs (if available)
    const logs = [];
    
    // Add some basic debug info
    logs.push(`=== Portal Admin Debug Info ===`);
    logs.push(`Timestamp: ${new Date().toISOString()}`);
    logs.push(`URL: ${window.location.href}`);
    logs.push(`User Agent: ${navigator.userAgent}`);
    logs.push(`Local Storage Items: ${localStorage.length}`);
    logs.push(`Session Storage Items: ${sessionStorage.length}`);
    logs.push(`=== End Debug Info ===`);
    
    const logContent = logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portal-debug-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const showEnvironmentInfo = useCallback(async () => {
    try {
      // Get server-side info
      const response = await fetch('/api/dev/info');
      const result = await response.json();
      
      if (result.success) {
        const serverInfo = result.data;
        const clientInfo = {
          'URL': window.location.href,
          'User Agent': navigator.userAgent,
          'Screen': `${window.screen.width}x${window.screen.height}`,
          'Viewport': `${window.innerWidth}x${window.innerHeight}`,
          'Local Storage': `${localStorage.length} items`,
          'Session Storage': `${sessionStorage.length} items`,
          'Cookies': document.cookie ? 'Present' : 'None',
          'Online': navigator.onLine ? 'Yes' : 'No'
        };
        
        const infoText = [
          '=== CLIENT INFO ===',
          ...Object.entries(clientInfo).map(([key, value]) => `${key}: ${value}`),
          '',
          '=== SERVER INFO ===',
          `Node Version: ${serverInfo.server.nodeVersion}`,
          `Platform: ${serverInfo.server.platform}`,
          `Architecture: ${serverInfo.server.arch}`,
          `Uptime: ${serverInfo.server.uptime}s`,
          `Memory Used: ${serverInfo.server.memory.used}MB`,
          `Memory Total: ${serverInfo.server.memory.total}MB`,
          '',
          '=== ENVIRONMENT ===',
          `Node Env: ${serverInfo.environment.nodeEnv}`,
          `Is Vercel: ${serverInfo.environment.isVercel}`,
          `Vercel URL: ${serverInfo.environment.vercelUrl || 'N/A'}`,
          `NextAuth URL: ${serverInfo.environment.nextauthUrl}`,
          `WP API URL: ${serverInfo.environment.wpApiUrl}`,
          `Remove.bg API: ${serverInfo.environment.removeBgApiKey}`,
          `Clipdrop API: ${serverInfo.environment.clipdropApiKey}`
        ].join('\n');
        
        alert(`System Information:\n\n${infoText}`);
      } else {
        throw new Error(result.error || 'Failed to get server info');
      }
    } catch (error) {
      console.error('Error getting system info:', error);
      
      // Fallback to client-only info
      const clientInfo = {
        'Environment': process.env.NODE_ENV || 'unknown',
        'URL': window.location.href,
        'User Agent': navigator.userAgent,
        'Screen': `${window.screen.width}x${window.screen.height}`,
        'Viewport': `${window.innerWidth}x${window.innerHeight}`,
        'Local Storage': `${localStorage.length} items`,
        'Session Storage': `${sessionStorage.length} items`,
        'Cookies': document.cookie ? 'Present' : 'None',
        'Online': navigator.onLine ? 'Yes' : 'No'
      };
      
      const infoText = Object.entries(clientInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      alert(`Client Information (Server info unavailable):\n\n${infoText}`);
    }
  }, []);

  const testAPIEndpoints = useCallback(async () => {
    const endpoints = [
      '/api/auth/session',
      '/api/flora/locations',
      '/api/flora/categories',
      '/api/media/library'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        results.push(`${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        results.push(`${endpoint}: ERROR - ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
    
    alert(`API Endpoint Test Results:\n\n${results.join('\n')}`);
  }, []);

  const forceSyncData = useCallback(async () => {
    try {
      // Trigger a data refresh
      window.location.reload();
    } catch (error) {
      console.error('Error forcing sync:', error);
      alert('Error forcing sync. Check console for details.');
    }
  }, []);

  const DEVELOPER_TOOLS: DeveloperTool[] = [
    {
      id: 'clear-cache',
      label: 'Clear All Cache',
      description: 'Clear browser cache, local storage, and reload',
      icon: <Trash2 className="w-4 h-4" />,
      action: clearCache,
      dangerous: true
    },
    {
      id: 'clear-localstorage',
      label: 'Clear Local Storage',
      description: 'Clear browser local storage only',
      icon: <Database className="w-4 h-4" />,
      action: clearLocalStorage
    },
    {
      id: 'clear-sessionstorage',
      label: 'Clear Session Storage',
      description: 'Clear browser session storage only',
      icon: <Database className="w-4 h-4" />,
      action: clearSessionStorage
    },
    {
      id: 'force-sync',
      label: 'Force Data Sync',
      description: 'Force refresh all data from server',
      icon: <RefreshCw className="w-4 h-4" />,
      action: forceSyncData
    },
    {
      id: 'test-apis',
      label: 'Test API Endpoints',
      description: 'Test connectivity to main API endpoints',
      icon: <Zap className="w-4 h-4" />,
      action: testAPIEndpoints
    },
    {
      id: 'environment-info',
      label: 'Environment Info',
      description: 'Show environment and browser information',
      icon: <Eye className="w-4 h-4" />,
      action: showEnvironmentInfo
    },
    {
      id: 'download-logs',
      label: 'Download Debug Logs',
      description: 'Download debug information as text file',
      icon: <Download className="w-4 h-4" />,
      action: downloadLogs
    }
  ];

  const getToolClasses = (dangerous?: boolean) => {
    if (dangerous) {
      return 'border-white/[0.08] bg-neutral-800/50 hover:bg-neutral-700/70 text-neutral-400 hover:text-neutral-300 hover:border-white/[0.12]';
    }
    return 'border-white/[0.08] bg-neutral-800/30 hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-300 hover:border-white/[0.12]';
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6 flex justify-center items-start">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-medium text-neutral-300">Developer Tools</h2>
          </div>
          <p className="text-sm text-neutral-500 ml-8">Development utilities and debugging tools</p>
        </div>

        {/* Tools List */}
        <div className="space-y-2">
          {DEVELOPER_TOOLS.map((tool) => (
            <div 
              key={tool.id}
              className={`group transition-all border rounded-lg ${getToolClasses(tool.dangerous)}`}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-neutral-400">
                    {isProcessing === tool.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      tool.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-neutral-300">{tool.label}</h3>
                      {tool.dangerous && (
                        <span className="text-xs text-neutral-500 bg-neutral-700/50 px-1.5 py-0.5 rounded">CAUTION</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{tool.description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleToolClick(tool)}
                  disabled={!!isProcessing}
                  variant="ghost"
                  size="sm"
                  className="ml-4 flex-shrink-0"
                >
                  {isProcessing === tool.id ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-xs">Processing...</span>
                    </div>
                  ) : (
                    <span className="text-xs">Execute</span>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-white/[0.08]">
          <div className="text-xs text-neutral-500">
            <p className="mb-3 text-neutral-400">Usage Notes</p>
            <div className="space-y-2">
              <p>• Environment Info shows system status and configuration</p>
              <p>• Test API Endpoints verifies connectivity to backend services</p>
              <p>• Download Debug Logs provides debug information for support</p>
              <p>• Cache clearing tools will reload the page automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
