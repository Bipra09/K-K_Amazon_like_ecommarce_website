import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onWishlistToggle, 
  isInWishlist,
  showActions = true 
}) => {
  const {
    _id,
    name,
    price,
    originalPrice,
    images,
    rating,
    reviewCount,
    discount,
    inStock
  } = product;

  const discountPercentage = originalPrice && price < originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (onWishlistToggle) {
      onWishlistToggle(product);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
    >
      <Link to={`/products/${_id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={images?.[0] || '/images/placeholder.jpg'}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
            }}
          />
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discountPercentage}%
            </div>
          )}
          
          {/* Stock Status */}
          {!inStock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Out of Stock
            </div>
          )}
          
          {/* Quick Actions */}
          {showActions && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add to Cart"
                >
                  <ShoppingCart className="w-5 h-5 text-primary-600" />
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-accent-50 transition-colors"
                  title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart 
                    className={`w-5 h-5 ${isInWishlist ? 'text-accent-500 fill-current' : 'text-gray-600'}`} 
                  />
                </button>
                <Link
                  to={`/products/${_id}`}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(rating || 0)
                      ? 'text-warning-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              ({reviewCount || 0})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${price?.toFixed(2)}
            </span>
            {originalPrice && price < originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
