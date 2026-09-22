const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Which weight variant of the product this line is for. Together with
  // `product`, this is the uniqueness key for a cart line — the same
  // product in two different weights is two separate lines.
  unit: {
    type: String,
    required: true,
    enum: ['100g', '250g', '500g', '1kg']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total price of cart
cartSchema.methods.calculateTotal = async function() {
  await this.populate('items.product');
  return this.items.reduce((total, item) => {
    const variant = (item.product.variants || []).find(v => v.unit === item.unit);
    return total + ((variant ? variant.price : 0) * item.quantity);
  }, 0);
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 