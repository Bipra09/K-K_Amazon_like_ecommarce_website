# K&K E-commerce Website 🛒

A full-featured e-commerce platform inspired by Amazon, built with modern web technologies.

## ✨ Features

### 🚀 Core Features
- **User Authentication**: Sign up, login, logout with JWT
- **Social Login**: Google & Facebook integration
- **Product Catalog**: Categories, search, filters, sorting
- **Shopping Cart**: Add/remove items, quantity management
- **Wishlist**: Save favorite products
- **Checkout System**: Multiple payment options, address management
- **Order Management**: Order history, tracking, status updates
- **Reviews & Ratings**: Product reviews and rating system
- **Admin Panel**: Product management, order management, user management
- **Recommendations**: AI-powered product suggestions
- **Search**: Advanced search with autocomplete

### 🛠️ Tech Stack
- **Frontend**: React.js with modern hooks and context
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + OAuth (Google/Facebook)
- **Payment**: Stripe integration
- **File Upload**: Cloudinary for image management
- **Styling**: Tailwind CSS + Custom components

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo>
   cd kk-ecommerce
   npm run install-all
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 📁 Project Structure

```
kk-ecommerce/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utility functions
├── server/                # Node.js backend
│   ├── controllers/      # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Backend utilities
├── uploads/              # File uploads (development)
└── docs/                 # Documentation
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Payment
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the client/build folder
```

### Backend (Render/AWS/Heroku)
```bash
npm start
# Set environment variables in your hosting platform
```

## 📱 Features in Detail

### User Module
- Secure authentication with JWT
- Social login integration
- Profile management
- Address book
- Order history

### Product Module
- Rich product catalog
- Category management
- Advanced search and filters
- Product recommendations
- Stock management

### Shopping Experience
- Smart shopping cart
- Wishlist functionality
- Secure checkout
- Multiple payment methods
- Order tracking

### Admin Features
- Product CRUD operations
- Order management
- User management
- Analytics dashboard
- Content management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@kk-ecommerce.com or create an issue in the repository.

---

**Built with ❤️ by Bipra09**
