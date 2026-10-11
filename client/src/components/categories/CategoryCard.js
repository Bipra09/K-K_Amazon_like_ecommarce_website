import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CategoryCard = ({ category }) => {
  const { _id, name, slug, image, productCount, description } = category;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
    >
      <Link to={`/category/${slug}`} className="block">
        {/* Category Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={image || '/images/category-placeholder.jpg'}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Product Count */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-medium px-3 py-1 rounded-full">
            {productCount || 0} products
          </div>
        </div>

        {/* Category Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
