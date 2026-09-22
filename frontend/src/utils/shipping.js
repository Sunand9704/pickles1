// Mirrors backend/utils/shipping.js for display purposes before checkout.
// The backend recomputes this independently and is the authoritative
// charge — this copy only drives what the customer sees in the cart.
export const FREE_SHIPPING_STATES = ['andhra pradesh', 'telangana'];
export const FREE_SHIPPING_THRESHOLD = 2000;
export const FLAT_SHIPPING_FEE = 40;

export const calculateShippingFee = (itemsTotal, state) => {
  const normalizedState = (state || '').trim().toLowerCase();
  const qualifiesByState = FREE_SHIPPING_STATES.includes(normalizedState);
  if (qualifiesByState && itemsTotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return FLAT_SHIPPING_FEE;
};
