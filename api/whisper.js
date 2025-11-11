// Vercel Serverless Function - Whisper API 代理
// 用于安全地调用 OpenAI Whisper API，不暴露 API Key

export const config = {
    api: {
        bodyParser: false, // 需要处理文件上传
    },
};

export default async function handler(req, res) {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 从环境变量获取 API Key（安全）
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // 获取请求体（音频数据）
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // 转发请求到 OpenAI Whisper API
        const formData = new FormData();
        const audioBlob = new Blob([buffer], { type: 'audio/webm' });
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        
        // 从查询参数获取可选配置
        const { language, prompt, temperature, response_format } = req.query;
        
        if (language && language !== 'auto') {
            formData.append('language', language);
        }
        if (prompt) {
            formData.append('prompt', prompt);
        }
        if (temperature) {
            formData.append('temperature', temperature);
        }
        if (response_format) {
            formData.append('response_format', response_format);
        }

        // 调用 OpenAI API
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ 
                error: error.error?.message || 'Whisper API error' 
            });
        }

        const result = await response.json();
        
        // 返回结果
        return res.status(200).json(result);

    } catch (error) {
        console.error('Whisper proxy error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
