import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const registerCompany = async (companyData) => {
  const {
    companyName,
    email,
    password,
    adminFirstName,
    adminLastName,
    phone,
  } = companyData;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if company exists
    const companyExists = await client.query(
      'SELECT id FROM companies WHERE email = $1',
      [email]
    );

    if (companyExists.rows.length > 0) {
      throw new Error('Company with this email already exists');
    }

    // Create company
    const companyId = uuidv4();
    await client.query(
      `INSERT INTO companies (id, name, email, phone, status, subscription_plan)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [companyId, companyName, email, phone, 'active', 'free']
    );

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const userId = uuidv4();
    await client.query(
      `INSERT INTO users (id, company_id, email, password_hash, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, companyId, email, hashedPassword, adminFirstName, adminLastName, 'active']
    );

    // Create admin role
    const roleId = uuidv4();
    await client.query(
      `INSERT INTO roles (id, company_id, name, is_system_role)
       VALUES ($1, $2, $3, $4)`,
      [roleId, companyId, 'Admin', true]
    );

    // Assign admin role to user
    await client.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
       VALUES ($1, $2, $1, NOW())`,
      [userId, roleId]
    );

    await client.query('COMMIT');

    return {
      company: { id: companyId, name: companyName, email },
      user: { id: userId, email, firstName: adminFirstName, lastName: adminLastName },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const loginUser = async (email, password) => {
  const result = await query(
    `SELECT u.id, u.email, u.password_hash, u.company_id, u.first_name, u.last_name
     FROM users u
     WHERE u.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      companyId: user.company_id,
    },
  };
};

export const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    return { accessToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
