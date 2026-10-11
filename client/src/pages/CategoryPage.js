import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { 
  Filter, 
  Grid, 
  List, 
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/products/ProductCard';
import { productsAPI, categoriesAPI } from '../services/api';
import toast from 'react-hot-toast';

const CategoryPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    priceRange: '',
    rating: '',
    inStock: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery(
    ['category', slug],
    () => categoriesAPI.getById(slug),
    { staleTime: 10 * 60 * 1000 }
  );

  // Fetch products in category
  const { data: productsData, isLoading: productsLoading, error } = useQuery(
    ['categoryProducts', slug, currentPage, sortBy, filters],
    () => productsAPI.getByCategory(slug, {
      page: currentPage,
      limit: 20,
      sort: sortBy,
      minPrice: filters.priceRange === 'under25' ? 0 : filters.priceRange === '25to50' ? 25 : filters.priceRange === '50to100' ? 50 : filters.priceRange === 'over100' ? 100 : 0,
      maxPrice: filters.priceRange === 'under25' ? 25 : filters.priceRange === '25to50' ? 50 : filters.priceRange === '50to100' ? 100 : filters.priceRange === 'over100' ? 9999 : 9999,
      rating: filters.rating,
      inStock: filters.inStock
    }),
    { 
      keepPreviousData: true,
      enabled: !!slug
    }
  );

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const totalProducts = productsData?.totalProducts || 0;

  // Handle add to cart
  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (product) => {
    try {
      if (isInWishlist(product._id)) {
        await removeFromWishlist(product._id);
        toast.success(`${product.name} removed from wishlist`);
      } else {
        await addToWishlist(product._id);
        toast.success(`${product.name} added to wishlist!`);
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  // Apply filters
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      priceRange: '',
      rating: '',
      inStock: false
    });
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ];

  const priceRanges = [
    { value: 'under25', label: 'Under $25' },
    { value: '25to50', label: '$25 - $50' },
    { value: '50to100', label: '$50 - $100' },
    { value: 'over100', label: 'Over $100' }
  ];

  const ratingOptions = [
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
    { value: '2', label: '2+ Stars' }
  ];

  if (categoryLoading) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-1/3 mb-4"></div>
            <div className="bg-gray-200 h-6 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h2>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/products"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} - K&K</title>
        <meta name="description" content={`Shop ${category.name} at K&K. Discover amazing products in this category with our advanced filtering and sorting options.`} />
      </Helmet>

      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary-600 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-gray-900">{category.name}</span>
          </nav>

          {/* Category Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                to="/products"
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-lg text-gray-600 mt-2 max-w-3xl">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            <p className="text-gray-600">
              {totalProducts} products in this category
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            {/* View Mode and Sort */}
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => applyFilters({ ...filters, priceRange: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Prices</option>
                    {priceRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => applyFilters({ ...filters, rating: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Any Rating</option>
                    {ratingOptions.map((rating) => (
                      <option key={rating.value} value={rating.value}>
                        {rating.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Filter */}
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => applyFilters({ ...filters, inStock: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                  </label>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All Filters
                </button>
                <div className="text-sm text-gray-500">
                  {products.length} products found
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Filter className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or browse other categories</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={clearFilters}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Clear Filters
                </button>
                <Link
                  to="/products"
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Browse All Products
                </Link>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    onWishlistToggle={handleWishlistToggle}
                    isInWishlist={isInWishlist(product._id)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 border rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return <span key={page} className="px-3 py-2">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
