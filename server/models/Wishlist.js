const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    trim: true,
    default: 'My Wishlist'
  },
  description: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for product count
wishlistSchema.virtual('productCount').get(function() {
  return this.products.length;
});

// Virtual for total estimated value
wishlistSchema.virtual('totalValue').get(function() {
  return this.products.reduce((total, item) => {
    if (item.product && item.product.price) {
      return total + item.product.price;
    }
    return total;
  }, 0);
});

// Indexes
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'products.product': 1 });
wishlistSchema.index({ isPublic: 1 });

// Pre-save middleware to update lastUpdated
wishlistSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to add product to wishlist
wishlistSchema.methods.addProduct = function(productId, notes = '') {
  const existingProduct = this.products.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (!existingProduct) {
    this.products.push({
      product: productId,
      notes
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Method to update product notes
wishlistSchema.methods.updateProductNotes = function(productId, notes) {
  const product = this.products.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (product) {
    product.notes = notes;
    return this.save();
  }
  
  throw new Error('Product not found in wishlist');
};

// Method to move product to cart
wishlistSchema.methods.moveToCart = function(productId) {
  const product = this.products.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (product) {
    // Remove from wishlist
    this.removeProduct(productId);
    
    // Add to cart (this would need to be implemented in the cart service)
    return {
      removedFromWishlist: true,
      product: product.product
    };
  }
  
  throw new Error('Product not found in wishlist');
};

// Method to share wishlist
wishlistSchema.methods.share = function() {
  if (!this.isPublic) {
    this.isPublic = true;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to make wishlist private
wishlistSchema.methods.makePrivate = function() {
  this.isPublic = false;
  return this.save();
};

// Static method to find wishlist by user
wishlistSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId }).populate({
    path: 'products.product',
    select: 'name price comparePrice images stock isActive rating'
  });
};

// Static method to find public wishlists
wishlistSchema.statics.findPublic = function(options = {}) {
  const query = { isPublic: true };
  
  if (options.user) query.user = options.user;
  
  return this.find(query)
    .populate('user', 'firstName lastName avatar')
    .populate({
      path: 'products.product',
      select: 'name price comparePrice images stock isActive rating'
    })
    .sort({ lastUpdated: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to check if product is in user's wishlist
wishlistSchema.statics.isProductInWishlist = function(userId, productId) {
  return this.exists({
    user: userId,
    'products.product': productId
  });
};

// Static method to get wishlist statistics
wishlistSchema.statics.getWishlistStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalWishlists: { $sum: 1 },
        totalProducts: { $sum: { $size: '$products' } },
        publicWishlists: {
          $sum: { $cond: ['$isPublic', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to find products by popularity in wishlists
wishlistSchema.statics.getPopularWishlistProducts = function(limit = 10) {
  return this.aggregate([
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.product',
        wishlistCount: { $sum: 1 }
      }
    },
    { $sort: { wishlistCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        _id: 1,
        wishlistCount: 1,
        name: '$product.name',
        price: '$product.price',
        images: '$product.images',
        rating: '$product.rating'
      }
    }
  ]);
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
