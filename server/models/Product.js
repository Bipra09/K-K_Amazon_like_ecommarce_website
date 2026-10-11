const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  }
});

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  alt: String,
  isPrimary: {
    type: Boolean,
    default: false
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  variants: [variantSchema],
  images: [imageSchema],
  tags: [String],
  specifications: [{
    name: String,
    value: String
  }],
  features: [String],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: {
      type: String,
      enum: ['cm', 'inch', 'kg', 'lb'],
      default: 'cm'
    }
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  sales: {
    count: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingClass: {
      type: String,
      enum: ['light', 'standard', 'heavy', 'fragile'],
      default: 'standard'
    }
  }
}, {
  timestamps: true
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Virtual for isInStock
productSchema.virtual('isInStock').get(function() {
  return this.stock > 0;
});

// Virtual for isLowStock
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold && this.stock > 0;
});

// Indexes for search and performance
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text',
  brand: 'text'
});

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ sales: -1 });
productSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  next();
});

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    this.stock = Math.max(0, this.stock - quantity);
  } else if (operation === 'increase') {
    this.stock += quantity;
  }
  return this.save();
};

// Method to update rating
productSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Static method to find featured products
productSchema.statics.findFeatured = function() {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  }).populate('category');
};

// Static method to find best sellers
productSchema.statics.findBestSellers = function(limit = 10) {
  return this.find({ 
    isActive: true 
  })
  .sort({ 'sales.count': -1 })
  .limit(limit)
  .populate('category');
};

module.exports = mongoose.model('Product', productSchema);
