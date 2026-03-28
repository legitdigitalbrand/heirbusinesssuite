import { registerCompany, loginUser, refreshAccessToken } from '../services/authService.js';

export const register = async (req, res) => {
  try {
    const { companyName, email, password, adminFirstName, adminLastName, phone } = req.body;

    // Validation
    if (!companyName || !email || !password || !adminFirstName || !adminLastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await registerCompany({
      companyName,
      email,
      password,
      adminFirstName,
      adminLastName,
      phone,
    });

    res.status(201).json({
      message: 'Company and admin user created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await loginUser(email, password);

    res.json({
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = refreshAccessToken(refreshToken);
    res.json({ data: result });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = (req, res) => {
  // Token is invalidated on client side
  res.json({ message: 'Logout successful' });
};
