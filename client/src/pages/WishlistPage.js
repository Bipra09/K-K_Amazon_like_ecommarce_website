import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowRight,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/products/ProductCard';
import { wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { removeFromWishlist, clearWishlist } = useWishlist();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch wishlist items
  const { data: wishlistData, isLoading, error, refetch } = useQuery(
    'wishlist',
    () => wishlistAPI.getWishlist(),
    { staleTime: 5 * 60 * 1000 }
  );

  const wishlistItems = wishlistData?.items || [];

  // Handle add to cart
  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Item removed from wishlist');
      refetch();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  // Handle move all to cart
  const handleMoveAllToCart = async () => {
    if (wishlistItems.length === 0) return;
    
    setIsUpdating(true);
    try {
      for (const item of wishlistItems) {
        await addToCart(item._id, 1);
      }
      await clearWishlist();
      toast.success(`${wishlistItems.length} items moved to cart!`);
      refetch();
    } catch (error) {
      toast.error('Failed to move some items to cart');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle clear wishlist
  const handleClearWishlist = async () => {
    try {
      await clearWishlist();
      toast.success('Wishlist cleared');
      refetch();
    } catch (error) {
      toast.error('Failed to clear wishlist');
    }
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">Failed to load wishlist. Please try again later.</p>
          <button 
            onClick={() => refetch()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <>
        <Helmet>
          <title>My Wishlist - K&K</title>
          <meta name="description" content="Your wishlist is empty. Start adding products you love to save them for later." />
        </Helmet>

        <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your wishlist is empty
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Start adding products you love to your wishlist. They'll be saved here for you to review later.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Products
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Wishlist - K&K</title>
        <meta name="description" content="View and manage your wishlist items at K&K. Save products you love and add them to cart when you're ready to buy." />
      </Helmet>

      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              My Wishlist
            </h1>
            <p className="text-lg text-gray-600">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleMoveAllToCart}
              disabled={isUpdating || wishlistItems.length === 0}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <ShoppingCart className="w-5 h-5 mr-2" />
              )}
              Move All to Cart
            </button>
            
            <button
              onClick={handleClearWishlist}
              disabled={isUpdating || wishlistItems.length === 0}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Clear Wishlist
            </button>
          </div>

          {/* Wishlist Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlistItems.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative group"
                >
                  <ProductCard
                    product={item}
                    onAddToCart={handleAddToCart}
                    onWishlistToggle={() => handleRemoveFromWishlist(item._id)}
                    isInWishlist={true}
                    showActions={false}
                  />
                  
                  {/* Custom Actions for Wishlist */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-50 transition-colors"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-5 h-5 text-primary-600" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromWishlist(item._id)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl shadow-soft p-8 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to make your wishlist a reality?
              </h2>
              <p className="text-gray-600 mb-6">
                Add items to your cart and complete your purchase. Don't forget to check out our latest deals and new arrivals!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/cart"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View Cart
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WishlistPage;
