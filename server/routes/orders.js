const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { authenticateToken, canAccessOrder } = require('../middleware/auth');

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, canAccessOrder, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'firstName lastName email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new order
router.post('/', authenticateToken, [
  body('shippingAddress').isObject(),
  body('billingAddress').isObject(),
  body('paymentMethod').isIn(['stripe', 'paypal', 'cod']),
  body('notes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create order from cart
    const orderData = {
      user: req.user.id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        selectedVariant: item.selectedVariant,
        price: item.price
      })),
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress,
      paymentMethod: req.body.paymentMethod,
      notes: req.body.notes,
      subtotal: cart.subtotal,
      shipping: cart.shippingCost,
      total: cart.total
    };

    const order = new Order(orderData);
    await order.save();

    // Clear cart after order creation
    cart.clearCart();
    await cart.save();

    await order.populate('items.product');
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, canAccessOrder, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

