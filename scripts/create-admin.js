const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createAdmin() {
  const client = await pool.connect();
  try {
    console.log("Creating admin account...");

    // Get admin details from command line or use defaults
    const args = process.argv.slice(2);
    const email = args[0] || "admin@exboard.ai";
    const password = args[1] || "CAS26@elecTions.Admin";
    const name = args[2] || "Admin User";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existing.length > 0) {
      await client.query(
        `UPDATE users
         SET password = $1, name = $2, role = 'ADMIN', is_verified = true
         WHERE email = $3`,
        [hashedPassword, name, email],
      );
      console.log(`✅ Admin account updated successfully!`);
    } else {
      const userId = randomUUID();
      // Create admin user
      await client.query(
        `INSERT INTO users (id, email, password, name, role, is_verified, class, board)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          email,
          hashedPassword,
          name,
          "ADMIN",
          true, // Admin is auto-verified
          null, // Admin doesn't have a class
          "AKUEB", // Default board
        ],
      );
      console.log("✅ Admin account created successfully!");
    }

    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name:     ${name}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🌐 Login at: http://localhost:3002/login");
    console.log("📊 Admin Dashboard: http://localhost:3002/admin/dashboard");
  } catch (err) {
    console.error("❌ Error creating/updating admin:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
