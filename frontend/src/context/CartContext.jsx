import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import apiService from '../api/apiService';

const CartContext = createContext();

const GUEST_CART_KEY = 'guest_cart';

// Guest (logged-out) cart lives entirely in localStorage. Wrapped in
// try/catch since storage can throw or be unavailable (private windows,
// blocked site data, etc.) — a guest cart is a convenience, not something
// that should crash the app if it's unreachable.
const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const writeGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (_) {
    // ignore — guest cart just won't persist across reloads
  }
};

const makeLocalId = () => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

// Finds the matching variant for a product + unit, or null if that weight
// isn't (or is no longer) offered on this product — e.g. a cart line left
// over from before this product had weight options, or a weight the admin
// has since removed.
export const getVariant = (product, unit) => {
  return (product?.variants || []).find((v) => v.unit === unit) || null;
};

// Resolves the price for a product at a specific weight variant.
export const getVariantPrice = (product, unit) => {
  const variant = getVariant(product, unit);
  return variant ? variant.price : 0;
};

// Resolves the stock for a product at a specific weight variant.
export const getVariantStock = (product, unit) => {
  const variant = getVariant(product, unit);
  return variant ? variant.stock : 0;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load cart on initial load and when user changes. Logged out: read the
  // guest cart from localStorage. Logged in: merge any guest cart into the
  // server cart (the server already dedupes by product+unit), then fetch.
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) {
        setCart(readGuestCart());
        setLoading(false);
        setError(null);
        setInitialized(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const guestItems = readGuestCart();
        if (guestItems.length > 0) {
          const unmerged = [];
          for (const item of guestItems) {
            try {
              await apiService.post('/cart/items', {
                productId: item.product._id,
                unit: item.unit,
                quantity: item.quantity
              });
            } catch (mergeError) {
              console.error('Error merging guest cart item:', mergeError);
              unmerged.push(item);
            }
          }
          // Keep whatever failed to merge (e.g. a transient network error) so it isn't silently lost.
          writeGuestCart(unmerged);
        }

        const response = await apiService.get('/cart');
        if (response.data?.items) {
          setCart(response.data.items);
        } else {
          setCart([]);
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
        if (err.response?.status === 404) {
          // If cart not found, it's not an error - just empty cart
          setCart([]);
          setError(null);
        } else {
          setError('Failed to load cart');
          setCart([]);
        }
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchCart();
  }, [user]);

  const addToCart = async (product, unit, quantity) => {
    try {
      if (!product || !product._id) {
        throw new Error('Invalid product data');
      }

      if (!unit) {
        throw new Error('A weight/unit must be selected');
      }

      const addQuantity = quantity || product.quantity || 1;

      if (!user) {
        const guestItems = readGuestCart();
        const existing = guestItems.find(
          (item) => item.product._id === product._id && item.unit === unit
        );
        let updated;
        if (existing) {
          updated = guestItems.map((item) =>
            item._id === existing._id ? { ...item, quantity: item.quantity + addQuantity } : item
          );
        } else {
          updated = [...guestItems, { _id: makeLocalId(), product, unit, quantity: addQuantity }];
        }
        writeGuestCart(updated);
        setCart(updated);
        return;
      }

      const cartItem = {
        productId: product._id,
        unit,
        quantity: addQuantity
      };

      console.log('Adding to cart:', cartItem);
      const response = await apiService.post('/cart/items', cartItem);

      if (response.data?.items) {
        setCart(response.data.items);
        // toast.success('Added to cart successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.error || 'Failed to add to cart');
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      setError(null);

      // Find the cart item to get its product ID
      const cartItem = cart.find(item => item._id === itemId);
      if (!cartItem) {
        throw new Error('Item not found in cart');
      }

      if (!user) {
        const updated = readGuestCart().filter((item) => item._id !== itemId);
        writeGuestCart(updated);
        setCart(updated);
        toast.success('Item removed from cart');
        return;
      }

      const response = await apiService.delete(`/cart/items/${cartItem.product._id}?unit=${encodeURIComponent(cartItem.unit)}`);
      if (response.data?.items) {
        setCart(response.data.items);
        toast.success('Item removed from cart');
      } else {
        setCart([]);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
      // Refresh cart to ensure sync with server
      try {
        const response = await apiService.get('/cart');
        setCart(response.data?.items || []);
      } catch (refreshError) {
        console.error('Error refreshing cart:', refreshError);
        setCart([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (!itemId) {
        throw new Error('Cart item ID is required');
      }

      // Find the cart item to get its product ID
      const cartItem = cart.find(item => item._id === itemId);
      if (!cartItem) {
        throw new Error('Item not found in cart');
      }

      if (!user) {
        const updated = readGuestCart().map((item) =>
          item._id === itemId ? { ...item, quantity } : item
        );
        writeGuestCart(updated);
        setCart(updated);
        toast.success('Quantity updated successfully');
        return;
      }

      // Use the correct endpoint for updating cart item quantity
      const response = await apiService.patch(`/cart/items/${cartItem.product._id}`, {
        quantity,
        unit: cartItem.unit
      });

      if (response.data?.items) {
        setCart(response.data.items);
        toast.success('Quantity updated successfully');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error.response?.data?.error || 'Failed to update quantity');
      // Refresh cart to ensure sync with server
      try {
        const response = await apiService.get('/cart');
        setCart(response.data?.items || []);
      } catch (refreshError) {
        console.error('Error refreshing cart:', refreshError);
        setCart([]);
      }
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        writeGuestCart([]);
        setCart([]);
        return;
      }

      await apiService.delete('/cart');
      setCart([]);
      setError(null);
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
      // Refresh cart to ensure sync with server
      try {
        const response = await apiService.get('/cart');
        setCart(response.data?.items || []);
      } catch (refreshError) {
        console.error('Error refreshing cart:', refreshError);
        setCart([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      if (!item?.product || !item?.quantity) return total;
      return total + (getVariantPrice(item.product, item.unit) * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + (item?.quantity || 0), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        initialized,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext; 