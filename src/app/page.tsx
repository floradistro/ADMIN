'use client';

import React from 'react';
import { AppProvider, FilterProvider, ProductProvider } from '../contexts';
import { ProtectedRoute } from '../components/auth';
import { FieldsProvider } from '../contexts/FieldsContext';
import { AppContent } from './AppContentV2';

export default function Home() {
  return (
    <ProtectedRoute>
      <AppProvider>
        <FilterProvider>
          <FieldsProvider>
            <ProductProvider>
              <AppContent />
            </ProductProvider>
          </FieldsProvider>
        </FilterProvider>
      </AppProvider>
    </ProtectedRoute>
  );
}