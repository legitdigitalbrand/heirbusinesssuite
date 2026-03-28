import * as employeeService from '../services/employeeService.js';

export const inviteEmployee = async (req, res) => {
  try {
    const { companyId, id: adminId } = req.user;
    const { email, employeeData } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await employeeService.inviteEmployee(email, companyId, adminId, employeeData);

    res.status(201).json({
      message: 'Employee invited successfully',
      data: result,
    });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const listEmployees = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { status, department } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (department) filters.department = department;

    const employees = await employeeService.listEmployees(companyId, filters);

    res.json({
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error('List employees error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { companyId } = req.user;

    const result = await employeeService.getEmployeeProfile(employeeId, companyId);

    res.json({ data: result });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(404).json({ error: error.message });
  }
};
