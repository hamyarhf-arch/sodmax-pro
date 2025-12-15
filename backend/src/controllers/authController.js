const User = require('../models/User');
const GameData = require('../models/GameData');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// تولید توکن JWT
const generateToken = (userId, isAdmin) => {
    return jwt.sign(
        { userId, isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// ثبت نام
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password, inviteCode } = req.body;

        // بررسی وجود کاربر
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'این ایمیل قبلاً ثبت شده است' 
            });
        }

        // یافتن کاربر دعوت‌کننده
        let referrer = null;
        if (inviteCode) {
            referrer = await User.findOne({ inviteCode });
        }

        // ایجاد کاربر
        const user = new User({
            fullName,
            email,
            password,
            referredBy: referrer ? referrer._id : null
        });

        await user.save();

        // اگر دعوت شده، آپدیت دعوت‌کننده
        if (referrer) {
            referrer.referralCount += 1;
            await referrer.save();
        }

        // ایجاد داده‌های بازی
        const gameData = new GameData({
            user: user._id,
            sodBalance: 1000000, // هدیه ثبت نام
            totalMined: 1000000,
            usdtProgress: 1000000
        });
        await gameData.save();

        // تولید توکن
        const token = generateToken(user._id, user.isAdmin);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                inviteCode: user.inviteCode,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ 
            error: 'خطا در ثبت نام' 
        });
    }
};

// لاگین
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // یافتن کاربر
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                error: 'ایمیل یا رمز عبور نادرست' 
            });
        }

        // بررسی پسورد
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                error: 'ایمیل یا رمز عبور نادرست' 
            });
        }

        // آپدیت آخرین لاگین
        user.lastLogin = Date.now();
        await user.save();

        // تولید توکن
        const token = generateToken(user._id, user.isAdmin);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                inviteCode: user.inviteCode,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ 
            error: 'خطا در ورود' 
        });
    }
};

// دریافت اطلاعات کاربر
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        const gameData = await GameData.findOne({ user: req.userId });

        if (!user || !gameData) {
            return res.status(404).json({ 
                error: 'کاربر یافت نشد' 
            });
        }

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                gameData
            }
        });

    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ 
            error: 'خطا در دریافت اطلاعات' 
        });
    }
};
