// supabase-config.js
const SUPABASE_URL = 'https://zoqsgvgbmxrkemcwxwus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcXNndmdibXhya2VtY3d4d3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODc5NTAsImV4cCI6MjA4MTM2Mzk1MH0.Nj2xXSphPHXROxaVf_hYw_iqFgnXU1r-GzFHMet9YMk';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcXNndmdibXhya2VtY3d4d3VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc4Nzk1MCwiZXhwIjoyMDgxMzYzOTUwfQ.hxIxYP66EhjZyjU_DYquUjci_qYmCATNFkwA3s22ZJU';

// کلاینت اصلی برای کاربران عادی
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
});

// کلاینت مخصوص ادمین (فقط در پنل مدیریت استفاده شود)
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ==================== توابع اصلی ====================

// تابع ثبت‌نام کاربر جدید
async function signUpUser(email, password, fullName) {
    try {
        // 1. ثبت نام در سیستم احراز هویت
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: fullName } }
        });
        if (authError) throw authError;

        // 2. ایجاد رکورد کاربر در جدول 'users'
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert([{
                id: authData.user.id,
                email: email,
                full_name: fullName,
                referral_code: 'REF-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                is_admin: email === 'hamyarhf@gmail.com',
                created_at: new Date().toISOString()
            }]);
        if (dbError) throw dbError;

        // 3. ایجاد اطلاعات اولیه بازی
        await setupUserGameData(authData.user.id);

        console.log('✅ ثبت‌نام موفق:', email);
        return { success: true, user: authData.user };

    } catch (error) {
        console.error('❌ خطا در ثبت‌نام:', error.message);
        return { success: false, error: error.message };
    }
}

// تابع ایجاد اطلاعات اولیه بازی برای کاربر جدید
async function setupUserGameData(userId) {
    try {
        const promises = [];

        // ایجاد پروفایل بازی
        promises.push(
            supabaseAdmin.from('user_profiles').insert([{
                user_id: userId,
                user_level: 1,
                mining_power: 10,
                total_mined: 1000000,
                last_active: new Date().toISOString()
            }])
        );

        // ایجاد موجودی
        promises.push(
            supabaseAdmin.from('user_balances').insert([{
                user_id: userId,
                sod_balance: 1000000,
                usdt_balance: 0,
                last_update: new Date().toISOString()
            }])
        );

        // ثبت تراکنش هدیه
        promises.push(
            supabaseAdmin.from('transactions').insert([{
                user_id: userId,
                transaction_type: 'registration_bonus',
                amount: 1000000,
                currency: 'SOD',
                description: 'هدیه ثبت‌نام',
                created_at: new Date().toISOString()
            }])
        );

        await Promise.all(promises);
        return { success: true };

    } catch (error) {
        console.error('خطا در ایجاد اطلاعات بازی:', error);
        return { success: false, error: error.message };
    }
}

// تابع ورود کاربر
async function signInUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: 'ایمیل یا رمز عبور نادرست است' };
    return { success: true, user: data.user };
}

// تابع دریافت کاربر جاری
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// تابع ثبت استخراج
async function recordMining(userId, amount) {
    try {
        // آپدیت موجودی SOD
        const { data: balance } = await supabase
            .from('user_balances')
            .select('sod_balance')
            .eq('user_id', userId)
            .single();

        const newBalance = balance.sod_balance + amount;

        await supabase
            .from('user_balances')
            .update({ sod_balance: newBalance })
            .eq('user_id', userId);

        // ثبت تراکنش
        await supabase.from('transactions').insert([{
            user_id: userId,
            transaction_type: 'mining',
            amount: amount,
            currency: 'SOD',
            description: 'استخراج دستی',
            created_at: new Date().toISOString()
        }]);

        return { success: true, newBalance };

    } catch (error) {
        console.error('خطا در ثبت استخراج:', error);
        return { success: false, error: error.message };
    }
}

// تابع دریافت اطلاعات کاربر
async function getUserGameData(userId) {
    try {
        const { data, error } = await supabase
            .from('user_balances')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('خطا در دریافت اطلاعات:', error);
        return null;
    }
}

// صادر کردن توابع برای استفاده در صفحات
window.SupabaseAPI = {
    supabase,
    supabaseAdmin,
    signUpUser,
    signInUser,
    getCurrentUser,
    recordMining,
    getUserGameData
};

console.log('✅ فایل SupabaseConfig بارگذاری شد.');
