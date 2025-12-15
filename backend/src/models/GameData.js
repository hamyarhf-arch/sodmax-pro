
const mongoose = require('mongoose');

const gameDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    sodBalance: {
        type: Number,
        default: 1000000 // هدیه ثبت نام
    },
    usdtBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    userLevel: {
        type: Number,
        default: 1,
        min: 1,
        max: 100
    },
    miningPower: {
        type: Number,
        default: 10
    },
    totalMined: {
        type: Number,
        default: 1000000 // هدیه ثبت نام
    },
    todayEarnings: {
        type: Number,
        default: 0
    },
    usdtProgress: {
        type: Number,
        default: 1000000 // پیشرفت برای USDT بعدی
    },
    autoMining: {
        type: Boolean,
        default: false
    },
    boostActive: {
        type: Boolean,
        default: false
    },
    boostEndTime: {
        type: Date
    },
    lastClaimTime: {
        type: Date
    },
    // پنل‌های خریداری شده
    purchasedPanels: [{
        panelId: Number,
        purchaseDate: Date,
        amount: Number
    }],
    // آمار روزانه
    dailyStats: [{
        date: Date,
        mined: Number,
        clicks: Number,
        missions: Number
    }]
}, {
    timestamps: true
});

// Index برای جستجوی سریع
gameDataSchema.index({ user: 1 });
gameDataSchema.index({ totalMined: -1 });
gameDataSchema.index({ 'dailyStats.date': -1 });

module.exports = mongoose.model('GameData', gameDataSchema);
