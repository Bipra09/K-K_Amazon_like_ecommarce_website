import React from 'react';
import { Package, Eye, Edit } from 'lucide-react';

const Orders = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
          <p className="mt-2 text-gray-600">View and manage customer orders</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          </div>
          
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Order Management</h3>
            <p className="mt-1 text-sm text-gray-500">This page will contain order management functionality.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
