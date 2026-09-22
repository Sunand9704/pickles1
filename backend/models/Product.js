const mongoose = require('mongoose');

const VALID_UNITS = ['100g', '250g', '500g', '1kg'];

const variantSchema = new mongoose.Schema({
  unit: {
    type: String,
    required: true,
    enum: VALID_UNITS
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Shop all', 'Non Veg pickles', 'Veg pickles', 'Snacks', 'Sweets', 'Masala podulu']
  },
  // Per-weight price & stock. A product must offer at least one weight,
  // and each weight may appear at most once (enforced in the controller).
  variants: {
    type: [variantSchema],
    required: true,
    validate: {
      validator: (variants) => Array.isArray(variants) && variants.length > 0,
      message: 'A product must have at least one weight variant'
    }
  },
  images: [{
    type: String,
    required: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isDiscountActive: {
    type: Boolean,
    default: false
  },
  discountStartDate: {
    type: Date
  },
  discountEndDate: {
    type: Date
  },
  offerPrice: {
    type: Number,
    min: 0
  },
  offerStartDate: {
    type: Date
  },
  offerEndDate: {
    type: Date
  },
  isOfferActive: {
    type: Boolean,
    default: false
  },
  expiryDays: {
    type: Number,
    default: 7
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
module.exports.VALID_UNITS = VALID_UNITS;