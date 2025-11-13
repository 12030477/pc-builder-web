const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testConnection(password, port = 3306) {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: password || '',
    port: port,
    multipleStatements: true
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.end();
    return { success: true, port };
  } catch (error) {
    return { success: false, error: error.message, port };
  }
}

async function setupDatabase() {
  console.log('\n🚀 PC Builder - Database Setup\n');
  console.log('='.repeat(50));
  
  // Try to connect to MySQL on port 3306 first (standard port)
  console.log('🔍 Testing MySQL connection on port 3306 (standard port)...');
  
  let password = process.env.DB_PASSWORD || '';
  let port = parseInt(process.env.DB_PORT) || 3306;
  
  // Try empty password first
  let connectionTest = await testConnection('', 3306);
  
  if (!connectionTest.success) {
    console.log('⚠️  Connection failed. Trying port 3000...');
    connectionTest = await testConnection('', 3000);
    if (connectionTest.success) {
      port = 3000;
      console.log('✅ Found MySQL on port 3000');
    } else {
      console.log('❌ Could not connect with empty password.');
      console.log('💡 You may need to set a password in backend/.env file');
      console.log('\nTry running:');
      console.log('  1. Edit backend/.env');
      console.log('  2. Set DB_PASSWORD=your_password');
      console.log('  3. Set DB_PORT=3306 (or 3000 if using MySQL95)');
      process.exit(1);
    }
  } else {
    console.log('✅ Found MySQL on port 3306 (standard port)');
  }

  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: password,
    port: port,
    multipleStatements: true
  };

  try {
    console.log(`\n📡 Connecting to MySQL on port ${port}...`);
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server successfully!\n');

    // Read SQL file
    const sqlFile = path.join(__dirname, '..', 'pc_builder_db.sql');
    console.log('📖 Reading SQL file...');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('✅ SQL file loaded\n');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'pc_builder_db';
    console.log(`🗄️  Creating database: ${dbName}...`);
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log('✅ Database created/selected\n');

    // Execute SQL
    console.log('⚙️  Importing database schema (this may take a minute)...');
    await connection.query(sql);
    console.log('✅ Database schema imported successfully!\n');

    // Test connection
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Found ${tables.length} tables in database:`);
    tables.slice(0, 10).forEach((table, index) => {
      console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
    });
    if (tables.length > 10) {
      console.log(`   ... and ${tables.length - 10} more tables`);
    }

    // Update .env file with port
    console.log('\n💾 Updating .env file with MySQL port...');
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Add or update DB_PORT
    if (!envContent.includes('DB_PORT=')) {
      envContent += `\nDB_PORT=${port}\n`;
    } else {
      envContent = envContent.replace(/DB_PORT=.*/, `DB_PORT=${port}`);
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ .env file updated with port ${port}\n`);

    await connection.end();
    console.log('='.repeat(50));
    console.log('\n🎉 Database setup completed successfully!');
    console.log(`\n📝 MySQL Configuration:`);
    console.log(`   Host: localhost`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${dbName}`);
    console.log(`\n📝 Next steps:`);
    console.log('   1. Start backend: cd backend && npm start');
    console.log('   2. Start frontend: npm start (in project root)');
    console.log('   3. Open: http://localhost:3000');
    console.log('\n✨ Your application is ready to use!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error setting up database:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL is not running. Please:');
      console.error('   1. Start MySQL service (Services → MySQL)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Wrong password. Please:');
      console.error('   1. Edit backend/.env file');
      console.error('   2. Set DB_PASSWORD=your_mysql_password');
      console.error('   3. Set DB_PORT=3306 (or 3000)');
      console.error('   4. Run this script again');
    }
    
    process.exit(1);
  }
}

setupDatabase();