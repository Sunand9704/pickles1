const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTP, generateResetToken, sendResetPasswordEmail, sendAdminOTP } = require('../utils/otp');

// Admin Login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and is admin
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin Forgot Password
exports.adminForgotPassword = async (req, res) => {
  try {
    console.log('Admin forgot password request received:', req.body);
    
    const { email } = req.body;
    
    if (!email) {
      console.log('Email is missing in request');
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing:', {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPassword: !!process.env.EMAIL_PASSWORD
      });
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Check if frontend URL is configured
    if (!process.env.FRONTEND_URL) {
      console.error('Frontend URL not configured');
      return res.status(500).json({ error: 'Frontend URL not configured' });
    }

    console.log('Looking up admin user with email:', email);
    // Only allow admin users to reset password
    const user = await User.findOne({ email, role: 'admin' });
    
    if (!user) {
      console.log('Admin user not found for email:', email);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    console.log('Generating reset token for admin user:', user._id);
    // Generate reset token
    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    console.log('Saving admin user with reset token');
    await user.save();

    try {
      console.log('Attempting to send reset email to admin:', email);
      // Send reset password email
      await sendResetPasswordEmail(email, 'admin_reset_request', resetToken);
      console.log('Reset email sent successfully to admin');
      res.json({ 
        success: true,
        message: 'Password reset link sent to your email',
        token: resetToken // Send token in response for testing
      });
    } catch (emailError) {
      console.error('Failed to send reset email to admin:', emailError);
      
      // If email fails, remove the reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({ 
        error: 'Failed to send reset email. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin Reset Password
exports.adminResetPassword = async (req, res) => {
  try {
    console.log('Admin reset password request received:', req.body);
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Only allow admin users to reset password
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      role: 'admin'
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email
    try {
      await sendResetPasswordEmail(user.email, 'admin_password_reset_confirmation');
    } catch (emailError) {
      console.error('Failed to send confirmation email to admin:', emailError);
      // Don't fail the request if confirmation email fails
    }

    res.json({ 
      success: true,
      message: 'Password reset successful' 
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ 
      error: 'An error occurred while resetting your password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin Send OTP for Forgot Password
exports.adminSendOTP = async (req, res) => {
  try {
    console.log('Admin send OTP request received:', req.body);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email configuration missing');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Only allow admin users to reset password
    const user = await User.findOne({ email, role: 'admin' });
    
    if (!user) {
      console.log('Admin user not found for email:', email);
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpType = 'forgot-password';

    console.log('Generated OTP for user:', { 
      email: user.email, 
      otp, 
      otpExpires: user.otpExpires,
      otpType: user.otpType 
    });

    await user.save();
    console.log('User saved with OTP:', { 
      savedOtp: user.otp, 
      savedExpires: user.otpExpires,
      savedType: user.otpType 
    });

    try {
      console.log('Sending OTP to admin:', email);
      await sendAdminOTP(email, otp);
      console.log('OTP sent successfully to admin');
      
      res.json({ 
        success: true,
        message: 'Verification code sent to your email'
      });
    } catch (emailError) {
      console.error('Failed to send OTP to admin:', emailError);
      
      // If email fails, remove the OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpType = undefined;
      await user.save();
      
      return res.status(500).json({ 
        error: 'Failed to send verification code. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error('Admin send OTP error:', error);
    res.status(500).json({ 
      error: 'An error occurred while sending verification code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin Verify OTP
exports.adminVerifyOTP = async (req, res) => {
  try {
    console.log('Admin verify OTP request received:', req.body);
    const { email, otp, type } = req.body;

    if (!email || !otp || !type) {
      console.log('Missing required fields:', { email: !!email, otp: !!otp, type: !!type });
      return res.status(400).json({ error: 'Email, OTP, and type are required' });
    }

    console.log('Looking for user with:', { email, otp, type, currentTime: Date.now() });

    // First, find the user by email and role
    const user = await User.findOne({ email, role: 'admin' });
    
    if (!user) {
      console.log('Admin user not found for email:', email);
      return res.status(400).json({ error: 'Admin user not found' });
    }

    console.log('User found:', { 
      hasOtp: !!user.otp, 
      userOtp: user.otp, 
      providedOtp: otp,
      otpExpires: user.otpExpires,
      currentTime: Date.now(),
      isExpired: user.otpExpires ? user.otpExpires < Date.now() : true,
      otpType: user.otpType,
      expectedType: type
    });

    // Check if OTP matches and is not expired
    if (!user.otp || user.otp !== otp) {
      console.log('OTP mismatch or not found');
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (!user.otpExpires || user.otpExpires < Date.now()) {
      console.log('OTP expired');
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    if (user.otpType !== type) {
      console.log('OTP type mismatch');
      return res.status(400).json({ error: 'Invalid verification code type' });
    }

    // Generate reset token for password reset
    const resetToken = generateResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;

    await user.save();

    res.json({ 
      success: true,
      message: 'Verification code verified successfully',
      token: resetToken
    });
  } catch (error) {
    console.error('Admin verify OTP error:', error);
    res.status(500).json({ 
      error: 'An error occurred while verifying code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin Reset Password with Token (New Method)
exports.adminResetPasswordWithToken = async (req, res) => {
  try {
    console.log('Admin reset password with token request received:', req.body);
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required' });
    }

    // Only allow admin users to reset password
    const user = await User.findOne({
      email,
      role: 'admin',
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email
    try {
      await sendResetPasswordEmail(user.email, 'admin_password_reset_confirmation');
    } catch (emailError) {
      console.error('Failed to send confirmation email to admin:', emailError);
      // Don't fail the request if confirmation email fails
    }

    res.json({ 
      success: true,
      message: 'Password reset successful' 
    });
  } catch (error) {
    console.error('Admin reset password with token error:', error);
    res.status(500).json({ 
      error: 'An error occurred while resetting your password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
