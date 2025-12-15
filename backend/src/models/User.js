
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    inviteCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralCount: {
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    registerDate: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hash password قبل از ذخیره
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// مقایسه پسورد
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// تولید کد دعوت
userSchema.pre('save', function(next) {
    if (!this.inviteCode) {
        this.inviteCode = 'INV-' + 
            Math.random().toString(36).substr(2, 4).toUpperCase() + 
            '-' + 
            this._id.toString().substr(-4).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
