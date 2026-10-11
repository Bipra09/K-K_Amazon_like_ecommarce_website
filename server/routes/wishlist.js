const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

// Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products.product');
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
      await wishlist.save();
    }
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add product to wishlist
router.post('/add', authenticateToken, [
  body('productId').isMongoId(),
  body('notes').optional().isString().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, notes } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
    }

    const result = wishlist.addProduct(productId, notes);
    await wishlist.save();

    if (result === 'Product already in wishlist') {
      return res.status(400).json({ message: result });
    }

    await wishlist.populate('products.product');
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove product from wishlist
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.removeProduct(req.params.productId);
    await wishlist.save();

    await wishlist.populate('products.product');
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product notes in wishlist
router.put('/update/:productId', authenticateToken, [
  body('notes').isString().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { notes } = req.body;
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.updateProductNotes(req.params.productId, notes);
    await wishlist.save();

    await wishlist.populate('products.product');
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Move product from wishlist to cart
router.post('/move-to-cart/:productId', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    const result = wishlist.moveToCart(req.params.productId);
    await wishlist.save();

    if (result === 'Product not found in wishlist') {
      return res.status(404).json({ message: result });
    }

    await wishlist.populate('products.product');
    res.json({ 
      message: 'Product moved to cart successfully',
      wishlist 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle wishlist privacy
router.put('/privacy', authenticateToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.isPublic = !wishlist.isPublic;
    await wishlist.save();

    res.json({ 
      message: `Wishlist is now ${wishlist.isPublic ? 'public' : 'private'}`,
      isPublic: wishlist.isPublic 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

