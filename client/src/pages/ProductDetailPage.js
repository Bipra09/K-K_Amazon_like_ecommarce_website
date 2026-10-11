import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { productsAPI, reviewsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Fetch product details
  const { data: product, isLoading, error } = useQuery(
    ['product', id],
    () => productsAPI.getById(id),
    { staleTime: 5 * 60 * 1000 }
  );

  // Fetch related products
  const { data: relatedProducts } = useQuery(
    ['relatedProducts', id],
    () => productsAPI.getByCategory(product?.category?._id),
    { staleTime: 5 * 60 * 1000 }
  );

  // Fetch product reviews
  const { data: reviews } = useQuery(
    ['productReviews', id],
    () => reviewsAPI.getProductReviews(id),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded w-3/4"></div>
                <div className="bg-gray-200 h-6 rounded w-1/2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/products"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    price,
    originalPrice,
    images,
    rating,
    reviewCount,
    inStock,
    stockQuantity,
    category,
    brand,
    specifications,
    tags
  } = product;

  const discountPercentage = originalPrice && price < originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const isInWishlistState = isInWishlist(product._id);

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity);
      toast.success(`${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    try {
      if (isInWishlistState) {
        await removeFromWishlist(product._id);
        toast.success(`${name} removed from wishlist`);
      } else {
        await addToWishlist(product._id);
        toast.success(`${name} added to wishlist!`);
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= stockQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Next/Previous image
  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
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
    }
  ];

  return (
    <>
      <Helmet>
        <title>{name} - K&K</title>
        <meta name="description" content={description} />
      </Helmet>

      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary-600 transition-colors">Products</Link>
            {category && (
              <>
                <span>/</span>
                <Link to={`/category/${category.slug}`} className="hover:text-primary-600 transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900">{name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-soft">
                <img
                  src={images?.[selectedImage] || '/images/placeholder.jpg'}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                  }}
                />
                
                {/* Navigation Arrows */}
                {images && images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Images */}
              {images && images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === selectedImage
                          ? 'border-primary-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Product Header */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  {brand && (
                    <span className="text-sm text-gray-500">{brand}</span>
                  )}
                  {category && (
                    <>
                      <span className="text-gray-400">•</span>
                      <Link
                        to={`/category/${category.slug}`}
                        className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {category.name}
                      </Link>
                    </>
                  )}
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {name}
                </h1>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(rating || 0)
                            ? 'text-warning-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {rating?.toFixed(1) || '0.0'} ({reviewCount || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    ${price?.toFixed(2)}
                  </span>
                  {originalPrice && price < originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ${originalPrice.toFixed(2)}
                      </span>
                      <span className="bg-accent-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                        -{discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  inStock ? 'bg-success-500' : 'bg-error-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {inStock ? `${stockQuantity} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= stockQuantity}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                
                <button
                  onClick={handleWishlistToggle}
                  className={`flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold transition-colors ${
                    isInWishlistState
                      ? 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlistState ? 'fill-current' : ''}`} />
                  {isInWishlistState ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-200">
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

              {/* Share Button */}
              <button className="flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                <Share2 className="w-4 h-4" />
                Share Product
              </button>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-16">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'specifications', label: 'Specifications' },
                  { id: 'reviews', label: `Reviews (${reviewCount || 0})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="py-8">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{description}</p>
                </div>
              )}

              {activeTab === 'specifications' && specifications && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {reviews && reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {review.user?.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {review.user?.firstName} {review.user?.lastName}
                            </div>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-warning-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        <div className="text-sm text-gray-500 mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <div key={relatedProduct._id}>
                    {/* You can reuse ProductCard component here */}
                    <div className="bg-white rounded-lg shadow-soft p-4">
                      <img
                        src={relatedProduct.images?.[0]}
                        alt={relatedProduct.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-medium text-gray-900 mb-2">{relatedProduct.name}</h3>
                      <p className="text-primary-600 font-semibold">${relatedProduct.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
