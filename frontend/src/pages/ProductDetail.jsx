import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart, getVariantPrice, getVariantStock } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import { products as productsApi } from '../services/api';

// Cheapest price across a product's weight variants, for "From ₹x" display.
const getMinPrice = (product) => {
  const prices = (product?.variants || []).map((v) => v.price);
  return prices.length ? Math.min(...prices) : 0;
};

const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/');
const getImageUrl = (img) => {
  if (!img) return '/placeholder.png';
  if (img.startsWith('http')) return img;
  // Remove any leading slashes and ensure proper path construction
  return BACKEND_URL + img.replace(/^\/+/, '');
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getById(id);
        setProduct(response.data);
        setSelectedUnit((response.data.variants || [])[0]?.unit || null);
        setQuantity(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        setError('Failed to load product');
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const response = await productsApi.getByCategory(product.category);
        setRelatedProducts((response.data || []).filter((p) => p._id !== product._id));
      } catch (err) {
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };
    fetchRelated();
  }, [product?._id, product?.category]);

  const selectedStock = product ? getVariantStock(product, selectedUnit) : 0;
  const selectedPrice = product ? getVariantPrice(product, selectedUnit) : 0;

  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit);
    setQuantity(1);
  };

  const handleQuantityChange = (value) => {
    if (!product) return;

    const newValue = parseInt(value);
    if (isNaN(newValue)) {
      setQuantity(1);
      return;
    }

    const clampedValue = Math.max(1, Math.min(selectedStock || 1, newValue));
    setQuantity(clampedValue);
  };

  const handleIncrement = () => {
    if (!product) return;
    setQuantity(prev => Math.min(prev + 1, selectedStock || 1));
  };

  const handleDecrement = () => {
    if (!product) return;
    setQuantity(prev => Math.max(prev - 1, 1));
  };

  const handleAddToCart = async () => {
    if (!product || !selectedUnit) return;

    try {
      await addToCart(product, selectedUnit, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleSubscribe = () => {
    navigate('/subscriptions', {
      state: {
        product: {
          id: product._id,
          name: product.name,
          price: selectedPrice,
          image: product.images[0]
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{error || 'Product not found'}</h3>
          <p className="mt-1 text-sm text-gray-500">The product you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Thumbnails - Desktop View */}
              <div className="hidden lg:flex flex-col gap-2">
                { (product.images || []).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                      selectedImage === index 
                        ? 'ring-2 ring-primary-500' 
                        : 'ring-1 ring-gray-200'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 max-w-md mx-auto"
                >
                  <img
                    src={getImageUrl((product.images || [])[selectedImage])}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Left Navigation Button */}
                  {(product.images || []).length > 1 && (
                    <button
                      onClick={() => setSelectedImage(prev => 
                        prev === 0 ? (product.images || []).length - 1 : prev - 1
                      )}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Right Navigation Button */}
                  {(product.images || []).length > 1 && (
                    <button
                      onClick={() => setSelectedImage(prev => 
                        prev === (product.images || []).length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {product.discount > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      {product.discount}% OFF
                    </div>
                  )}
                </motion.div>

                {/* Thumbnails - Mobile View */}
                <div className="flex lg:hidden gap-2 overflow-x-auto mt-3 pb-2">
                  { (product.images || []).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                        selectedImage === index 
                          ? 'ring-2 ring-primary-500' 
                          : 'ring-1 ring-gray-200'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600">
                      ₹{selectedPrice}
                    </span>
                    {selectedUnit && <span className="text-sm text-gray-500">/{selectedUnit}</span>}
                  </div>
                  <div className="mt-1">
                    {product.discount > 0 ? (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{Math.round(selectedPrice * (1 + product.discount / 100))}
                        </span>
                        <span className="ml-2 text-sm text-green-600">
                          Save ₹{Math.round(selectedPrice * (product.discount / 100))}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Regular Price
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Weight selector */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                <div className="flex flex-wrap gap-2">
                  {(product.variants || []).map((variant) => (
                    <button
                      key={variant.unit}
                      type="button"
                      onClick={() => handleUnitSelect(variant.unit)}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedUnit === variant.unit
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      } ${variant.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {variant.unit}
                      {variant.stock === 0 && <span className="block text-[10px] text-red-500">Out of stock</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-600">
                  {showFullDescription ? (product.description || product.shortDescription) : (product.shortDescription || product.description)}
                  {(product.description && product.shortDescription && product.description !== product.shortDescription) && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </p>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <span className="text-sm text-gray-500">
                    Available: {selectedStock} {selectedUnit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDecrement}
                    disabled={!product || quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={selectedStock || 1}
                    value={quantity || 1}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-16 text-center border-2 border-gray-300 rounded-lg py-1 text-sm"
                  />
                  <button
                    onClick={handleIncrement}
                    disabled={!product || quantity >= selectedStock}
                    className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                {product.category === 'milk' ? (
                  <button
                    onClick={handleSubscribe}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-2 border-brand-gold-300 hover:border-brand-gold-400"
                  >
                    <span>Subscribe Now</span>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">Subscription Only</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedUnit || selectedStock === 0}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg border-2 border-brand-gold-300 hover:border-brand-gold-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                )}
              </div>
            </div>

            {/* Subscription Plans */}
            {product.subscriptionAvailable && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Subscription Plans</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  { (product.subscriptionPlans || []).map((plan, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-lg p-4 text-center hover:border-primary-500 transition-colors duration-200 cursor-pointer">
                      <span className="block text-lg font-medium text-gray-900">{plan.duration}</span>
                      <span className="block text-sm text-primary-600 mt-1">Save {plan.discount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* You may also like */}
        {(relatedLoading || relatedProducts.length > 0) && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">You may also like</h2>
            {relatedLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 md:gap-3">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/products/${relatedProduct._id}`)}
                  >
                    <div className="relative">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <img
                          src={getImageUrl(relatedProduct.images[0])}
                          alt={relatedProduct.name}
                          className="w-full h-16 md:h-28 object-cover hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-16 md:h-28 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-[9px] md:text-xs">No image</span>
                        </div>
                      )}
                      {relatedProduct.discount > 0 && (
                        <div className="absolute top-0.5 right-0.5 bg-red-500 text-white px-1 py-0.5 rounded text-[9px] md:text-xs font-medium">
                          {relatedProduct.discount}% OFF
                        </div>
                      )}
                    </div>

                    <div className="p-1.5 md:p-2">
                      <h3 className="text-[10px] md:text-sm font-semibold text-gray-800 line-clamp-1">{relatedProduct.name}</h3>
                      <p className="text-[9px] md:text-xs text-gray-600 mt-0.5 line-clamp-1">{relatedProduct.description}</p>

                      <div className="mt-1">
                        <span className="text-[10px] md:text-sm font-bold text-gray-900">From ₹{getMinPrice(relatedProduct)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;