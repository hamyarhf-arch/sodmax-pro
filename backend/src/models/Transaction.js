const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'mining',
            'boost_purchase',
            'panel_purchase',
            'usdt_reward',
            'usdt_claim',
            'sod_conversion',
            'admin_add',
            'referral_bonus'
        ],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    balanceAfter: {
        type: Number
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    adminAction: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index برای جستجوی سریع
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
