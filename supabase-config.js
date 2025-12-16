// supabase-config.js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'; // جایگزین کنید
const SUPABASE_PUBLISHABLE_KEY = 'YOUR_PUBLISHABLE_KEY'; // جایگزین کنید

// راه‌اندازی کلاینت Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true }
});

// تابع برای ثبت‌نام کاربر جدید در دیتابیس
async function signUpUser(email, password, fullName) {
    try {
        // 1. ثبت نام در سیستم احراز هویت
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: fullName }
            }
        });
        if (authError) throw authError;

        // 2. ذخیره اطلاعات اضافی در جدول 'users' (نیاز به ساخت جدول دارد - مرحله بعدی)
        const { error: dbError } = await supabase
            .from('users')
            .insert([
                {
                    id: authData.user.id, // آی‌دی یکسان با احراز هویت
                    email: email,
                    full_name: fullName,
                    created_at: new Date().toISOString()
                }
            ]);
        if (dbError) throw dbError;

        console.log('✅ کاربر با موفقیت ثبت شد:', email);
        return { success: true, user: authData.user };

    } catch (error) {
        console.error('❌ خطا در ثبت‌نام:', error.message);
        return { success: false, error: error.message };
    }
}

// تابع برای ورود کاربر
async function signInUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    if (error) {
        console.error('خطا در ورود:', error.message);
        return { success: false, error: error.message };
    }
    console.log('✅ کاربر وارد شد:', data.user.email);
    return { success: true, user: data.user };
}

// تابع برای بررسی وضعیت لاگین کاربر
async function getCurrentSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
        return null;
    }
    return data.session;
}

// صادر کردن توابع برای استفاده در جاهای دیگر
window.SupabaseAuth = {
    supabase,
    signUpUser,
    signInUser,
    getCurrentSession
};
