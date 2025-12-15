const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// اعتبارسنجی
const registerValidation = [
    body('fullName').notEmpty().withMessage('نام کامل الزامی است'),
    body('email').isEmail().withMessage('ایمیل معتبر نیست'),
    body('password').isLength({ min: 6 }).withMessage('رمز عبور حداقل ۶ کاراکتر باید باشد')
];

const loginValidation = [
    body('email').isEmail().withMessage('ایمیل معتبر نیست'),
    body('password').notEmpty().withMessage('رمز عبور الزامی است')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.get('/verify', authenticate, (req, res) => {
    res.json({ valid: true, userId: req.userId });
});

module.exports = router;
