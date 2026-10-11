import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Load cart from server if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCartFromServer();
    }
  }, [isAuthenticated]);

  const loadCartFromServer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error('Error loading cart from server:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1, selectedVariant = null) => {
    try {
      if (isAuthenticated) {
        // Add to server cart
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/cart/add', {
          productId: product._id,
          quantity,
          selectedVariant
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart(response.data);
        toast.success('Product added to cart!');
      } else {
        // Add to local cart
        const existingItemIndex = cart.items.findIndex(
          item => item.product._id === product._id && 
          item.selectedVariant === selectedVariant
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...cart.items];
          updatedItems[existingItemIndex].quantity += quantity;
          const updatedCart = {
            ...cart,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          };
          setCart(updatedCart);
        } else {
          const newItem = {
            product,
            quantity,
            selectedVariant,
            price: product.price
          };
          const updatedCart = {
            ...cart,
            items: [...cart.items, newItem],
            subtotal: cart.subtotal + (product.price * quantity)
          };
          setCart(updatedCart);
        }
        toast.success('Product added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (isAuthenticated) {
        // Update server cart
        const token = localStorage.getItem('token');
        const response = await axios.put(`/api/cart/update/${itemId}`, {
          quantity
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart(response.data);
      } else {
        // Update local cart
        const updatedItems = cart.items.map(item => 
          item.product._id === itemId 
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        );
        const updatedCart = {
          ...cart,
          items: updatedItems,
          subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      if (isAuthenticated) {
        // Remove from server cart
        const token = localStorage.getItem('token');
        const response = await axios.delete(`/api/cart/remove/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart(response.data);
        toast.success('Product removed from cart');
      } else {
        // Remove from local cart
        const updatedItems = cart.items.filter(item => item.product._id !== itemId);
        const updatedCart = {
          ...cart,
          items: updatedItems,
          subtotal: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        setCart(updatedCart);
        toast.success('Product removed from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove product from cart');
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        // Clear server cart
        const token = localStorage.getItem('token');
        await axios.delete('/api/cart/clear', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCart({ items: [], total: 0, subtotal: 0 });
      } else {
        // Clear local cart
        setCart({ items: [], total: 0, subtotal: 0 });
      }
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getCartItemCount = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.subtotal;
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
    loadCartFromServer
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

