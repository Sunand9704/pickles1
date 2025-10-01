const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Admin credentials
const ADMIN_CREDENTIALS = {
  name: 'Admin User',
  email: 'admin@amanspices.com',
  password: 'Admin@123',
  phone: '+91 9876543210',
  role: 'admin'
};

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/amanspices', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Name:', existingAdmin.name);
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: ADMIN_CREDENTIALS.name,
      email: ADMIN_CREDENTIALS.email,
      phone: ADMIN_CREDENTIALS.phone,
      role: ADMIN_CREDENTIALS.role,
      isActive: true
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    adminUser.password = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

    // Save admin user
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', ADMIN_CREDENTIALS.email);
    console.log('🔑 Password:', ADMIN_CREDENTIALS.password);
    console.log('👤 Name:', ADMIN_CREDENTIALS.name);
    console.log('📱 Phone:', ADMIN_CREDENTIALS.phone);
    console.log('🔐 Role:', ADMIN_CREDENTIALS.role);
    console.log('\n🚀 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedAdmin();
