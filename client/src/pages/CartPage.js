import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight,
  Heart,
  Truck,
  Shield,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get cartItems from cart.items with fallback to empty array
  const cartItems = cart?.items || [];

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(true);
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleMoveToWishlist = async (product) => {
    try {
      await addToWishlist(product._id);
      await removeFromCart(product._id);
      toast.success(`${product.name} moved to wishlist`);
    } catch (error) {
      toast.error('Failed to move item to wishlist');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  // Calculate totals - add safety check
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

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
    }
  ];

  if (cartItems.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart - K&K</title>
          <meta name="description" content="Your shopping cart is empty. Browse our products and add items to get started." />
        </Helmet>

        <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your cart is empty
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
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
        <title>Shopping Cart - K&K</title>
        <meta name="description" content="Review your shopping cart items and proceed to checkout with secure payment options." />
      </Helmet>

      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Shopping Cart
            </h1>
            <p className="text-lg text-gray-600">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Cart Items
                    </h2>
                    <button
                      onClick={handleClearCart}
                      className="text-sm text-error-600 hover:text-error-700 transition-colors"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6"
                      >
                        <div className="flex items-center space-x-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={item.images?.[0] || '/images/placeholder.jpg'}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                              }}
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {item.category?.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </p>
                                {item.originalPrice && item.price < item.originalPrice && (
                                  <p className="text-sm text-gray-500 line-through">
                                    ${(item.originalPrice * item.quantity).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isUpdating}
                                  className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center text-gray-900 font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                  disabled={isUpdating}
                                  className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleMoveToWishlist(item)}
                                  disabled={isInWishlist(item._id)}
                                  className="p-2 text-gray-400 hover:text-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Move to Wishlist"
                                >
                                  <Heart className={`w-4 h-4 ${isInWishlist(item._id) ? 'fill-current text-accent-500' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleRemoveItem(item._id)}
                                  className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  to="/checkout"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center block"
                >
                  Proceed to Checkout
                </Link>

                {/* Continue Shopping */}
                <Link
                  to="/products"
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center block mt-3"
                >
                  Continue Shopping
                </Link>

                {/* Features */}
                <div className="mt-8 space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{feature.title}</h4>
                        <p className="text-xs text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;
