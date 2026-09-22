// Single source of truth for the shipping-fee rule (server side — this is
// what actually gets charged; the frontend copy in src/utils/shipping.js
// mirrors it only for display before checkout).
const FREE_SHIPPING_STATES = ['andhra pradesh', 'telangana'];
const FREE_SHIPPING_THRESHOLD = 2000;
const FLAT_SHIPPING_FEE = 40;

function calculateShippingFee(itemsTotal, state) {
  const normalizedState = (state || '').trim().toLowerCase();
  const qualifiesByState = FREE_SHIPPING_STATES.includes(normalizedState);
  if (qualifiesByState && itemsTotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return FLAT_SHIPPING_FEE;
}

module.exports = {
  calculateShippingFee,
  FREE_SHIPPING_STATES,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_FEE
};
