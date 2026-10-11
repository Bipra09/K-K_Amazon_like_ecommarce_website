const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@kk.com',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true
    });
    console.log('✅ Admin user created');

    // Create sample categories
    const categories = await Category.create([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest electronic gadgets and devices'
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel for all ages'
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Everything for your home and garden'
      },
      {
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Sports equipment and outdoor gear'
      }
    ]);
    console.log('✅ Sample categories created');

    // Create sample products
    const products = await Product.create([
      {
        name: 'Smartphone X',
        slug: 'smartphone-x',
        description: 'Latest smartphone with advanced features',
        price: 699.99,
        category: categories[0]._id,
        stock: 50,
        isFeatured: true,
        isBestSeller: true
      },
      {
        name: 'Classic T-Shirt',
        slug: 'classic-t-shirt',
        description: 'Comfortable cotton t-shirt',
        price: 24.99,
        category: categories[1]._id,
        stock: 100,
        isFeatured: true
      },
      {
        name: 'Garden Tool Set',
        slug: 'garden-tool-set',
        description: 'Complete set of essential garden tools',
        price: 89.99,
        category: categories[2]._id,
        stock: 25
      }
    ]);
    console.log('✅ Sample products created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📱 You can now login with:');
    console.log('   Email: admin@kk.com');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
