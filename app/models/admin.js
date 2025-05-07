// models/admin.js

const db     = require('../services/db');
const bcrypt = require('bcryptjs');

class Admin {
  // Id of the admin
  id;

  // Email of the admin
  email;

  constructor(email) {
    this.email = email;
  }
  
  // Get an existing admin id from an email address, or return false if not found
  async getIdFromEmail() {
    const sql    = "SELECT id FROM admins WHERE email = ?";
    const result = await db.query(sql, [this.email]);
    if (result.length) {
      this.id = result[0].id;
      return this.id;
    }
    return false;
  }

  // Update this admin’s password
  async setUserPassword(password) {
    const pw  = await bcrypt.hash(password, 10);
    const sql = "UPDATE admins SET password = ? WHERE id = ?";
    await db.query(sql, [pw, this.id]);
    return true;
  }
  
  // Add a new record to the admins table
  async addUser(password) {
    const pw  = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO admins (email, password) VALUES (?, ?)";
    const result = await db.query(sql, [this.email, pw]);
    this.id = result.insertId;
    return true;
  }

  // Authenticate a submitted password against the stored hash
  async authenticate(submitted) {
    const sql    = "SELECT password FROM admins WHERE id = ?";
    const result = await db.query(sql, [this.id]);
    return await bcrypt.compare(submitted, result[0].password);
  }
}

module.exports = { Admin };
