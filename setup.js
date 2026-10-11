#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 K&K E-commerce Setup Wizard');
console.log('===============================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runCommand(command, description) {
  try {
    log(`\n${colors.cyan}${description}...${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully!`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue');
  
  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const version = nodeVersion.replace('v', '');
    const majorVersion = parseInt(version.split('.')[0]);
    
    if (majorVersion < 16) {
      log(`❌ Node.js version ${version} is too old. Please install Node.js 16 or higher.`, 'red');
      return false;
    }
    log(`✅ Node.js ${version} detected`, 'green');
  } catch (error) {
    log('❌ Node.js not found. Please install Node.js 16 or higher.', 'red');
    return false;
  }

  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm ${npmVersion} detected`, 'green');
  } catch (error) {
    log('❌ npm not found. Please install npm.', 'red');
    return false;
  }

  // Check MongoDB
  try {
    execSync('mongod --version', { stdio: 'ignore' });
    log('✅ MongoDB detected', 'green');
  } catch (error) {
    log('⚠️  MongoDB not found. You can install it locally or use MongoDB Atlas.', 'yellow');
    log('   For local installation: https://docs.mongodb.com/manual/installation/', 'yellow');
    log('   For MongoDB Atlas: https://www.mongodb.com/cloud/atlas', 'yellow');
  }

  return true;
}

async function installDependencies() {
  log('\n📦 Installing dependencies...', 'blue');
  
  // Install backend dependencies
  if (!await runCommand('npm install', 'Installing backend dependencies')) {
    return false;
  }

  // Install frontend dependencies
  if (!await runCommand('cd client && npm install', 'Installing frontend dependencies')) {
    return false;
  }

  return true;
}

async function setupEnvironment() {
  log('\n⚙️  Setting up environment...', 'blue');
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('Environment file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log('Skipping environment setup...', 'yellow');
      return true;
    }
  }

  if (!fs.existsSync(envExamplePath)) {
    log('❌ Environment example file not found!', 'red');
    return false;
  }

  try {
    // Copy env.example to .env
    fs.copyFileSync(envExamplePath, envPath);
    log('✅ Environment file created from template', 'green');
    
    log('\n📝 Please update the .env file with your configuration values:', 'yellow');
    log('   - Database connection string', 'yellow');
    log('   - JWT secret key', 'yellow');
    log('   - API keys for external services', 'yellow');
    
    const openEditor = await question('\nOpen .env file in editor? (y/N): ');
    if (openEditor.toLowerCase() === 'y') {
      // Try to open with common editors
      const editors = ['code', 'nano', 'vim', 'notepad'];
      for (const editor of editors) {
        try {
          execSync(`${editor} ${envPath}`, { stdio: 'ignore' });
          break;
        } catch (error) {
          // Continue to next editor
        }
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Failed to create environment file: ${error.message}`, 'red');
    return false;
  }
}

async function createUploadsDirectory() {
  log('\n📁 Creating uploads directory...', 'blue');
  
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      log('✅ Uploads directory created', 'green');
    } catch (error) {
      log(`❌ Failed to create uploads directory: ${error.message}`, 'red');
      return false;
    }
  } else {
    log('✅ Uploads directory already exists', 'green');
  }
  
  return true;
}

async function setupDatabase() {
  log('\n🗄️  Database setup...', 'blue');
  
  const setupDb = await question('Would you like to set up sample data? (y/N): ');
  if (setupDb.toLowerCase() !== 'y') {
    log('Skipping database setup...', 'yellow');
    return true;
  }

  // Create a simple database seeder
  const seederPath = path.join(__dirname, 'server', 'seeder.js');
  const seederContent = `const mongoose = require('mongoose');
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

    console.log('\\n🎉 Database seeding completed successfully!');
    console.log('\\n📱 You can now login with:');
    console.log('   Email: admin@kk.com');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
`;

  try {
    fs.writeFileSync(seederPath, seederContent);
    log('✅ Database seeder created', 'green');
    
    const runSeeder = await question('Run database seeder now? (y/N): ');
    if (runSeeder.toLowerCase() === 'y') {
      if (await runCommand('cd server && node seeder.js', 'Running database seeder')) {
        log('🎉 Sample data created successfully!', 'green');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Failed to create database seeder: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  try {
    log('Welcome to K&K E-commerce Setup!', 'bright');
    
    // Check prerequisites
    if (!await checkPrerequisites()) {
      log('\n❌ Prerequisites check failed. Please resolve the issues above.', 'red');
      process.exit(1);
    }

    // Install dependencies
    if (!await installDependencies()) {
      log('\n❌ Dependency installation failed.', 'red');
      process.exit(1);
    }

    // Setup environment
    if (!await setupEnvironment()) {
      log('\n❌ Environment setup failed.', 'red');
      process.exit(1);
    }

    // Create uploads directory
    if (!await createUploadsDirectory()) {
      log('\n❌ Uploads directory creation failed.', 'red');
      process.exit(1);
    }

    // Setup database
    if (!await setupDatabase()) {
      log('\n❌ Database setup failed.', 'red');
      process.exit(1);
    }

    log('\n🎉 Setup completed successfully!', 'green');
    log('\n📋 Next steps:', 'blue');
    log('   1. Update your .env file with your configuration', 'yellow');
    log('   2. Start the backend: npm run server', 'yellow');
    log('   3. Start the frontend: npm run client', 'yellow');
    log('   4. Or run both: npm run dev', 'yellow');
    log('\n🌐 Your e-commerce website will be available at:', 'blue');
    log('   Frontend: http://localhost:3000', 'yellow');
    log('   Backend: http://localhost:5000', 'yellow');
    log('\n📚 For more information, check the README.md file', 'blue');

  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
main();
