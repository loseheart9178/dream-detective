import { ImmersionConfig } from '../types/index.js'

// TTS提供商配置
const TTS_PROVIDERS = {
  minimax: {
    baseUrl: 'https://api.minimax.io/v1',
    models: ['speech-2.8-hd', 'speech-2.8-turbo'],
    synthesize: async (apiKey: string, text: string, voice: string = 'male-qnq') => {
      // MiniMax TTS API
      const response = await fetch('https://api.minimax.io/v1/t2a_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'speech-2.8-hd',
          text,
          voice_setting: {
            voice_id: voice,
            speed: 1.0,
            volume: 1.0,
            pitch: 0
          },
          audio_setting: {
            audio_format: 'mp3',
            sample_rate: 32000,
            bitrate: 128000
          }
        })
      })

      if (!response.ok) {
        throw new Error(`MiniMax TTS API error: ${response.status}`)
      }

      const data = await response.json()
      // 返回音频URL或base64
      return data.audio_url || data.data?.audio_url || null
    }
  },
  aliyun: {
    baseUrl: 'https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts',
    synthesize: async (apiKey: string, text: string, voice: string = 'aixia') => {
      // 阿里云TTS
      const response = await fetch('https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          voice,
          text,
          speech_rate: 0,
          pitch_rate: 0,
          volume: 50
        })
      })

      if (!response.ok) {
        throw new Error(`Aliyun TTS API error: ${response.status}`)
      }

      // 阿里云返回的是二进制音频数据
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return `data:audio/mp3;base64,${base64}`
    }
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    synthesize: async (apiKey: string, text: string, voice: string = 'alloy') => {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.status}`)
      }

      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return `data:audio/mp3;base64,${base64}`
    }
  }
}

export type TTSProvider = 'minimax' | 'aliyun' | 'openai'

interface TTSResult {
  success: boolean
  audioUrl?: string
  fallbackText?: string
  errorType?: 'timeout' | 'service_unavailable' | 'rate_limit' | 'unknown'
}

// 合成语音
export async function synthesizeSpeech(
  text: string,
  config: ImmersionConfig,
  voice?: string
): Promise<TTSResult> {
  try {
    const audioUrl = await synthesizeWithProvider(text, config, voice)
    return { success: true, audioUrl }
  } catch (error: any) {
    console.error('TTS synthesis failed:', error.message)
    return createFallbackResult(error.message)
  }
}

// 根据嫌疑人性别选择默认声音
export function getDefaultVoice(isKiller: boolean, directness: number): string {
  // 凶手声音：稍微紧张/防御
  if (isKiller) {
    if (directness >= 2) return 'male-qnq' // 委婉问题时稍放松
    return 'male-yunyang' // 直白问题时紧张
  }
  // 非凶手声音
  if (directness >= 3) return 'female-aiqi' // 委婉问题时健谈
  return 'female-aiya' // 正常回答
}

// 统一TTS生成函数
async function synthesizeWithProvider(
  text: string,
  config: ImmersionConfig,
  voice?: string
): Promise<string | null> {
  let apiKey: string
  let provider: TTSProvider

  if (config.modelMode === 'unified' && config.unifiedApiKey) {
    apiKey = config.unifiedApiKey
    provider = 'minimax' // 统一模式默认MiniMax
  } else if (config.speechApiKey && config.speechProvider) {
    apiKey = config.speechApiKey
    provider = config.speechProvider as TTSProvider
  } else {
    throw new Error('未配置语音合成API')
  }

  const providerConfig = TTS_PROVIDERS[provider]
  if (!providerConfig) {
    throw new Error(`不支持的TTS提供商: ${provider}`)
  }

  // 超时控制（30秒）
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TTS synthesis timeout')), 30000)
  })

  const synthesisPromise = providerConfig.synthesize(apiKey, text, voice)

  return await Promise.race([synthesisPromise, timeoutPromise]) as string | null
}

// 创建降级结果
function createFallbackResult(errorMessage: string): TTSResult {
  if (errorMessage.includes('timeout')) {
    return { success: false, fallbackText: '语音合成超时，已使用文字显示', errorType: 'timeout' }
  }
  if (errorMessage.includes('429') || errorMessage.includes('rate')) {
    return { success: false, fallbackText: '请求过于频繁，已使用文字显示', errorType: 'rate_limit' }
  }
  if (errorMessage.includes('403') || errorMessage.includes('unauthorized')) {
    return { success: false, fallbackText: 'API密钥无效，已使用文字显示', errorType: 'service_unavailable' }
  }
  return { success: false, fallbackText: '语音合成失败，已使用文字显示', errorType: 'unknown' }
}

// 预定义背景音乐URL（降级用）
export const FALLBACK_MUSIC = {
  investigation: 'https://assets.example.com/music/investigation.mp3',
  tension: 'https://assets.example.com/music/tension.mp3',
  calm: 'https://assets.example.com/music/calm.mp3',
  victory: 'https://assets.example.com/music/victory.mp3'
}