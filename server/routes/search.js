const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Search products
router.get('/products', async (req, res) => {
  try {
    const { 
      q = '', 
      category = '', 
      brand = '', 
      minPrice = '', 
      maxPrice = '', 
      rating = '', 
      sort = 'relevance',
      page = 1, 
      limit = 20 
    } = req.query;

    // Build search query
    let query = { isActive: true };
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { brand: { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Build sort options
    let sortOption = {};
    switch (sort) {
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { sales: -1 };
        break;
      default: // relevance
        if (q) {
          // If there's a search query, prioritize text relevance
          sortOption = { 
            $text: { $score: { $meta: 'textScore' } },
            rating: -1 
          };
        } else {
          sortOption = { rating: -1, sales: -1 };
        }
    }

    // Execute search
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('category', 'name slug');

    const total = await Product.countDocuments(query);

    // Get facets for filtering
    const facets = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          brands: { $addToSet: '$brand' },
          categories: { $addToSet: '$category' },
          priceRange: {
            min: { $min: '$price' },
            max: { $max: '$price' }
          }
        }
      }
    ]);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      facets: facets[0] || { brands: [], categories: [], priceRange: { min: 0, max: 0 } }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search suggestions/autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get product name suggestions
    const productSuggestions = await Product.find({
      name: { $regex: q, $options: 'i' },
      isActive: true
    })
    .select('name slug')
    .limit(limit / 2);

    // Get category suggestions
    const categorySuggestions = await Category.find({
      name: { $regex: q, $options: 'i' },
      isActive: true
    })
    .select('name slug')
    .limit(limit / 2);

    // Get brand suggestions
    const brandSuggestions = await Product.distinct('brand', {
      brand: { $regex: q, $options: 'i' },
      isActive: true
    });

    const suggestions = [
      ...productSuggestions.map(p => ({ type: 'product', text: p.name, slug: p.slug })),
      ...categorySuggestions.map(c => ({ type: 'category', text: c.name, slug: c.slug })),
      ...brandSuggestions.slice(0, limit / 4).map(b => ({ type: 'brand', text: b, slug: b }))
    ];

    res.json({ suggestions: suggestions.slice(0, limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search categories
router.get('/categories', async (req, res) => {
  try {
    const { q = '' } = req.query;

    let query = { isActive: true };
    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    const categories = await Category.find(query)
      .select('name slug description image')
      .sort({ sortOrder: 1, name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

