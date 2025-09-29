import React from 'react';

interface DashboardViewProps {
  onOpenProducts: () => void;
  onOpenSettings: () => void;
  onOpenAudit: () => void;
}

export function DashboardView({ onOpenProducts, onOpenSettings, onOpenAudit }: DashboardViewProps) {
  return (
    <div className="flex-1 bg-neutral-900 flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Portal Dashboard</h1>
            <p className="text-neutral-400 text-lg">
              Welcome to your business management portal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Products Card */}
            <div 
              onClick={onOpenProducts}
              className="bg-neutral-900/40 rounded-lg p-6 hover:bg-neutral-800/60 smooth-hover cursor-pointer group border-b border-white/[0.02]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 smooth-hover">
                    Products
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    Manage inventory and product catalog
                  </p>
                </div>
              </div>
              <div className="text-neutral-400 text-sm">
                View and manage your product inventory, update stock levels, and organize your catalog.
              </div>
            </div>

            {/* Settings Card */}
            <div 
              onClick={onOpenSettings}
              className="bg-neutral-900/40 rounded-lg p-6 hover:bg-neutral-800/60 smooth-hover cursor-pointer group border-b border-white/[0.02]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-green-300 smooth-hover">
                    Settings
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    Configure system preferences
                  </p>
                </div>
              </div>
              <div className="text-neutral-400 text-sm">
                Manage display settings, categories, blueprints, pricing rules, and account preferences.
              </div>
            </div>

            {/* Audit History Card */}
            <div 
              onClick={onOpenAudit}
              className="bg-neutral-900/40 rounded-lg p-6 hover:bg-neutral-800/60 smooth-hover cursor-pointer group border-b border-white/[0.02]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-orange-300 smooth-hover">
                    Audit History
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    Track system changes and activity
                  </p>
                </div>
              </div>
              <div className="text-neutral-400 text-sm">
                Review detailed logs of all system activities, changes, and user actions.
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="text-neutral-500 text-sm">
              Click on any card above to open that view, or use the header navigation buttons.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}