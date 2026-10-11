import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation } from 'react-query';
import { 
  CreditCard, 
  Truck, 
  CheckCircle, 
  ArrowLeft,
  Lock,
  Shield,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    shipping: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || 'United States'
      }
    },
    billing: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || 'United States'
      }
    },
    payment: {
      method: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    },
    sameAsShipping: true
  });

  // Fetch shipping options
  const { data: shippingOptions } = useQuery(
    'shippingOptions',
    () => ordersAPI.getShippingOptions(),
    { staleTime: 10 * 60 * 1000 }
  );

  // Create order mutation
  const createOrderMutation = useMutation(
    (orderData) => ordersAPI.createOrder(orderData),
    {
      onSuccess: (data) => {
        toast.success('Order placed successfully!');
        clearCart();
        navigate(`/orders/${data._id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    }
  );

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 5.99; // Default shipping cost
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        address: {
          ...prev[parent].address,
          [child]: value
        }
      }
    }));
  };

  const handleSameAsShippingChange = (e) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      sameAsShipping: checked,
      billing: checked ? prev.shipping : prev.billing
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1: // Shipping
        const shipping = formData.shipping;
        return shipping.firstName && shipping.lastName && shipping.email && 
               shipping.phone && shipping.address.street && shipping.address.city && 
               shipping.address.state && shipping.address.zipCode;
      case 2: // Payment
        const payment = formData.payment;
        return payment.cardNumber && payment.expiryDate && payment.cvv && payment.cardholderName;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields');
      return;
    }

    const orderData = {
      items: cartItems.map(item => ({
        product: item._id,
        quantity: item.quantity,
        price: item.price
      })),
      shipping: formData.shipping,
      billing: formData.billing,
      payment: formData.payment,
      subtotal,
      shipping,
      tax,
      total
    };

    createOrderMutation.mutate(orderData);
  };

  const steps = [
    { id: 1, name: 'Shipping', icon: Truck },
    { id: 2, name: 'Payment', icon: CreditCard },
    { id: 3, name: 'Review', icon: CheckCircle }
  ];

  if (cartItems.length === 0) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart before checkout.</p>
          <button
            onClick={() => navigate('/cart')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            View Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - K&K</title>
        <meta name="description" content="Complete your purchase securely with our streamlined checkout process." />
      </Helmet>

      <div className="pt-16 lg:pt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/cart')}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Checkout
                </h1>
                <p className="text-lg text-gray-600">
                  Complete your purchase securely
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= step.id
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-300 text-gray-500'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </span>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-4 ${
                          currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                {/* Step 1: Shipping */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="shipping.firstName"
                          value={formData.shipping.firstName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="shipping.lastName"
                          value={formData.shipping.lastName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="shipping.email"
                          value={formData.shipping.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          name="shipping.phone"
                          value={formData.shipping.phone}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="shipping.address.street"
                          value={formData.shipping.address.street}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          name="shipping.address.city"
                          value={formData.shipping.address.city}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province *
                        </label>
                        <input
                          type="text"
                          name="shipping.address.state"
                          value={formData.shipping.address.state}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP/Postal Code *
                        </label>
                        <input
                          type="text"
                          name="shipping.address.zipCode"
                          value={formData.shipping.address.zipCode}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country *
                        </label>
                        <input
                          type="text"
                          name="shipping.address.country"
                          value={formData.shipping.address.country}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                    
                    {/* Billing Address */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          id="sameAsShipping"
                          checked={formData.sameAsShipping}
                          onChange={handleSameAsShippingChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="sameAsShipping" className="text-sm font-medium text-gray-700">
                          Billing address same as shipping
                        </label>
                      </div>
                      
                      {!formData.sameAsShipping && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name *
                            </label>
                            <input
                              type="text"
                              name="billing.firstName"
                              value={formData.billing.firstName}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              name="billing.lastName"
                              value={formData.billing.lastName}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Street Address *
                            </label>
                            <input
                              type="text"
                              name="billing.address.street"
                              value={formData.billing.address.street}
                              onChange={handleAddressChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              name="billing.address.city"
                              value={formData.billing.address.city}
                              onChange={handleAddressChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State/Province *
                            </label>
                            <input
                              type="text"
                              name="billing.address.state"
                              value={formData.billing.address.state}
                              onChange={handleAddressChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ZIP/Postal Code *
                            </label>
                            <input
                              type="text"
                              name="billing.address.zipCode"
                              value={formData.billing.address.zipCode}
                              onChange={handleAddressChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country *
                            </label>
                            <input
                              type="text"
                              name="billing.address.country"
                              value={formData.billing.address.country}
                              onChange={handleAddressChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            name="payment.cardNumber"
                            value={formData.payment.cardNumber}
                            onChange={handleChange}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            name="payment.cardholderName"
                            value={formData.payment.cardholderName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            name="payment.expiryDate"
                            value={formData.payment.expiryDate}
                            onChange={handleChange}
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            name="payment.cvv"
                            value={formData.payment.cvv}
                            onChange={handleChange}
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Review</h2>
                    
                    {/* Order Summary */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Order Items</h3>
                        <div className="space-y-3">
                          {cartItems.map((item) => (
                            <div key={item._id} className="flex items-center justify-between py-3 border-b border-gray-100">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={item.images?.[0]}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-medium text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-900">
                            {formData.shipping.firstName} {formData.shipping.lastName}
                          </p>
                          <p className="text-gray-600">{formData.shipping.address.street}</p>
                          <p className="text-gray-600">
                            {formData.shipping.address.city}, {formData.shipping.address.state} {formData.shipping.address.zipCode}
                          </p>
                          <p className="text-gray-600">{formData.shipping.address.country}</p>
                          <p className="text-gray-600">{formData.shipping.phone}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-900">Credit Card ending in {formData.payment.cardNumber.slice(-4)}</p>
                          <p className="text-gray-600">{formData.payment.cardholderName}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step Navigation */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    {currentStep > 1 && (
                      <button
                        onClick={prevStep}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                    )}
                    
                    {currentStep < 3 ? (
                      <button
                        onClick={nextStep}
                        className="ml-auto bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={createOrderMutation.isLoading}
                        className="ml-auto bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {createOrderMutation.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                {/* Items */}
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.images?.[0]}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Lock className="w-4 h-4" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
                    <Shield className="w-4 h-4" />
                    <span>SSL encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
