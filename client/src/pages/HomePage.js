import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowRight, 
  Star, 
  ShoppingCart, 
  Heart,
  Truck,
  Shield,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/products/ProductCard';
import CategoryCard from '../components/categories/CategoryCard';
import { productsAPI, categoriesAPI } from '../services/api';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Fetch featured products
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery(
    'featuredProducts',
    () => productsAPI.getFeatured(),
    { staleTime: 5 * 60 * 1000 }
  );

  // Fetch best sellers
  const { data: bestSellers, isLoading: bestSellersLoading } = useQuery(
    'bestSellers',
    () => productsAPI.getBestSellers(),
    { staleTime: 5 * 60 * 1000 }
  );

  // Fetch new arrivals
  const { data: newArrivals, isLoading: newArrivalsLoading } = useQuery(
    'newArrivals',
    () => productsAPI.getNewArrivals(),
    { staleTime: 5 * 60 * 1000 }
  );

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery(
    'categories',
    () => categoriesAPI.getAll(),
    { staleTime: 10 * 60 * 1000 }
  );

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

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: '30-day return policy'
    },
    {
      icon: CreditCard,
      title: 'Multiple Payment',
      description: 'Credit cards, PayPal & more'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>K&K - Your Premium Shopping Destination</title>
        <meta name="description" content="Discover amazing products at K&K. Shop the latest trends with free shipping, secure payments, and excellent customer service." />
        <meta name="keywords" content="ecommerce, shopping, online store, K&K, products, deals" />
      </Helmet>

      <div className="pt-16 lg:pt-20">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Welcome to{' '}
                  <span className="text-primary-600">K&K</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Discover amazing products at unbeatable prices. Shop the latest trends 
                  with confidence knowing you're getting quality and value.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  {!user && (
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-8 py-4 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors duration-200"
                    >
                      Create Account
                    </Link>
                  )}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative z-10">
                  <img
                    src="/images/hero-image.jpg"
                    alt="Shopping"
                    className="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-2xl"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary-200/20 to-transparent rounded-2xl"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our wide range of categories and find exactly what you're looking for
              </p>
            </motion.div>

            {categoriesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-32 rounded-lg mb-3"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {categories?.slice(0, 8).map((category) => (
                  <motion.div key={category._id} variants={itemVariants}>
                    <CategoryCard category={category} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                to="/categories"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                View All Categories
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Handpicked products that our customers love
              </p>
            </motion.div>

            {featuredLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {featuredProducts?.slice(0, 8).map((product) => (
                  <motion.div key={product._id} variants={itemVariants}>
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onWishlistToggle={handleWishlistToggle}
                      isInWishlist={isInWishlist(product._id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Best Sellers Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Best Sellers
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our most popular products that customers can't stop buying
              </p>
            </motion.div>

            {bestSellersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {bestSellers?.slice(0, 6).map((product) => (
                  <motion.div key={product._id} variants={itemVariants}>
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onWishlistToggle={handleWishlistToggle}
                      isInWishlist={isInWishlist(product._id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* New Arrivals Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                New Arrivals
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Be the first to discover our latest products
              </p>
            </motion.div>

            {newArrivalsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                    <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                    <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {newArrivals?.slice(0, 6).map((product) => (
                  <motion.div key={product._id} variants={itemVariants}>
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onWishlistToggle={handleWishlistToggle}
                      isInWishlist={isInWishlist(product._id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Ready to Start Shopping?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Join thousands of satisfied customers and discover amazing products today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg"
                >
                  Browse Products
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                {!user && (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-600 transition-colors duration-200"
                  >
                    Create Account
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
