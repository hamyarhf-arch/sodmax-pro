const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticate } = require('../middleware/auth');

// همه routes نیاز به احراز هویت دارند
router.use(authenticate);

// دریافت اطلاعات بازی
router.get('/', gameController.getGameData);

// استخراج
router.post('/mine', gameController.mine);

// بوست
router.post('/boost', gameController.activateBoost);

// دریافت USDT
router.post('/claim-usdt', gameController.claimUSDT);

// خرید پنل
router.post('/buy-panel', gameController.buyPanel);

// دریافت تراکنش‌ها
router.get('/transactions', async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const transactions = await Transaction.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ error: 'خطا در دریافت تراکنش‌ها' });
    }
});

module.exports = router;
