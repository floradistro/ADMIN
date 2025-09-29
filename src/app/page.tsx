'use client';

import React from 'react';
import { AppProvider, FilterProvider, ProductProvider } from '../contexts';
import { ProtectedRoute } from '../components/auth';

import { AppContent } from './AppContentV2';

export default function Home() {
  return (
    <ProtectedRoute>
      <AppProvider>
        <FilterProvider>
          <ProductProvider>
            <AppContent />
          </ProductProvider>
        </FilterProvider>
      </AppProvider>
    </ProtectedRoute>
  );
}