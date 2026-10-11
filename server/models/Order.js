const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  selectedVariant: {
    name: String,
    value: String
  },
  total: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentIntentId: String,
    paymentMethod: String,
    last4: String,
    brand: String
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    cost: {
      type: Number,
      default: 0
    },
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    carrier: String
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses',
    required: true
  },
  billingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses'
  },
  notes: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  refundedAt: Date,
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  invoice: {
    number: String,
    url: String,
    generatedAt: Date
  }
}, {
  timestamps: true
});

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    total: this.total,
    itemCount: this.items.length,
    estimatedDelivery: this.estimatedDelivery
  };
});

// Virtual for isDelivered
orderSchema.virtual('isDelivered').get(function() {
  return this.status === 'delivered';
});

// Virtual for isCancelled
orderSchema.virtual('isCancelled').get(function() {
  return this.status === 'cancelled';
});

// Virtual for isRefunded
orderSchema.virtual('isRefunded').get(function() {
  return this.status === 'refunded';
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `KK${year}${month}${day}${random}`;
  }
  next();
});

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note,
    updatedBy
  });

  // Set specific timestamps based on status
  switch (newStatus) {
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
    case 'refunded':
      this.refundedAt = new Date();
      break;
  }

  return this.save();
};

// Method to update payment status
orderSchema.methods.updatePaymentStatus = function(newStatus, paymentDetails = {}) {
  this.paymentStatus = newStatus;
  if (paymentDetails.transactionId) {
    this.paymentDetails = { ...this.paymentDetails, ...paymentDetails };
  }
  return this.save();
};

// Method to add tracking information
orderSchema.methods.addTracking = function(trackingInfo) {
  this.shipping = { ...this.shipping, ...trackingInfo };
  return this.save();
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((total, item) => total + item.total, 0);
  this.total = this.subtotal + this.tax + this.shipping.cost - this.discount;
  return this.save();
};

// Static method to find by order number
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber }).populate([
    { path: 'user', select: 'firstName lastName email phone' },
    { path: 'items.product', select: 'name images price' },
    { path: 'shippingAddress' },
    { path: 'billingAddress' }
  ]);
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('items.product', 'name images price')
    .populate('shippingAddress');
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
