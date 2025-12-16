// database-manager.js
class DatabaseManager {
    constructor() {
        this.userData = null;
        this.gameData = null;
    }

    async init() {
        try {
            const user = await SupabaseAPI.getCurrentUser();
            if (user) {
                await this.loadUserData(user.id);
            }
            console.log('✅ DatabaseManager راه‌اندازی شد.');
            return true;
        } catch (error) {
            console.error('خطا در راه‌اندازی:', error);
            return false;
        }
    }

    async loadUserData(userId) {
        try {
            const gameData = await SupabaseAPI.getUserGameData(userId);
            this.gameData = {
                sodBalance: gameData?.sod_balance || 0,
                usdtBalance: gameData?.usdt_balance || 0
            };
            return true;
        } catch (error) {
            console.error('خطا در بارگذاری اطلاعات:', error);
            return false;
        }
    }

    async processMiningClick() {
        if (!this.userData) {
            alert('لطفا ابتدا وارد شوید.');
            return false;
        }
        const user = await SupabaseAPI.getCurrentUser();
        const amount = 100; // مقدار SOD هر کلیک
        const result = await SupabaseAPI.recordMining(user.id, amount);

        if (result.success) {
            this.gameData.sodBalance = result.newBalance;
            return true;
        }
        return false;
    }

    getSODBalance() {
        return this.gameData?.sodBalance || 0;
    }

    getUSDTBalance() {
        return this.gameData?.usdtBalance || 0;
    }
}

// ایجاد یک نمونه از کلاس برای استفاده در کل پروژه
window.DB = new DatabaseManager();
