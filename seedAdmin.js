require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

connectDB().then(async () => {
  await User.deleteOne({ email: 'admin@demo.com' });
  await User.create({ name: 'Admin', email: 'admin@demo.com', password: 'admin123', role: 'admin' });
  console.log('✅ Admin created: admin@demo.com / admin123');
  process.exit();
});