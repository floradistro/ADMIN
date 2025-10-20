import React, { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  sku?: string;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface ProductSearchProps {
  value: string;
  onProductSelect: (product: Product | null) => void;
  placeholder?: string;
  className?: string;
  availableProducts?: Product[]; // Add available products prop for fallback
}

export function ProductSearch({ 
  value, 
  onProductSelect, 
  placeholder = "Search for product...",
  className = '',
  availableProducts = []
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Search for products (fallback to local search for now)
  const handleProductSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // Try API first
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const products = await response.json();
        setSearchResults(products);
        setShowResults(true);
      } else {
        // Fallback to local search through available products
        const filteredProducts = availableProducts.filter(product =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(filteredProducts.slice(0, 10));
        setShowResults(true);
      }
    } catch (error) {
      // Fallback to local search
      const filteredProducts = availableProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filteredProducts.slice(0, 10));
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleProductSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, availableProducts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onProductSelect(null); // Clear selection when typing
  };

  const handleProductClick = (product: Product) => {
    setSearchQuery(product.name);
    setSearchResults([]);
    setShowResults(false);
    onProductSelect(product);
  };

  const handleBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => {
          if (searchResults.length > 0) {
            setShowResults(true);
          }
        }}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 bg-neutral-950/40 border border-neutral-800/40 rounded text-neutral-400 placeholder-neutral-600 focus:border-neutral-700 focus:outline-none ${className}`}
      />
      
      {isSearching && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <svg className="w-4 h-4 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-950 border border-neutral-800/60 rounded-lg max-h-60 overflow-y-auto z-50 shadow-lg">
          {searchResults.map((product) => (
            <div
              key={product.id}
              className="px-3 py-2 hover:bg-neutral-900/50 cursor-pointer text-sm border-b border-neutral-800/30 last:border-b-0"
              onClick={() => handleProductClick(product)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-normal text-neutral-400 truncate">{product.name}</span>
                {product.categories && product.categories.length > 0 && (
                  <span className="text-neutral-600 text-xs bg-neutral-800/50 px-1.5 py-0.5 rounded flex-shrink-0">
                    {product.categories[0].name}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500">
                ID: {product.id} {product.sku && `• SKU: ${product.sku}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-950 border border-neutral-800/60 rounded-lg p-3 z-50 shadow-lg">
          <div className="text-sm text-neutral-500 text-center">
            No products found for &quot;{searchQuery}&quot;
          </div>
        </div>
      )}
    </div>
  );
}