const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { randomUUID } = require('node:crypto');
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


// Create an order and reserve its inventory in one transaction.
router.post('/', authenticateToken, [
  body('shippingAddress.street').isString().trim().notEmpty(),
  body('shippingAddress.city').isString().trim().notEmpty(),
  body('shippingAddress.state').isString().trim().notEmpty(),
  body('shippingAddress.zipCode').isString().trim().notEmpty(),
  body('shippingAddress.country').isString().trim().notEmpty(),
  body('paymentMethod').isIn(['stripe', 'paypal', 'cod']),
  body('notes').optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid checkout details' });

  const address = value => {
    const fields = ['street', 'city', 'state', 'zipCode', 'country'];
    if (!value || !fields.every(key => typeof value[key] === 'string' && value[key].trim().length > 0 && value[key].length <= 200)) {
      throw checkoutError(400, 'Enter a complete shipping and billing address');
    }
    return Object.fromEntries(fields.map(key => [key, value[key].trim()]));
  };

  try {
    const shippingAddress = address(req.body.shippingAddress);
    const billingAddress = address(req.body.billingAddress ?? req.body.shippingAddress);
    const order = await Order.db.transaction(async session => {
      const cart = await Cart.findOne({ user: req.user.id }).session(session);
      if (!cart?.items.length) throw checkoutError(400, 'Cart is empty');

      const items = [];
      for (const item of cart.items) {
        if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
          throw checkoutError(400, 'Invalid cart quantity');
        }
        const filter = { _id: item.product, isActive: true, stock: { $gte: item.quantity } };
        const inc = { stock: -item.quantity };
        const selected = item.selectedVariant;
        const variant = selected?.name && selected?.value
          ? { name: selected.name, value: selected.value } : null;
        if (variant) {
          filter.variants = { $elemMatch: { ...variant, stock: { $gte: item.quantity } } };
          inc['variants.$.stock'] = -item.quantity;
        }
        const product = await Product.findOneAndUpdate(filter, { $inc: inc }, { session });
        if (!product) throw checkoutError(409, 'An item in your cart is sold out or unavailable');
        const price = variant
          ? product.variants.find(v => v.name === variant.name && v.value === variant.value && v.stock >= item.quantity).price
          : product.price;
        items.push({ product: product._id, quantity: item.quantity, selectedVariant: variant ?? undefined,
          price, total: Math.round(price * item.quantity * 100) / 100 });
      }

      const subtotal = items.reduce((sum, item) => sum + Math.round(item.total * 100), 0) / 100;
      const cost = cart.shippingCost || 0;
      const coupon = cart.coupon;
      const discount = Math.min(subtotal, coupon?.discountType === 'percentage'
        ? subtotal * (coupon.discount || 0) / 100 : (coupon?.discount || 0));
      const savedOrder = new Order({
        orderNumber: 'KK-' + randomUUID(),
        user: req.user.id, items, subtotal, shipping: { cost }, discount,
        total: Math.round((subtotal + cost - discount) * 100) / 100,
        shippingAddress, billingAddress, paymentMethod: req.body.paymentMethod, notes: req.body.notes,
      });
      await savedOrder.save({ session });
      await Cart.updateOne({ _id: cart._id }, {
        $set: { items: [], lastUpdated: new Date() },
        $unset: { coupon: '', shippingAddress: '', shippingMethod: '' },
      }, { session });
      return savedOrder;
    });
    return res.status(201).json(order);
  } catch (error) {
    if (error.checkoutStatus) return res.status(error.checkoutStatus).json({ message: error.message });
    console.error('Checkout failed:', error.name, Object.keys(error.errors ?? {}));
    return res.status(500).json({ message: 'Order could not be placed' });
  }
});

function checkoutError(status, message) {
  return Object.assign(new Error(message), { checkoutStatus: status });
}


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
