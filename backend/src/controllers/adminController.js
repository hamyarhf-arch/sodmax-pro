const User = require('../models/User');
const GameData = require('../models/GameData');
const Transaction = require('../models/Transaction');

// دریافت همه کاربران
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const search = req.query.search || '';
        
        // ساخت شرط جستجو
        const searchQuery = search ? {
            $or: [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};
        
        // دریافت کاربران با اطلاعات بازی
        const users = await User.find(searchQuery)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .populate('referredBy', 'fullName email')
            .lean();
        
        // اضافه کردن اطلاعات بازی هر کاربر
        for (let user of users) {
            const gameData = await GameData.findOne({ user: user._id }).lean();
            user.gameData = gameData || {};
        }
        
        // تعداد کل کاربران
        const total = await User.countDocuments(searchQuery);
        
        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ error: 'خطا در دریافت کاربران' });
    }
};

// آمار کلی سیستم
exports.getSystemStats = async (req, res) => {
    try {
        // تعداد کاربران
        const totalUsers = await User.countDocuments();
        const todayUsers = await User.countDocuments({
            registerDate: { $gte: new Date().setHours(0, 0, 0, 0) }
        });
        
        // آمار مالی
        const allGameData = await GameData.find().lean();
        
        const totalSOD = allGameData.reduce((sum, g) => sum + (g.sodBalance || 0), 0);
        const totalUSDT = allGameData.reduce((sum, g) => sum + (g.usdtBalance || 0), 0);
        const totalMined = allGameData.reduce((sum, g) => sum + (g.totalMined || 0), 0);
        const todayEarnings = allGameData.reduce((sum, g) => sum + (g.todayEarnings || 0), 0);
        
        // تراکنش‌های امروز
        const todayTransactions = await Transaction.countDocuments({
            createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        });
        
        // ۱۰ کاربر برتر
        const topUsers = await GameData.find()
            .populate('user', 'fullName email')
            .sort({ totalMined: -1 })
            .limit(10)
            .lean();
        
        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    today: todayUsers,
                    active: totalUsers // می‌تواند با lastLogin محاسبه شود
                },
                financial: {
                    totalSOD,
                    totalUSDT: totalUSDT.toFixed(4),
                    totalMined,
                    todayEarnings
                },
                transactions: {
                    today: todayTransactions
                },
                topUsers: topUsers.map(item => ({
                    user: item.user,
                    totalMined: item.totalMined,
                    level: item.userLevel
                }))
            }
        });
        
    } catch (error) {
        console.error('Get System Stats Error:', error);
        res.status(500).json({ error: 'خطا در دریافت آمار' });
    }
};

// ویرایش کاربر
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        
        // پیدا کردن کاربر
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'کاربر یافت نشد' });
        }
        
        // آپدیت کاربر
        if (updates.fullName) user.fullName = updates.fullName;
        if (updates.email) user.email = updates.email;
        if (updates.isAdmin !== undefined) user.isAdmin = updates.isAdmin;
        
        await user.save();
        
        // آپدیت اطلاعات بازی
        if (updates.gameData) {
            await GameData.findOneAndUpdate(
                { user: userId },
                { $set: updates.gameData },
                { new: true, upsert: true }
            );
        }
        
        res.json({
            success: true,
            message: 'کاربر با موفقیت آپدیت شد',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
        
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ error: 'خطا در آپدیت کاربر' });
    }
};

// حذف کاربر
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // پیدا کردن کاربر
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'کاربر یافت نشد' });
        }
        
        // حذف اطلاعات مرتبط
        await Promise.all([
            User.findByIdAndDelete(userId),
            GameData.findOneAndDelete({ user: userId }),
            Transaction.deleteMany({ user: userId })
        ]);
        
        res.json({
            success: true,
            message: 'کاربر و تمام اطلاعات مرتبط حذف شدند'
        });
        
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ error: 'خطا در حذف کاربر' });
    }
};

// افزودن SOD به کاربر
exports.addSOD = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, description } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'مقدار نامعتبر' });
        }
        
        // آپدیت اطلاعات بازی
        const gameData = await GameData.findOneAndUpdate(
            { user: userId },
            { 
                $inc: { 
                    sodBalance: amount,
                    totalMined: amount 
                } 
            },
            { new: true }
        );
        
        if (!gameData) {
            return res.status(404).json({ error: 'کاربر یافت نشد' });
        }
        
        // ثبت تراکنش
        await Transaction.create({
            user: userId,
            type: 'admin_add',
            amount: amount,
            description: description || 'افزایش موجودی توسط ادمین',
            balanceAfter: gameData.sodBalance,
            adminAction: true
        });
        
        res.json({
            success: true,
            message: `${amount.toLocaleString()} SOD به کاربر اضافه شد`,
            newBalance: gameData.sodBalance
        });
        
    } catch (error) {
        console.error('Add SOD Error:', error);
        res.status(500).json({ error: 'خطا در افزودن SOD' });
    }
};

// ریست اطلاعات بازی
exports.resetGameData = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const gameData = await GameData.findOneAndUpdate(
            { user: userId },
            {
                sodBalance: 1000000,
                usdtBalance: 0,
                userLevel: 1,
                miningPower: 10,
                totalMined: 1000000,
                todayEarnings: 0,
                usdtProgress: 1000000,
                autoMining: false,
                boostActive: false,
                purchasedPanels: []
            },
            { new: true }
        );
        
        if (!gameData) {
            return res.status(404).json({ error: 'کاربر یافت نشد' });
        }
        
        res.json({
            success: true,
            message: 'اطلاعات بازی ریست شد',
            gameData
        });
        
    } catch (error) {
        console.error('Reset Game Data Error:', error);
        res.status(500).json({ error: 'خطا در ریست اطلاعات' });
    }
};
