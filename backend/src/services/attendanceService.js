import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const signIn = async (userId, companyId, ipAddress) => {
  const attendanceId = uuidv4();
  
  const result = await query(
    `INSERT INTO attendance_logs (id, user_id, company_id, sign_in_time, status, ip_address)
     VALUES ($1, $2, $3, NOW(), $4, $5)
     RETURNING id, sign_in_time`,
    [attendanceId, userId, companyId, 'active', ipAddress]
  );

  return result.rows[0];
};

export const signOut = async (userId, companyId) => {
  const result = await query(
    `UPDATE attendance_logs
     SET sign_out_time = NOW(), status = 'completed',
         duration_minutes = EXTRACT(EPOCH FROM (NOW() - sign_in_time)) / 60
     WHERE user_id = $1 AND company_id = $2 AND sign_out_time IS NULL
     RETURNING id, sign_in_time, sign_out_time, duration_minutes`,
    [userId, companyId]
  );

  if (result.rows.length === 0) {
    throw new Error('No active sign-in found');
  }

  // Update daily attendance
  await query(
    `INSERT INTO daily_attendance (id, user_id, company_id, date, total_hours_worked, status)
     VALUES (gen_random_uuid(), $1, $2, CURRENT_DATE, $3, $4)
     ON CONFLICT (user_id, company_id, date) DO UPDATE
     SET total_hours_worked = total_hours_worked + EXCLUDED.total_hours_worked`,
    [userId, companyId, result.rows[0].duration_minutes / 60, 'present']
  );

  return result.rows[0];
};

export const getTodayStatus = async (userId, companyId) => {
  const result = await query(
    `SELECT id, sign_in_time, sign_out_time, status
     FROM attendance_logs
     WHERE user_id = $1 AND company_id = $2 
     AND DATE(sign_in_time) = CURRENT_DATE
     ORDER BY sign_in_time DESC`,
    [userId, companyId]
  );

  if (result.rows.length === 0) {
    return { signedIn: false, entries: [] };
  }

  const latestEntry = result.rows[0];
  const signedIn = latestEntry.status === 'active' && !latestEntry.sign_out_time;

  return {
    signedIn,
    currentEntry: signedIn ? latestEntry : null,
    entries: result.rows,
    totalHoursToday: await getTotalHoursToday(userId, companyId),
  };
};

export const getTotalHoursToday = async (userId, companyId) => {
  const result = await query(
    `SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes
     FROM attendance_logs
     WHERE user_id = $1 AND company_id = $2
     AND DATE(sign_in_time) = CURRENT_DATE
     AND status = 'completed'`,
    [userId, companyId]
  );

  return result.rows[0].total_minutes / 60;
};

export const getAttendanceHistory = async (userId, companyId, days = 30) => {
  const result = await query(
    `SELECT date, total_hours_worked, status
     FROM daily_attendance
     WHERE user_id = $1 AND company_id = $2
     AND date >= CURRENT_DATE - INTERVAL '1 day' * $3
     ORDER BY date DESC`,
    [userId, companyId, days]
  );

  return result.rows;
};
