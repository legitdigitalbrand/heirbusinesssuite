import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export const getEmployeeProfile = async (userId, companyId) => {
  const result = await query(
    `SELECT e.*, u.email, u.first_name, u.last_name
     FROM employees e
     JOIN users u ON e.user_id = u.id
     WHERE e.user_id = $1 AND e.company_id = $2`,
    [userId, companyId]
  );

  if (result.rows.length === 0) {
    throw new Error('Employee profile not found');
  }

  return result.rows[0];
};

export const updateEmployeeProfile = async (userId, companyId, data) => {
  const {
    firstName,
    lastName,
    phone,
    address,
    city,
    country,
    dateOfBirth,
    emergencyContactName,
    emergencyContactPhone,
  } = data;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Update user basic info
    await client.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW()
       WHERE id = $4`,
      [firstName, lastName, phone, userId]
    );

    // Update employee details
    await client.query(
      `UPDATE employees
       SET address = $1, city = $2, country = $3, date_of_birth = $4,
           emergency_contact_name = $5, emergency_contact_phone = $6, updated_at = NOW()
       WHERE user_id = $7 AND company_id = $8`,
      [address, city, country, dateOfBirth, emergencyContactName, emergencyContactPhone, userId, companyId]
    );

    await client.query('COMMIT');

    return { message: 'Profile updated successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const inviteEmployee = async (email, companyId, adminId, employeeData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if user exists
    const userExists = await client.query(
      `SELECT id FROM users WHERE email = $1 AND company_id = $2`,
      [email, companyId]
    );

    let userId;

    if (userExists.rows.length > 0) {
      userId = userExists.rows[0].id;
    } else {
      // Create new user with temporary password
      userId = uuidv4();
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await client.query(
        `INSERT INTO users (id, company_id, email, password_hash, first_name, last_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, companyId, email, hashedPassword, employeeData.firstName || '', employeeData.lastName || '', 'pending_activation']
      );
    }

    // Create employee record
    const employeeId = uuidv4();
    await client.query(
      `INSERT INTO employees (id, user_id, company_id, employee_id, position, employment_type, date_of_joining)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)`,
      [employeeId, userId, companyId, employeeData.employeeId || null, employeeData.position || '', 'full_time']
    );

    // Assign Employee role
    const employeeRole = await client.query(
      `SELECT id FROM roles WHERE company_id = $1 AND name = 'Employee' LIMIT 1`,
      [companyId]
    );

    if (employeeRole.rows.length > 0) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [userId, employeeRole.rows[0].id, adminId]
      );
    }

    // Create invitation notification
    await client.query(
      `INSERT INTO notifications (id, company_id, recipient_user_id, sender_user_id, type, title, message, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'system', 'Welcome to Heirs Business Suite', 'You have been added to the company. Please set your password.', NOW())`,
      [companyId, userId, adminId]
    );

    await client.query('COMMIT');

    return { userId, email, message: 'Employee invited successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const listEmployees = async (companyId, filters = {}) => {
  let query_str = `
    SELECT e.id, e.employee_id, u.email, u.first_name, u.last_name, 
           e.position, e.department_id, e.employment_status, e.date_of_joining,
           d.name AS department_name
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.company_id = $1
  `;

  const params = [companyId];

  if (filters.status) {
    query_str += ` AND e.employment_status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters.department) {
    query_str += ` AND e.department_id = $${params.length + 1}`;
    params.push(filters.department);
  }

  query_str += ` ORDER BY u.first_name ASC`;

  const result = await query(query_str, params);
  return result.rows;
};

export const getDashboardStats = async (companyId) => {
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM employees WHERE company_id = $1 AND employment_status = 'active') as total_employees,
      (SELECT COUNT(*) FROM employees WHERE company_id = $1 AND employment_status = 'active' AND DATE(date_of_joining) >= CURRENT_DATE - INTERVAL '30 days') as new_employees,
      (SELECT COUNT(*) FROM products WHERE company_id = $1 AND status = 'active') as total_products,
      (SELECT COUNT(*) FROM attendance_logs WHERE company_id = $1 AND DATE(sign_in_time) = CURRENT_DATE AND status = 'active') as employees_present_today,
      (SELECT COUNT(*) FROM notifications WHERE company_id = $1 AND is_read = false) as pending_notifications,
      (SELECT COUNT(*) FROM departments WHERE company_id = $1) as departments_count
  `;

  const result = await query(statsQuery, [companyId]);
  return result.rows[0];
};
