import React from 'react';
import { useQuery } from 'react-query';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Plus
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery(
    'admin-dashboard',
    () => adminAPI.getDashboard(),
    {
      enabled: !!user && user.role === 'admin',
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Mock data for demonstration
  const mockData = {
    totalUsers: 1247,
    totalProducts: 89,
    totalOrders: 156,
    totalRevenue: 45678.90,
    recentOrders: [
      { id: 1, customer: 'John Doe', amount: 299.99, status: 'Processing' },
      { id: 2, customer: 'Jane Smith', amount: 149.50, status: 'Shipped' },
      { id: 3, customer: 'Bob Johnson', amount: 89.99, status: 'Delivered' },
    ],
    topProducts: [
      { name: 'Wireless Headphones', sales: 45, revenue: 8995.50 },
      { name: 'Smart Watch', sales: 32, revenue: 6398.00 },
      { name: 'Laptop Stand', sales: 28, revenue: 1399.72 },
    ]
  };

  const data = dashboardData || mockData;

  const stats = [
    {
      name: 'Total Users',
      value: data.totalUsers,
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Products',
      value: data.totalProducts,
      change: '+5%',
      changeType: 'increase',
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'Total Orders',
      value: data.totalOrders,
      change: '+23%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Revenue',
      value: `$${data.totalRevenue.toLocaleString()}`,
      change: '+18%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`ml-2 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="ml-2 text-sm text-gray-500">from last month</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customer}</p>
                        <p className="text-sm text-gray-500">Order #{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${order.amount}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.sales} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${product.revenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Add Product</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">View Orders</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Manage Users</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Package className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Inventory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
