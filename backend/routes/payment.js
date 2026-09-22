const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const Order = require('../models/Order');
const { createOrder } = require('../controllers/orderController');
const { calculateShippingFee } = require('../utils/shipping');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      payment_capture: 1
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order' });
  }
});

// Verify payment
router.post('/verify-payment', authenticateToken, async (req, res) => {
  console.log("request body", req.body);
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = req.body;

    // createOrder(orderData);
    console.log('Verifying payment with data:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('Generated signature:', expectedSignature);
    console.log('Received signature:', razorpay_signature);

    const isAuthentic = expectedSignature === razorpay_signature;
    console.log("isAuthentic", isAuthentic)

    if (isAuthentic) {
      console.log("inside if before order creation")
      console.log("order data", orderData)

      // Shipping is computed server-side, same rule as the COD path — never
      // trust orderData.totalAmount, which is only what the client displayed.
      const itemsTotal = orderData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      const shippingFee = orderData.items.length === 0 ? 0 : calculateShippingFee(itemsTotal, orderData.address?.state);

      // Create order in database
      const order = new Order({
        user: req.user.id,
        items: orderData.items.map(item => ({
          product: item.product._id || item.product,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price
        })),
        shippingFee,
        totalAmount: itemsTotal + shippingFee,
        address: orderData.address,
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: 'confirmed',
        paymentStatus: 'Paid'
      });

      await order.save();

      res.json({
        success: true,
        order: order
      });
    } else {
      console.error('Signature verification failed');
      res.status(400).json({ 
        error: 'Invalid payment signature',
        details: {
          expected: expectedSignature,
          received: razorpay_signature
        }
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Error verifying payment',
      details: error.message 
    });
  }
});

module.exports = router; 