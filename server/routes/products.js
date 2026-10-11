const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isIn(['price', '-price', 'rating', '-rating', 'createdAt', '-createdAt', 'sales', '-sales']).withMessage('Invalid sort parameter'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('brand').optional().isString().withMessage('Brand must be a string'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  query('inStock').optional().isBoolean().withMessage('In stock must be a boolean'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      inStock,
      featured,
      search
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) query.category = category;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (rating) query['rating.average'] = { $gte: parseInt(rating) };
    if (inStock !== undefined) {
      if (inStock === 'true') query.stock = { $gt: 0 };
      else query.stock = { $lte: 0 };
    }
    if (featured !== undefined) query.isFeatured = featured === 'true';

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Product.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching products' 
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');

    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found' 
      });
    }

    if (!product.isActive) {
      return res.status(404).json({ 
        message: 'Product not available' 
      });
    }

    // Get reviews for this product
    const reviews = await Review.findByProduct(product._id, { limit: 5 });
    const reviewStats = await Review.getProductReviewStats(product._id);

    res.json({
      product,
      reviews,
      reviewStats: reviewStats[0] || null
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching product' 
    });
  }
});

// @route   GET /api/products/slug/:slug
// @desc    Get product by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug, 
      isActive: true 
    })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug');

    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found' 
      });
    }

    // Get reviews for this product
    const reviews = await Review.findByProduct(product._id, { limit: 5 });
    const reviewStats = await Review.getProductReviewStats(product._id);

    res.json({
      product,
      reviews,
      reviewStats: reviewStats[0] || null
    });

  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching product' 
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('name').trim().isLength({ min: 3 }).withMessage('Product name must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      shortDescription,
      category,
      subcategory,
      brand,
      price,
      comparePrice,
      costPrice,
      stock,
      variants,
      images,
      tags,
      specifications,
      features,
      dimensions,
      shipping,
      seo
    } = req.body;

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ 
        message: 'Category not found' 
      });
    }

    // Check if subcategory exists (if provided)
    if (subcategory) {
      const subcategoryExists = await Category.findById(subcategory);
      if (!subcategoryExists) {
        return res.status(400).json({ 
          message: 'Subcategory not found' 
        });
      }
    }

    // Create product
    const product = new Product({
      name,
      description,
      shortDescription,
      category,
      subcategory,
      brand,
      price,
      comparePrice,
      costPrice,
      stock,
      variants,
      images,
      tags,
      specifications,
      features,
      dimensions,
      shipping,
      seo
    });

    await product.save();

    // Update category product count
    await categoryExists.updateProductCount();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      message: 'Server error while creating product' 
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Admin only)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('name').optional().trim().isLength({ min: 3 }).withMessage('Product name must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found' 
      });
    }

    // Update product
    Object.assign(product, req.body);
    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      message: 'Server error while updating product' 
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Admin only)
router.delete('/:id', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found' 
      });
    }

    // Soft delete - mark as inactive
    product.isActive = false;
    await product.save();

    res.json({ 
      message: 'Product deleted successfully' 
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting product' 
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = await Product.findFeatured()
      .limit(parseInt(limit))
      .select('name price comparePrice images rating');

    res.json({ products });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching featured products' 
    });
  }
});

// @route   GET /api/products/best-sellers
// @desc    Get best selling products
// @access  Public
router.get('/best-sellers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = await Product.findBestSellers(parseInt(limit))
      .select('name price comparePrice images rating sales');

    res.json({ products });

  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching best sellers' 
    });
  }
});

// @route   GET /api/products/new-arrivals
// @desc    Get new arrival products
// @access  Public
router.get('/new-arrivals', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = await Product.find({ 
      isActive: true, 
      isNewArrival: true 
    })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('name price comparePrice images rating category');

    res.json({ products });

  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching new arrivals' 
    });
  }
});

// @route   GET /api/products/recommendations
// @desc    Get product recommendations for user
// @access  Private
router.get('/recommendations', [authenticateToken], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Simple recommendation based on user's purchase history
    // In a real app, this would use ML algorithms
    const Order = require('../models/Order');
    const userOrders = await Order.findByUser(req.user._id, { status: 'delivered' });
    
    let recommendations = [];
    
    if (userOrders.length > 0) {
      // Get categories from user's purchases
      const purchasedCategories = userOrders.reduce((categories, order) => {
        order.items.forEach(item => {
          if (item.product && item.product.category) {
            categories.add(item.product.category.toString());
          }
        });
        return categories;
      }, new Set());

      // Find products in similar categories
      recommendations = await Product.find({
        category: { $in: Array.from(purchasedCategories) },
        isActive: true,
        _id: { $nin: userOrders.flatMap(order => order.items.map(item => item.product)) }
      })
      .populate('category', 'name slug')
      .sort({ rating: -1, sales: -1 })
      .limit(parseInt(limit))
      .select('name price comparePrice images rating category');
    }

    // If no recommendations based on history, get featured products
    if (recommendations.length === 0) {
      recommendations = await Product.findFeatured()
        .limit(parseInt(limit))
        .select('name price comparePrice images rating');
    }

    res.json({ recommendations });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching recommendations' 
    });
  }
});

// @route   GET /api/products/category/:categoryId
// @desc    Get products by category
// @access  Public
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        message: 'Category not found' 
      });
    }

    // Get products in this category
    const query = { 
      category: categoryId, 
      isActive: true 
    };

    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Product.countDocuments(query);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      category,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching products by category' 
    });
  }
});

module.exports = router;
