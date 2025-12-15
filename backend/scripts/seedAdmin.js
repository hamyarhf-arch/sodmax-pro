require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const GameData = require('../src/models/GameData');

async function seedAdmin() {
    try {
        // اتصال به دیتابیس
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // بررسی وجود ادمین
        const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
            process.exit(0);
        }
        
        // ساخت ادمین
        const admin = new User({
            fullName: 'مدیر سیستم',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            isAdmin: true,
            inviteCode: 'ADMIN-' + Math.random().toString(36).substr(2, 6).toUpperCase()
        });
        
        await admin.save();
        console.log('✅ Admin user created:', admin.email);
        
        // ساخت اطلاعات بازی برای ادمین
        const gameData = new GameData({
            user: admin._id,
            sodBalance: 10000000,
            usdtBalance: 1,
            userLevel: 10,
            miningPower: 100,
            totalMined: 100000000
        });
        
        await gameData.save();
        console.log('✅ Admin game data created');
        
        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedAdmin();
