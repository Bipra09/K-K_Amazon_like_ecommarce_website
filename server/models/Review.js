const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [{
    url: String,
    alt: String
  }],
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  verified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reported: {
    count: {
      type: Number,
      default: 0
    },
    reasons: [String],
    reportedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Virtual for review summary
reviewSchema.virtual('reviewSummary').get(function() {
  return {
    rating: this.rating,
    title: this.title,
    comment: this.comment.substring(0, 100) + (this.comment.length > 100 ? '...' : ''),
    helpfulCount: this.helpful.count,
    verified: this.verified,
    createdAt: this.createdAt
  };
});

// Indexes
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ 'helpful.count': -1 });
reviewSchema.index({ isActive: 1 });

// Pre-save middleware to verify purchase
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.order) {
    const Order = mongoose.model('Order');
    const order = await Order.findById(this.order);
    if (order && order.user.toString() === this.user.toString()) {
      this.verified = true;
    }
  }
  next();
});

// Method to mark review as helpful
reviewSchema.methods.markHelpful = function(userId) {
  const userIndex = this.helpful.users.indexOf(userId);

  if (userIndex === -1) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
  } else {
    this.helpful.users.splice(userIndex, 1);
    this.helpful.count -= 1;
  }

  return 'Review marked as helpful';
};

// Method to report review
reviewSchema.methods.reportReview = function(userId, reason) {
  const existingReport = this.reported.reportedBy.find(
    report => report.user.toString() === userId.toString()
  );

  if (!existingReport) {
    this.reported.reportedBy.push({
      user: userId,
      reason,
      reportedAt: new Date()
    });
    this.reported.count += 1;
    this.reported.reasons.push(reason);
  }

  return this.save();
};

// Method to deactivate review
reviewSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Static method to find reviews by product
reviewSchema.statics.findByProduct = function(productId, options = {}) {
  const query = {
    product: productId,
    isActive: true
  };

  if (options.rating) query.rating = options.rating;

  return this.find(query)
    .populate('user', 'firstName lastName avatar')
    .sort(options.sortBy === 'helpful' ? { 'helpful.count': -1 } : { createdAt: -1 })
    .limit(options.limit || 10)
    .skip(options.skip || 0);
};

// Static method to find reviews by user
reviewSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.isActive !== undefined) query.isActive = options.isActive;

  return this.find(query)
    .populate('product', 'name images price')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to get review statistics for a product
reviewSchema.statics.getProductReviewStats = function(productId) {
  return this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isActive: true } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        },
        verifiedReviews: {
          $sum: { $cond: ['$verified', 1, 0] }
        }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        verifiedReviews: 1,
        ratingDistribution: {
          '1': { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } },
          '2': { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          '3': { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          '4': { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          '5': { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } }
        }
      }
    }
  ]);
};

// Static method to check if user can review product
reviewSchema.statics.canUserReview = async function(userId, productId) {
  const existingReview = await this.findOne({ user: userId, product: productId });
  if (existingReview) return false;

  const Order = mongoose.model('Order');
  const hasOrdered = await Order.exists({
    user: userId,
    'items.product': productId,
    status: { $in: ['delivered', 'shipped'] }
  });

  return !!hasOrdered;
};

module.exports = mongoose.model('Review', reviewSchema);