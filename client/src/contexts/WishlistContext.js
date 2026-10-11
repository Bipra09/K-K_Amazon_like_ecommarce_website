import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState({ products: [] });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        setWishlist(parsedWishlist);
      } catch (error) {
        console.error('Error parsing saved wishlist:', error);
        localStorage.removeItem('wishlist');
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Load wishlist from server if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlistFromServer();
    }
  }, [isAuthenticated]);

  const loadWishlistFromServer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(response.data);
    } catch (error) {
      console.error('Error loading wishlist from server:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product, notes = '') => {
    try {
      if (isAuthenticated) {
        // Add to server wishlist
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/wishlist/add', {
          productId: product._id,
          notes
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWishlist(response.data);
        toast.success('Product added to wishlist!');
      } else {
        // Add to local wishlist
        const existingProduct = wishlist.products.find(
          item => item.product._id === product._id
        );

        if (existingProduct) {
          toast.error('Product already in wishlist');
          return;
        }

        const newProduct = {
          product,
          addedAt: new Date(),
          notes
        };

        const updatedWishlist = {
          ...wishlist,
          products: [...wishlist.products, newProduct]
        };
        setWishlist(updatedWishlist);
        toast.success('Product added to wishlist!');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add product to wishlist');
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      if (isAuthenticated) {
        // Remove from server wishlist
        const token = localStorage.getItem('token');
        const response = await axios.delete(`/api/wishlist/remove/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWishlist(response.data);
        toast.success('Product removed from wishlist');
      } else {
        // Remove from local wishlist
        const updatedProducts = wishlist.products.filter(
          item => item.product._id !== productId
        );
        const updatedWishlist = {
          ...wishlist,
          products: updatedProducts
        };
        setWishlist(updatedWishlist);
        toast.success('Product removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove product from wishlist');
    }
  };

  const updateProductNotes = async (productId, notes) => {
    try {
      if (isAuthenticated) {
        // Update server wishlist
        const token = localStorage.getItem('token');
        const response = await axios.put(`/api/wishlist/update/${productId}`, {
          notes
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWishlist(response.data);
        toast.success('Notes updated');
      } else {
        // Update local wishlist
        const updatedProducts = wishlist.products.map(item =>
          item.product._id === productId
            ? { ...item, notes }
            : item
        );
        const updatedWishlist = {
          ...wishlist,
          products: updatedProducts
        };
        setWishlist(updatedWishlist);
        toast.success('Notes updated');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to update notes');
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.products.some(item => item.product._id === productId);
  };

  const getWishlistCount = () => {
    return wishlist.products.length;
  };

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    updateProductNotes,
    isInWishlist,
    getWishlistCount,
    loadWishlistFromServer
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

