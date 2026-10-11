const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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
  description: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  path: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  image: {
    url: String,
    alt: String
  },
  icon: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for full path name
categorySchema.virtual('fullPath').get(function() {
  if (this.path && this.path.length > 0) {
    return this.path.map(cat => cat.name).join(' > ') + ' > ' + this.name;
  }
  return this.name;
});

// Virtual for children count
categorySchema.virtual('childrenCount', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  count: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Pre-save middleware to generate slug and update level
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  if (this.isModified('parent')) {
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        this.level = parentCategory.level + 1;
        this.path = [...parentCategory.path, parentCategory._id];
      }
    } else {
      this.level = 0;
      this.path = [];
    }
  }

  next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = function() {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: 'parent',
        as: 'children'
      }
    },
    {
      $match: { parent: null }
    },
    {
      $sort: { sortOrder: 1, name: 1 }
    }
  ]);
};

// Static method to get breadcrumbs
categorySchema.statics.getBreadcrumbs = function(categoryId) {
  return this.findById(categoryId)
    .populate({
      path: 'path',
      select: 'name slug'
    })
    .then(category => {
      if (!category) return [];
      
      const breadcrumbs = category.path.map(cat => ({
        name: cat.name,
        slug: cat.slug
      }));
      
      breadcrumbs.push({
        name: category.name,
        slug: category.slug
      });
      
      return breadcrumbs;
    });
};

// Method to update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ 
    category: this._id, 
    isActive: true 
  });
  
  this.productCount = count;
  return this.save();
};

// Static method to find by slug
categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

module.exports = mongoose.model('Category', categorySchema);
