const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cart' });
  }
});

// Add item to cart
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const { productId, unit, quantity } = req.body;

    if (!unit) {
      return res.status(400).json({ error: 'A weight/unit must be selected' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (!(product.variants || []).some(v => v.unit === unit)) {
      return res.status(400).json({ error: `This product is not available in ${unit}` });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId && item.unit === unit);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, unit, quantity });
    }

    await cart.save();
    cart = await cart.populate('items.product');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Error adding item to cart' });
  }
});

// Update cart item quantity
router.patch('/items/:productId', authenticateToken, async (req, res) => {
  try {
    const { quantity, unit } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find(item => item.product.toString() === req.params.productId && item.unit === unit);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await cart.populate('items.product');
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: 'Error updating cart item' });
  }
});

// Remove item from cart
router.delete('/items/:productId', authenticateToken, async (req, res) => {
  try {
    const { unit } = req.query;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => !(item.product.toString() === req.params.productId && item.unit === unit));
    await cart.save();

    const updatedCart = await cart.populate('items.product');
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: 'Error removing item from cart' });
  }
});

// Clear cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Error clearing cart' });
  }
});

module.exports = router; 