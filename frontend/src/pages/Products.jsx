import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { products as productsApi } from '../services/api';
import { mockProducts } from '../data/mockProducts';

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5012/')

// Helper function to get image URL
const getImageUrl = (img) => {
  if (!img) return '/placeholder.png';
  if (img.startsWith('http')) return img;
  // Ensure the path always starts with a slash before combining with BACKEND_URL
  const cleanImgPath = img.startsWith('/') ? img : `/${img}`;
  return BACKEND_URL + cleanImgPath.replace(/^\/+/, '');
};

// Cheapest price across a product's weight variants, for "From ₹x" display.
const getMinPrice = (product) => {
  const prices = (product?.variants || []).map((v) => v.price);
  return prices.length ? Math.min(...prices) : 0;
};

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedTags, setSelectedTags] = useState([]);

  const categories = [
    { id: 'all', name: 'All Products', icon: 'https://cdn-icons-png.flaticon.com/128/6785/6785304.png', description: 'Browse all our delicious pickles and other food items.'},
    { id: 'Non Veg pickles', name: 'Non Veg pickles', icon: '/images/Non-veg/Non-veg1.jpg', description: 'Discover our savory non-vegetarian pickles, made with high-quality meats and rich spices. A perfect accompaniment for a hearty meal.'},
    { id: 'Veg pickles', name: 'Veg pickles', icon: '/images/veg/veg1.jpg', description: 'Explore our wide range of authentic and delicious vegetarian pickles, crafted with traditional recipes and fresh ingredients. Perfect for adding a tangy kick to any meal!'},
    { id: 'Snacks', name: 'Snacks', icon: '/images/Hots/hot1.jpg', description: 'Tasty and crunchy snacks to complement your meals and tea time.'},
    { id: 'Sweets', name: 'Sweets', icon: '/images/Sweets/swt1.jpg', description: 'Indulge in our delightful selection of traditional Indian sweets, handcrafted to perfection for your festive and daily cravings.'},
    { id: 'Masala podulu', name: 'Masala podulu', icon: '/images/Ingredients/Ing1.webp', description: 'Enhance your cooking with our aromatic range of freshly ground spice powders.'}
  ];

  const allTags = [...new Set(products.flatMap(product => product.tags || []))];

  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      console.log(`🔍 Filtering product "${product.name}": category="${product.category}", selected="${selectedCategory}", matches=${matchesCategory}`);
      return matchesCategory;
    })
    .filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(product => getMinPrice(product) >= priceRange[0] && getMinPrice(product) <= priceRange[1])
    .filter(product => selectedTags.length === 0 || selectedTags.some(tag => (product.tags || []).includes(tag)))
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return getMinPrice(a) - getMinPrice(b);
        case 'price-high':
          return getMinPrice(b) - getMinPrice(a);
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b._id - a._id;
        default:
          return b.reviews - a.reviews;
      }
    });

  console.log('📊 Frontend: Total products:', products.length);
  console.log('📊 Frontend: Filtered products:', filteredProducts.length);
  console.log('📊 Frontend: Selected category:', selectedCategory);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let response;
        console.log('🔍 Frontend: Fetching products for category:', selectedCategory);
        
        if (selectedCategory === 'all') {
          response = await productsApi.getAll();
        } else {
          response = await productsApi.getByCategory(selectedCategory);
        }
        
        console.log('✅ Frontend: API Response:', response);
        console.log('📊 Frontend: Products received:', response.data.length);
        console.log('📋 Frontend: Product names:', response.data.map(p => p.name));
        
        setProducts(response.data);
      } catch (error) {
        console.error('❌ Frontend: Error fetching products:', error);
        console.error('❌ Frontend: Error details:', error.response?.data || error.message);
        setError('Failed to load products. Please try again later.');
        // Fallback to mock data if API fails
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const filterButton = document.getElementById('filter-button');
      if (showMobileFilters && sidebar && !sidebar.contains(event.target) && !filterButton.contains(event.target)) {
        setShowMobileFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileFilters]);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Search Bar */}
      <div className="bg-white border-b sticky top-14 z-20">
        <div className="max-w-7xl xl:max-w-none 2xl:max-w-none w-full mx-auto px-4 py-3">
          <div className="relative flex items-center mt-8 md:mt-0">
            <div className="relative w-full">
            <input
              type="text"
                placeholder="Search pickles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3.5 text-base rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
                  className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl xl:max-w-none 2xl:max-w-none w-full mx-2 py-2 md:px-4 md:py-4">
        <div className="flex gap-2 md:gap-4">
          {/* Categories Sidebar */}
          <div className="sticky top-32 z-8 w-20 md:w-28 bg-white rounded-lg shadow-md p-2">
            {/* Categories Section */}
            <div className="mb-4">
              <h3 className="text-xs md:text-sm font-semibold mb-2">Categories</h3>
              <div className="flex flex-col space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`flex flex-col items-center px-1 md:px-2 py-1.5 md:py-2 rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-600'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <img
                      src={category.icon}
                      alt={category.name}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full mb-1 object-cover"
                    />
                    <span className="text-[10px] md:text-xs whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Section */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs md:text-sm font-semibold mb-3">Price Range</h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer md:[&::-webkit-slider-thumb]:w-4 md:[&::-webkit-slider-thumb]:h-4 md:[&::-moz-range-thumb]:w-4 md:[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Min Price</label>
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-2 py-1 border rounded-md text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 md:py-1.5 md:text-sm"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Max Price</label>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-2 py-1 border rounded-md text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 md:py-1.5 md:text-sm"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : (
              <>
                {filteredProducts.length === 0 ? (
                  <div className="text-center text-gray-600">No products found in this category</div>
            ) : (
                  <div className={`grid ${viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]'
                    : 'grid-cols-1'} gap-3 md:gap-5`}>
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    {/* Product Image */}
                    <div className="relative">
                      {product.images && product.images.length > 0 ? (
                          <img
                            src={getImageUrl(product.images[0])}
                            alt={product.name}
                                className="w-full h-28 md:h-48 object-cover hover:opacity-90 transition-opacity"
                          />
                      ) : (
                            <div className="w-full h-28 md:h-48 bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-xs md:text-sm">No image</span>
                        </div>
                      )}
                      {product.discount > 0 && (
                            <div className="absolute top-0.5 right-0.5 bg-red-500 text-white px-1 py-0.5 rounded text-[9px] md:text-xs font-medium">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                        <div className="p-2 md:p-3">
                          <h3 className="text-xs md:text-base font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
                          <p className="text-[10px] md:text-sm text-gray-600 mt-0.5 line-clamp-2">{product.description}</p>

                      {/* Price */}
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs md:text-lg font-bold text-gray-900">From ₹{getMinPrice(product)}</span>
                            <span className="text-[10px] md:text-xs text-primary-600 font-medium">Select weight →</span>
                          </div>
                    </div>
                  </div>
                ))}
              </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products; 
