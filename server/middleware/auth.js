const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired. Please login again.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Internal server error during authentication.' 
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

// Middleware to check if user is admin or moderator
const requireAdminOrModerator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }

  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Insufficient privileges.' 
    });
  }

  next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({ 
        message: 'Resource user ID not provided.' 
      });
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own resources.' 
      });
    }

    next();
  };
};

// Middleware to check if user can access order
const canAccessOrder = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    const orderId = req.params.orderId || req.params.id;
    if (!orderId) {
      return res.status(400).json({ 
        message: 'Order ID not provided.' 
      });
    }

    const Order = require('../models/Order');
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found.' 
      });
    }

    // Admin can access any order
    if (req.user.role === 'admin') {
      req.order = order;
      return next();
    }

    // User can only access their own orders
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own orders.' 
      });
    }

    req.order = order;
    next();
  } catch (error) {
    console.error('Order access check error:', error);
    res.status(500).json({ 
      message: 'Internal server error during order access check.' 
    });
  }
};

// Middleware to check if user can access cart
const canAccessCart = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.' 
      });
    }

    const cartId = req.params.cartId || req.params.id;
    if (!cartId) {
      return res.status(400).json({ 
        message: 'Cart ID not provided.' 
      });
    }

    const Cart = require('../models/Cart');
    const cart = await Cart.findById(cartId);

    if (!cart) {
      return res.status(404).json({ 
        message: 'Cart not found.' 
      });
    }

    // Admin can access any cart
    if (req.user.role === 'admin') {
      req.cart = cart;
      return next();
    }

    // User can only access their own cart
    if (cart.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own cart.' 
      });
    }

    req.cart = cart;
    next();
  } catch (error) {
    console.error('Cart access check error:', error);
    res.status(500).json({ 
      message: 'Internal server error during cart access check.' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrModerator,
  requireOwnershipOrAdmin,
  canAccessOrder,
  canAccessCart,
  optionalAuth
};
