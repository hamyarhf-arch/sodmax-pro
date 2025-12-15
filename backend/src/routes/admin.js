const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

// همه routes نیاز به ادمین دارند
router.use(authenticate, isAdmin);

// مدیریت کاربران
router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getSystemStats);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.post('/users/:userId/add-sod', adminController.addSOD);
router.post('/users/:userId/reset', adminController.resetGameData);

// عملیات سیستمی
router.get('/backup', async (req, res) => {
    try {
        const User = require('../models/User');
        const GameData = require('../models/GameData');
        
        const backup = {
            timestamp: new Date(),
            users: await User.find().select('-password').lean(),
            gameData: await GameData.find().lean(),
            settings: require('../../package.json')
        };
        
        res.json({ success: true, data: backup });
    } catch (error) {
        res.status(500).json({ error: 'خطا در پشتیبان‌گیری' });
    }
});

module.exports = router;
