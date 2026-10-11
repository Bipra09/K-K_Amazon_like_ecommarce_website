const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    
    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'helpful') sortOption = { 'helpful.count': -1 };

    const reviews = await Review.find({ 
      product: req.params.productId, 
      isActive: true 
    })
    .populate('user', 'firstName lastName avatar')
    .sort(sortOption)
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Review.countDocuments({ 
      product: req.params.productId, 
      isActive: true 
    });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a review
router.post('/', authenticateToken, [
  body('productId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').trim().isLength({ min: 5, max: 100 }),
  body('comment').trim().isLength({ min: 10, max: 1000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, rating, title, comment } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = new Review({
      user: req.user.id,
      product: productId,
      rating,
      title,
      comment
    });

    await review.save();

    // Update product rating
    await product.updateRating();

    await review.populate('user', 'firstName lastName avatar');
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a review
router.put('/:id', authenticateToken, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('comment').optional().trim().isLength({ min: 10, max: 1000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    Object.assign(review, req.body);
    await review.save();

    // Update product rating
    const product = await Product.findById(review.product);
    if (product) {
      await product.updateRating();
    }

    await review.populate('user', 'firstName lastName avatar');
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark review as helpful
router.post('/:id/helpful', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const result = review.markHelpful(req.user.id);
    await review.save();

    res.json({ message: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await review.remove();

    // Update product rating
    const product = await Product.findById(review.product);
    if (product) {
      await product.updateRating();
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

