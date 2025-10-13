const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');

// Admin authentication routes
router.post('/login', adminAuthController.adminLogin);
router.post('/forgot-password', adminAuthController.adminForgotPassword);
router.post('/reset-password', adminAuthController.adminResetPassword);

module.exports = router;
