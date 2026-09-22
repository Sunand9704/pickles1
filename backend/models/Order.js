const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
    },
    unit: {
      type: String,
      enum: ['100g', '250g', '500g', '1kg']
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  deliveryDate: {
    type: Date,
    // required: true
  },
  deliveryTime: {
    type: String,
    // required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentId: String,
  orderId: String,
  paymentMethod: {
    type: String,
    enum: ['Online', 'COD'],
    default: 'Online'
  },

  
  
  
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'failed'],
    default: 'Paid',
  },
  
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  }



}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema); 