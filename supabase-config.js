// supabase-config.js
// این اطلاعات را از پنل Supabase خود دریافت کنید
const SUPABASE_URL = 'https://vlulmfsqlfdooqwpmzdj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdWxtZnNxbGZkb29xd3BtemRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTE4MTEsImV4cCI6MjA4MTYyNzgxMX0.qASXAyRGzydl1_DiJngYxk-NG3_1w6zd8gutJdxqJEk';

// ارتباط با Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized');
