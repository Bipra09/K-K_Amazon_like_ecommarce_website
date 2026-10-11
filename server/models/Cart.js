const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
  selectedVariant: {
    name: String,
    value: String,
    price: Number
  },
  price: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: {
      type: Number,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses'
  },
  shippingMethod: {
    name: String,
    cost: {
      type: Number,
      default: 0
    },
    estimatedDays: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for subtotal (before discount and shipping)
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    const itemPrice = item.selectedVariant ? item.selectedVariant.price : item.price;
    return total + (itemPrice * item.quantity);
  }, 0);
});

// Virtual for discount amount
cartSchema.virtual('discountAmount').get(function() {
  if (!this.coupon || !this.coupon.discount) return 0;
  
  if (this.coupon.discountType === 'percentage') {
    return (this.subtotal * this.coupon.discount) / 100;
  }
  return this.coupon.discount;
});

// Virtual for shipping cost
cartSchema.virtual('shippingCost').get(function() {
  return this.shippingMethod ? this.shippingMethod.cost : 0;
});

// Virtual for total amount
cartSchema.virtual('total').get(function() {
  return this.subtotal - this.discountAmount + this.shippingCost;
});

// Virtual for savings (if compare price exists)
cartSchema.virtual('savings').get(function() {
  return this.items.reduce((total, item) => {
    const product = item.product;
    if (product && product.comparePrice && product.comparePrice > item.price) {
      return total + ((product.comparePrice - item.price) * item.quantity);
    }
    return total;
  }, 0);
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });

// Pre-save middleware to update lastUpdated
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, variant = null) {
  const existingItem = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    (!variant || (item.selectedVariant && 
     item.selectedVariant.name === variant.name && 
     item.selectedVariant.value === variant.value))
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      selectedVariant: variant,
      price: variant ? variant.price : 0
    });
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      this.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }
    return this.save();
  }
  throw new Error('Item not found in cart');
};

// Method to remove item
cartSchema.methods.removeItem = function(itemId) {
  this.items.pull(itemId);
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.coupon = null;
  this.shippingAddress = null;
  this.shippingMethod = null;
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discount, discountType) {
  this.coupon = {
    code: couponCode,
    discount,
    discountType
  };
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
  this.coupon = null;
  return this.save();
};

// Method to set shipping method
cartSchema.methods.setShippingMethod = function(method) {
  this.shippingMethod = method;
  return this.save();
};

// Method to set shipping address
cartSchema.methods.setShippingAddress = function(addressId) {
  this.shippingAddress = addressId;
  return this.save();
};

// Static method to find cart by user
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name price comparePrice images stock isActive'
  });
};

// Static method to create or get cart for user
cartSchema.statics.getOrCreateCart = function(userId) {
  return this.findOne({ user: userId }).then(cart => {
    if (cart) return cart;
    return this.create({ user: userId, items: [] });
  });
};

module.exports = mongoose.model('Cart', cartSchema);
