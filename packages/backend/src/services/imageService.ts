import { ImmersionConfig } from '../types/index.js'

// 图片生成API配置
const IMAGE_PROVIDERS = {
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    model: 'image-01',
    generate: async (apiKey: string, prompt: string, size: string = '16:9') => {
      const response = await fetch('https://api.minimax.chat/v1/image_generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'image-01',
          prompt,
          image_size: size,
          number: 1
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`MiniMax image API error: ${response.status} - ${errorData.base_resp?.status_msg || errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      // MiniMax返回image_urls数组
      return data.data?.image_urls?.[0] || null
    }
  },
  wanxi: {
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    model: 'wanx2.1',
    generate: async (apiKey: string, prompt: string) => {
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'wanx2.1',
          input: { prompt },
          parameters: { size: '1024*1024' }
        })
      })

      if (!response.ok) {
        throw new Error(`Wanxi image API error: ${response.status}`)
      }

      const data = await response.json()
      return data.output?.image_url || null
    }
  },
  dalle: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'dall-e-3',
    generate: async (apiKey: string, prompt: string) => {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          size: '1024x1024',
          n: 1
        })
      })

      if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data?.[0]?.url || null
    }
  }
}

export type ImageProvider = 'minimax' | 'wanxi' | 'dalle'

interface ImageGenerationResult {
  success: boolean
  imageUrl?: string
  fallbackText?: string
  errorType?: 'timeout' | 'content_rejected' | 'rate_limit' | 'unknown'
}

// 生成案发现场图
export async function generateSceneImage(
  sceneDescription: string,
  config: ImmersionConfig
): Promise<ImageGenerationResult> {
  const prompt = `侦探推理游戏案发现场：${sceneDescription}，逼真细节，电影质感，暗色调，悬疑氛围，推理风格`

  try {
    const imageUrl = await generateImageWithProvider(prompt, config, 'scene')
    return { success: true, imageUrl: imageUrl || undefined }
  } catch (error: any) {
    console.error('Scene image generation failed:', error.message)
    return createFallbackResult(error.message)
  }
}

// 生成嫌疑人画像
export async function generateSuspectPortrait(
  suspect: { name: string, age: number, occupation: string, relationToVictim: string },
  config: ImmersionConfig
): Promise<ImageGenerationResult> {
  const prompt = `侦探游戏嫌疑人肖像：${suspect.name}，${suspect.age}岁，职业${suspect.occupation}，与死者关系${suspect.relationToVictim}，逼真人物画像，悬疑风格，清晰的五官`

  try {
    const imageUrl = await generateImageWithProvider(prompt, config, 'suspect')
    return { success: true, imageUrl: imageUrl || undefined }
  } catch (error: any) {
    console.error('Suspect portrait generation failed:', error.message)
    return createFallbackResult(error.message)
  }
}

// 生成线索物品图
export async function generateClueImage(
  clueDescription: string,
  clueLocation: string,
  config: ImmersionConfig
): Promise<ImageGenerationResult> {
  const prompt = `侦探游戏线索物品：${clueDescription}，发现于${clueLocation}，逼真细节，悬疑氛围，推理风格`

  try {
    const imageUrl = await generateImageWithProvider(prompt, config, 'clue')
    return { success: true, imageUrl: imageUrl || undefined }
  } catch (error: any) {
    console.error('Clue image generation failed:', error.message)
    return createFallbackResult(error.message)
  }
}

// 统一图片生成函数
async function generateImageWithProvider(
  prompt: string,
  config: ImmersionConfig,
  _imageType: 'scene' | 'suspect' | 'clue'
): Promise<string | null> {
  let apiKey: string
  let provider: ImageProvider

  if (config.modelMode === 'unified' && config.unifiedApiKey) {
    // 统一模式：使用全模态模型（如MiniMax）
    apiKey = config.unifiedApiKey
    provider = 'minimax' // 默认使用MiniMax
  } else if (config.imageApiKey && config.imageProvider) {
    apiKey = config.imageApiKey
    provider = config.imageProvider as ImageProvider
  } else {
    throw new Error('未配置图片生成API')
  }

  const providerConfig = IMAGE_PROVIDERS[provider]
  if (!providerConfig) {
    throw new Error(`不支持的图片提供商: ${provider}`)
  }

  // 超时控制（60秒）
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Image generation timeout')), 60000)
  })

  const generationPromise = providerConfig.generate(apiKey, prompt)

  return await Promise.race([generationPromise, timeoutPromise]) as string | null
}

// 创建降级结果
function createFallbackResult(errorMessage: string): ImageGenerationResult {
  if (errorMessage.includes('timeout')) {
    return { success: false, fallbackText: '图片生成超时，已使用占位图', errorType: 'timeout' }
  }
  if (errorMessage.includes('content') || errorMessage.includes('reject') || errorMessage.includes('审核')) {
    return { success: false, fallbackText: '图片内容被审核过滤，已使用占位图', errorType: 'content_rejected' }
  }
  if (errorMessage.includes('429') || errorMessage.includes('rate') || errorMessage.includes('529')) {
    return { success: false, fallbackText: '服务器繁忙，图片生成失败，已使用占位图', errorType: 'rate_limit' }
  }
  return { success: false, fallbackText: '图片生成失败，已使用占位图', errorType: 'unknown' }
}

// 生成占位图SVG（用于降级情况）
export function generatePlaceholderSVG(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect fill="#1e293b" width="400" height="300"/>
    <text x="200" y="140" text-anchor="middle" fill="#94a3b8" font-size="16" font-family="sans-serif">${text}</text>
    <text x="200" y="170" text-anchor="middle" fill="#64748b" font-size="12" font-family="sans-serif">侦探游戏</text>
    <circle cx="200" cy="200" r="30" fill="none" stroke="#475569" stroke-width="2"/>
    <line x1="180" y1="180" x2="220" y2="220" stroke="#475569" stroke-width="2"/>
    <line x1="220" y1="180" x2="180" y2="220" stroke="#475569" stroke-width="2"/>
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}