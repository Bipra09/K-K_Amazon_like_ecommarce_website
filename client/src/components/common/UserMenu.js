import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Settings, LogOut, ChevronDown } from 'lucide-react';

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: Package,
    },
    ...(user.role === 'admin' ? [{
      name: 'Admin Dashboard',
      href: '/admin',
      icon: Settings,
    }] : []),
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-50"
      >
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-primary-600 font-semibold text-sm">
            {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </span>
        </div>
        <span className="hidden sm:block text-sm font-medium">
          {user.firstName || user.email}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
