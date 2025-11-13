const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function createLikesTable() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'pc_builder_db',
    multipleStatements: true
  };

  try {
    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Create build_likes table
    console.log('📊 Creating build_likes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS build_likes (
        like_id INT AUTO_INCREMENT PRIMARY KEY,
        build_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_build_user (build_id, user_id),
        FOREIGN KEY (build_id) REFERENCES build(build_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
        INDEX idx_build_id (build_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✅ build_likes table created successfully\n');

    await connection.end();
    console.log('🎉 Database setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createLikesTable();

