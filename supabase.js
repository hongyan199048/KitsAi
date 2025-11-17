// Supabase 配置文件
const SUPABASE_CONFIG = {
    // Supabase 项目 URL
    url: 'https://iywvxudcatsvgqspnwsm.supabase.co',
    // Supabase 公开密钥
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5d3Z4dWRjYXRzdmdxc3Bud3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTM4NDksImV4cCI6MjA3ODI2OTg0OX0.xjaG063SbU5CQRL3QKmFMwRgaHj6mTmJTNfO-_BFD7A'
};

// 初始化 Supabase 客户端
let supabase = null;

// 加载 Supabase SDK 并初始化
async function initSupabase() {
    // 动态加载 Supabase SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = async () => {
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase 初始化成功');
        
        // 诊断：测试数据库连接和表状态
        await diagnoseSupabase();
    };
    script.onerror = (error) => {
        console.error('❌ Supabase SDK 加载失败:', error);
    };
    document.head.appendChild(script);
}

// Supabase 诊断函数
async function diagnoseSupabase() {
    console.log('🔍 Supabase 诊断开始...');
    console.log('📊 配置信息:', {
        url: SUPABASE_CONFIG.url,
        anonKey: SUPABASE_CONFIG.anonKey ? '已配置' : '未配置'
    });
    
    try {
        // 测试认证状态
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('🔐 认证状态:', user ? `已登录 (${user.email})` : '未登录');
        
        if (authError) {
            console.error('❌ 认证测试失败:', authError);
        }
        
        // 测试数据库表访问（学习记录表）
        const { data: records, error: recordsError } = await supabase
            .from('learning_records')
            .select('*')
            .limit(1);
            
        if (recordsError) {
            console.error('❌ learning_records 表访问失败:', recordsError);
        } else {
            console.log('✅ learning_records 表访问成功，记录数:', records?.length || 0);
        }
        
        // 测试用户进度表访问
        const { data: progress, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .limit(1);
            
        if (progressError) {
            console.error('❌ user_progress 表访问失败:', progressError);
        } else {
            console.log('✅ user_progress 表访问成功，记录数:', progress?.length || 0);
        }
        
        console.log('🔍 Supabase 诊断完成');
        
    } catch (error) {
        console.error('❌ Supabase 诊断过程中发生错误:', error);
    }
}

// 用户认证相关功能
const Auth = {
    // 用户注册
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 用户登录
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 用户登出
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('登出失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 获取当前用户
    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('获取用户失败:', error);
            return null;
        }
    }
};

// 数据库操作
const Database = {
    // 保存学习记录
    async saveLearningRecord(word, score) {
        try {
            const user = await Auth.getCurrentUser();
            if (!user) throw new Error('用户未登录');

            const { data, error } = await supabase
                .from('learning_records')
                .insert([
                    {
                        user_id: user.id,
                        word: word,
                        score: score,
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('保存学习记录失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 获取学习记录
    async getLearningRecords(limit = 10) {
        try {
            const user = await Auth.getCurrentUser();
            if (!user) throw new Error('用户未登录');

            const { data, error } = await supabase
                .from('learning_records')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('获取学习记录失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 获取学习进度
    async getProgress() {
        try {
            const user = await Auth.getCurrentUser();
            if (!user) throw new Error('用户未登录');

            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('获取进度失败:', error);
            return { success: false, error: error.message };
        }
    },

    // 更新学习进度
    async updateProgress(wordsLearned, totalScore) {
        try {
            const user = await Auth.getCurrentUser();
            if (!user) throw new Error('用户未登录');

            const { data, error } = await supabase
                .from('user_progress')
                .upsert({
                    user_id: user.id,
                    words_learned: wordsLearned,
                    total_score: totalScore,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('更新进度失败:', error);
            return { success: false, error: error.message };
        }
    }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});

// 导出 API
window.MagicPetAPI = {
    Auth,
    Database
};
