import api from './api';

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Don't store user data or token after registration
      // This ensures the user needs to log in after registration
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed';
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error.response?.data?.message || error.response?.data?.error || error.message || 'Profile update failed';
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send reset link';
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error.response?.data?.message || error.response?.data?.error || error.message || 'Password reset failed';
    }
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error.response?.data?.message || error.response?.data?.error || error.message || 'OTP verification failed';
    }
  }
};

export default authService; 