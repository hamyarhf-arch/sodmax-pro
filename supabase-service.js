// supabase-service.js
// سرویس‌های ارتباط با دیتابیس Supabase

class SupabaseService {
    constructor() {
        this.client = supabaseClient;
    }

    // ==================== کاربران ====================
    async getUser(email) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('خطا در دریافت کاربر:', error);
            return null;
        }
    }

    async createUser(userData) {
        try {
            const { data, error } = await this.client
                .from('users')
                .insert([{
                    email: userData.email,
                    name: userData.name,
                    sod_balance: 1000000, // هدیه ثبت نام
                    usdt_balance: 0,
                    level: 1,
                    referral_code: this.generateReferralCode(),
                    created_at: new Date().toISOString()
                }]);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('خطا در ایجاد کاربر:', error);
            return null;
        }
    }

    async updateUser(email, updates) {
        try {
            const { data, error } = await this.client
                .from('users')
                .update(updates)
                .eq('email', email);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('خطا در بروزرسانی کاربر:', error);
            return null;
        }
    }

    // ==================== داده‌های بازی ====================
    async getGameData(email) {
        try {
            const { data, error } = await this.client
                .from('game_data')
                .select('*')
                .eq('user_email', email)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('خطا در دریافت داده بازی:', error);
            return null;
        }
    }

    async saveGameData(email, gameData) {
        try {
            // بررسی وجود رکورد
            const existing = await this.getGameData(email);
            
            if (existing) {
                // بروزرسانی
                const { data, error } = await this.client
                    .from('game_data')
                    .update({
                        total_clicks: gameData.totalClicks,
                        sod_per_click: gameData.sodPerClick,
                        last_click_time: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_email', email);
                
                if (error) throw error;
                return data;
            } else {
                // ایجاد جدید
                const { data, error } = await this.client
                    .from('game_data')
                    .insert([{
                        user_email: email,
                        total_clicks: gameData.totalClicks || 0,
                        sod_per_click: gameData.sodPerClick || 1,
                        last_click_time: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    }]);
                
                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('خطا در ذخیره داده بازی:', error);
            return null;
        }
    }

    // ==================== تراکنش‌ها ====================
    async logTransaction(email, type, amount, details) {
        try {
            const { data, error } = await this.client
                .from('transactions')
                .insert([{
                    user_email: email,
                    type: type, // 'click', 'reward', 'withdrawal', 'purchase'
                    amount: amount,
                    details: details || {},
                    created_at: new Date().toISOString()
                }]);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('خطا در ثبت تراکنش:', error);
            return null;
        }
    }

    // ==================== توابع کمکی ====================
    generateReferralCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async getAllUsers() {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('خطا در دریافت همه کاربران:', error);
            return [];
        }
    }

    // ==================== همگام‌سازی با localStorage (موقت) ====================
    async syncFromLocalStorage() {
        try {
            // همگام‌سازی کاربران
            const oldUsers = JSON.parse(localStorage.getItem('sodmaxUserData') || '[]');
            
            for (const user of oldUsers) {
                const existing = await this.getUser(user.email);
                if (!existing) {
                    await this.createUser(user);
                }
            }
            
            console.log('همگام‌سازی با Supabase کامل شد');
            return true;
        } catch (error) {
            console.error('خطا در همگام‌سازی:', error);
            return false;
        }
    }
}

// ایجاد نمونه سرویس
const supabaseService = new SupabaseService();

// در دسترس قرار دادن برای استفاده در فایل‌های دیگر
if (typeof window !== 'undefined') {
    window.supabaseService = supabaseService;
}

console.log('Supabase service loaded');
