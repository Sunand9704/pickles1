const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');

// Admin authentication routes
router.post('/login', adminAuthController.adminLogin);
router.post('/forgot-password', adminAuthController.adminForgotPassword);
router.post('/reset-password', adminAuthController.adminResetPassword);

// New admin OTP-based forgot password routes
router.post('/send-otp', adminAuthController.adminSendOTP);
router.post('/verify-otp', adminAuthController.adminVerifyOTP);
router.post('/reset-password-with-token', adminAuthController.adminResetPasswordWithToken);

module.exports = router;
