// 宠物生成页面逻辑
class PetCreator {
    constructor() {
        this.petDescription = '';
        this.petImageUrl = '';
        this.init();
    }

    async init() {
        // 等待服务加载
        await this.waitForServices();
        
        // 初始化背景音乐
        this.initBackgroundMusic();
        
        // 检查用户是否已有宠物
        await this.checkExistingPet();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('✅ 宠物生成器初始化完成');
    }

    async waitForServices() {
        let attempts = 0;
        while ((!window.MagicPetAI || !window.MagicPetAPI) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.MagicPetAI || !window.MagicPetAPI) {
            console.error('服务加载失败');
        }
    }

    initBackgroundMusic() {
        const bgMusic = document.getElementById('bgMusic');
        if (!bgMusic) return;

        bgMusic.volume = 0.3;

        const playMusic = () => {
            bgMusic.play().catch(error => {
                console.log('背景音乐需要用户交互后才能播放');
            });
        };

        playMusic();

        document.addEventListener('click', () => playMusic(), { once: true });
        document.addEventListener('touchstart', () => playMusic(), { once: true });
    }

    async checkExistingPet() {
        try {
            // 检查用户是否已登录
            if (!window.MagicPetAPI || !window.MagicPetAPI.Auth) {
                console.error('MagicPetAPI 未加载');
                // 延迟跳转，给服务更多加载时间
                setTimeout(() => {
                    if (!window.MagicPetAPI || !window.MagicPetAPI.Auth) {
                        window.location.href = 'auth.html';
                    }
                }, 1000);
                return;
            }
            
            const user = await window.MagicPetAPI.Auth.getCurrentUser();
            console.log('当前用户:', user);
            
            if (!user) {
                // 未登录，延迟跳转以确保session已同步
                console.log('未检测到登录用户，延迟后再次检查...');
                
                // 等待1秒后再次检查
                await new Promise(resolve => setTimeout(resolve, 1000));
                const userRetry = await window.MagicPetAPI.Auth.getCurrentUser();
                
                if (!userRetry) {
                    console.log('确认未登录，跳转到登录页');
                    window.location.href = 'auth.html';
                }
                return;
            }

            console.log('用户已登录:', user.email);
            // 检查用户是否已有宠物（从数据库查询）
            // TODO: 实现查询逻辑
        } catch (error) {
            console.error('检查宠物状态失败:', error);
            // 不要立即跳转，可能是临时错误
            console.log('发生错误，但允许继续访问页面');
        }
    }

    bindEvents() {
        // 语音按钮
        const voiceButton = document.getElementById('voiceButton');
        if (voiceButton) {
            voiceButton.addEventListener('click', () => this.handleVoiceInput());
        }

        // 生成按钮
        const generateButton = document.getElementById('generateButton');
        if (generateButton) {
            generateButton.addEventListener('click', () => this.handleGenerate());
        }

        // 跳过按钮
        const skipButton = document.getElementById('skipButton');
        if (skipButton) {
            skipButton.addEventListener('click', () => this.handleSkip());
        }
    }

    async handleVoiceInput() {
        const voiceButton = document.getElementById('voiceButton');
        const descriptionText = document.getElementById('descriptionText');

        try {
            // 检查浏览器支持
            if (!window.MagicPetAI.isSpeechSupported()) {
                alert('⚠️ Your browser does not support voice recognition. Please try Chrome or Edge.');
                return;
            }

            // 更新按钮状态
            voiceButton.classList.add('listening');
            voiceButton.querySelector('.button-text').textContent = 'Listening...';
            descriptionText.textContent = 'Listening... Describe your pet now!';
            descriptionText.classList.add('empty');

            // 开始语音识别
            const result = await window.MagicPetAI.startListening();

            if (result.success && result.text) {
                this.petDescription = result.text;
                descriptionText.textContent = result.text;
                descriptionText.classList.remove('empty');

                // 显示生成按钮
                const generateButton = document.getElementById('generateButton');
                generateButton.classList.remove('hidden');

                this.showMessage('✅ Great! Now click "Generate My Pet" to create it!', 'success');
            }
        } catch (error) {
            console.error('语音识别错误:', error);
            descriptionText.textContent = 'Press the button and describe your pet...';
            descriptionText.classList.add('empty');
            
            if (error.message === 'no-speech') {
                this.showMessage('⚠️ No speech detected. Please try again!', 'error');
            } else {
                this.showMessage('❌ Voice recognition failed. Please try again.', 'error');
            }
        } finally {
            // 恢复按钮状态
            voiceButton.classList.remove('listening');
            voiceButton.querySelector('.button-text').textContent = 'Describe Your Pet';
        }
    }

    async handleGenerate() {
        if (!this.petDescription) {
            this.showMessage('⚠️ Please describe your pet first!', 'error');
            return;
        }

        // 显示加载状态
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.remove('hidden');

        try {
            // 这里调用 AI 生成图片
            // 由于需要 OpenAI DALL-E API，暂时使用占位符
            await this.generatePetImage(this.petDescription);

            // 保存宠物信息到数据库
            await this.savePetToDatabase();

            // 跳转到主页
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            console.error('生成宠物失败:', error);
            this.showMessage('❌ Failed to create pet. Please try again.', 'error');
            loadingOverlay.classList.add('hidden');
        }
    }

    async generatePetImage(description) {
        // 模拟生成过程
        await new Promise(resolve => setTimeout(resolve, 2000));

        // TODO: 集成 DALL-E API 或其他图片生成服务
        // 目前使用渐变色作为占位符
        const petPreview = document.getElementById('petPreview');
        petPreview.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="font-size: 80px;">🎨</div>
                <p style="color: white; font-size: 14px; margin-top: 10px; text-align: center; padding: 0 20px;">
                    ${description}
                </p>
            </div>
        `;

        this.petImageUrl = 'placeholder'; // 实际应该是生成的图片 URL
    }

    async savePetToDatabase() {
        try {
            const user = await window.MagicPetAPI.Auth.getCurrentUser();
            if (!user) return;

            // TODO: 保存宠物信息到 Supabase
            // 需要创建一个 pets 表
            console.log('保存宠物信息:', {
                userId: user.id,
                description: this.petDescription,
                imageUrl: this.petImageUrl
            });
        } catch (error) {
            console.error('保存宠物失败:', error);
        }
    }

    handleSkip() {
        // 使用默认宠物，直接跳转
        if (confirm('Skip creating a custom pet and use the default one?')) {
            window.location.href = 'index.html';
        }
    }

    showMessage(text, type = 'info') {
        // 简单的消息提示
        const hint = document.querySelector('.hint-text');
        if (hint) {
            hint.textContent = text;
            hint.style.color = type === 'error' ? '#C62828' : type === 'success' ? '#2E7D32' : '#9E9E47';
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.petCreator = new PetCreator();
});
