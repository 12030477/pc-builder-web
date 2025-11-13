const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
  console.log('\n🔐 Admin Password Reset\n');
  console.log('='.repeat(50));
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456789PC',
    port: parseInt(process.env.DB_PORT) || 3000,
    database: process.env.DB_NAME || 'pc_builder_db'
  };

  try {
    console.log('📡 Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Check if admin user exists
    const email = 'support@pcpartpicker.com';
    console.log(`🔍 Looking for admin user: ${email}`);
    
    const [users] = await connection.execute(
      'SELECT user_id, name, email, is_admin FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('\n❌ Admin user not found!');
      console.log('💡 Creating new admin user...\n');
      
      // Create admin user
      const newPassword = 'Admin123!@#';
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const [result] = await connection.execute(
        'INSERT INTO user (name, email, password, is_admin, created_at) VALUES (?, ?, ?, 1, NOW())',
        ['Admin User', email, hashedPassword]
      );
      
      console.log('✅ Admin user created successfully!');
      console.log(`\n📝 Login Credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`\n⚠️  Please change this password after logging in!`);
      
    } else {
      const user = users[0];
      console.log(`✅ Found admin user: ${user.name} (ID: ${user.user_id})`);
      
      // Reset password
      const newPassword = 'Admin123!@#';
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      console.log('\n🔐 Resetting password...');
      await connection.execute(
        'UPDATE user SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      
      console.log('✅ Password reset successfully!');
      console.log(`\n📝 Login Credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`\n⚠️  Please change this password after logging in!`);
    }

    await connection.end();
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Done! You can now login with the new password.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
