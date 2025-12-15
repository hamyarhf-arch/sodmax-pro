const GameData = require('../models/GameData');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// دریافت اطلاعات بازی کاربر
exports.getGameData = async (req, res) => {
    try {
        const gameData = await GameData.findOne({ user: req.userId })
            .populate('user', 'fullName email inviteCode');
        
        if (!gameData) {
            return res.status(404).json({ error: 'داده بازی یافت نشد' });
        }
        
        res.json({
            success: true,
            data: gameData
        });
    } catch (error) {
        console.error('Get Game Data Error:', error);
        res.status(500).json({ error: 'خطا در دریافت اطلاعات بازی' });
    }
};

// استخراج دستی
exports.mine = async (req, res) => {
    try {
        const gameData = await GameData.findOne({ user: req.userId });
        if (!gameData) {
            return res.status(404).json({ error: 'داده بازی یافت نشد' });
        }
        
        // محاسبه مقدار استخراج
        let earned = gameData.miningPower;
        if (gameData.boostActive && new Date() < gameData.boostEndTime) {
            earned *= 3;
        } else {
            gameData.boostActive = false;
        }
        
        // آپدیت موجودی
        gameData.sodBalance += earned;
        gameData.todayEarnings += earned;
        gameData.totalMined += earned;
        gameData.usdtProgress += earned;
        
        // بررسی پاداش USDT
        const usdtEarned = await checkUSDT(gameData);
        
        // ذخیره
        await gameData.save();
        
        // ثبت تراکنش
        await Transaction.create({
            user: req.userId,
            type: 'mining',
            amount: earned,
            description: 'استخراج دستی',
            balanceAfter: gameData.sodBalance
        });
        
        res.json({
            success: true,
            data: {
                earned,
                sodBalance: gameData.sodBalance,
                usdtEarned,
                usdtProgress: gameData.usdtProgress
            }
        });
        
    } catch (error) {
        console.error('Mining Error:', error);
        res.status(500).json({ error: 'خطا در استخراج' });
    }
};

// فعال کردن بوست
exports.activateBoost = async (req, res) => {
    try {
        const gameData = await GameData.findOne({ user: req.userId });
        
        if (!gameData) {
            return res.status(404).json({ error: 'داده بازی یافت نشد' });
        }
        
        const boostCost = 5000;
        
        if (gameData.sodBalance < boostCost) {
            return res.status(400).json({ 
                error: `موجودی ناکافی. نیاز به ${boostCost} SOD` 
            });
        }
        
        // کسر هزینه
        gameData.sodBalance -= boostCost;
        gameData.boostActive = true;
        gameData.boostEndTime = new Date(Date.now() + 30 * 60 * 1000); // 30 دقیقه
        
        await gameData.save();
        
        // ثبت تراکنش
        await Transaction.create({
            user: req.userId,
            type: 'boost_purchase',
            amount: -boostCost,
            description: 'خرید افزایش قدرت',
            balanceAfter: gameData.sodBalance
        });
        
        res.json({
            success: true,
            message: 'قدرت استخراج ۳ برابر شد (۳۰ دقیقه)',
            boostEndTime: gameData.boostEndTime
        });
        
    } catch (error) {
        console.error('Boost Activation Error:', error);
        res.status(500).json({ error: 'خطا در فعال‌سازی بوست' });
    }
};

// دریافت پاداش USDT
exports.claimUSDT = async (req, res) => {
    try {
        const gameData = await GameData.findOne({ user: req.userId });
        
        if (!gameData) {
            return res.status(404).json({ error: 'داده بازی یافت نشد' });
        }
        
        if (gameData.usdtBalance <= 0) {
            return res.status(400).json({ error: 'موجودی USDT برای دریافت وجود ندارد' });
        }
        
        const usdtToClaim = gameData.usdtBalance;
        const sodNeeded = usdtToClaim * 1000000000; // تبدیل USDT به SOD
        
        if (gameData.sodBalance < sodNeeded) {
            return res.status(400).json({ 
                error: `موجودی SOD ناکافی. نیاز به ${sodNeeded.toLocaleString()} SOD` 
            });
        }
        
        // کسر SOD و دریافت USDT
        gameData.usdtBalance = 0;
        gameData.sodBalance -= sodNeeded;
        gameData.lastClaimTime = new Date();
        
        await gameData.save();
        
        // ثبت تراکنش‌ها
        await Transaction.create([
            {
                user: req.userId,
                type: 'usdt_claim',
                amount: usdtToClaim,
                description: 'دریافت پاداش USDT',
                balanceAfter: gameData.usdtBalance
            },
            {
                user: req.userId,
                type: 'sod_conversion',
                amount: -sodNeeded,
                description: 'تبدیل SOD به USDT',
                balanceAfter: gameData.sodBalance
            }
        ]);
        
        res.json({
            success: true,
            message: `${usdtToClaim.toFixed(4)} USDT دریافت شد`,
            usdtBalance: gameData.usdtBalance,
            sodBalance: gameData.sodBalance
        });
        
    } catch (error) {
        console.error('Claim USDT Error:', error);
        res.status(500).json({ error: 'خطا در دریافت پاداش' });
    }
};

// خرید پنل SOD
exports.buyPanel = async (req, res) => {
    try {
        const { panelId } = req.body;
        const gameData = await GameData.findOne({ user: req.userId });
        
        if (!gameData) {
            return res.status(404).json({ error: 'داده بازی یافت نشد' });
        }
        
        // پنل‌های فروش
        const panels = [
            { id: 1, price: 1, sod: 5000000, bonus: 500000 },
            { id: 2, price: 5, sod: 30000000, bonus: 3000000, popular: true },
            { id: 3, price: 15, sod: 100000000, bonus: 10000000 },
            { id: 4, price: 50, sod: 500000000, bonus: 50000000 }
        ];
        
        const panel = panels.find(p => p.id === panelId);
        if (!panel) {
            return res.status(400).json({ error: 'پنل نامعتبر' });
        }
        
        // در نسخه واقعی اینجا پرداخت بررسی می‌شود
        // فعلاً مستقیماً اضافه می‌کنیم
        
        const totalSOD = panel.sod + panel.bonus;
        gameData.sodBalance += totalSOD;
        gameData.totalMined += totalSOD;
        
        // اضافه کردن به پنل‌های خریداری شده
        gameData.purchasedPanels.push({
            panelId,
            purchaseDate: new Date(),
            amount: totalSOD
        });
        
        await gameData.save();
        
        // ثبت تراکنش
        await Transaction.create({
            user: req.userId,
            type: 'panel_purchase',
            amount: totalSOD,
            description: `خرید پنل ${panelId}`,
            balanceAfter: gameData.sodBalance
        });
        
        res.json({
            success: true,
            message: `پنل ${panelId} با موفقیت خریداری شد`,
            sodReceived: totalSOD,
            sodBalance: gameData.sodBalance
        });
        
    } catch (error) {
        console.error('Buy Panel Error:', error);
        res.status(500).json({ error: 'خطا در خرید پنل' });
    }
};

// تابع کمکی: بررسی پاداش USDT
async function checkUSDT(gameData) {
    const EXCHANGE_RATE = 10000000; // 10M SOD = 0.01 USDT
    
    if (gameData.usdtProgress >= EXCHANGE_RATE) {
        const usdtEarned = 0.01;
        
        gameData.usdtBalance += usdtEarned;
        gameData.usdtProgress -= EXCHANGE_RATE;
        gameData.lastClaimTime = new Date();
        
        // شانس ارتقاء سطح
        if (Math.random() > 0.85) {
            gameData.userLevel++;
            gameData.miningPower = 10 * gameData.userLevel;
        }
        
        // ثبت تراکنش USDT
        await Transaction.create({
            user: gameData.user,
            type: 'usdt_reward',
            amount: usdtEarned,
            description: 'پاداش استخراج USDT',
            balanceAfter: gameData.usdtBalance
        });
        
        return usdtEarned;
    }
    
    return 0;
}
