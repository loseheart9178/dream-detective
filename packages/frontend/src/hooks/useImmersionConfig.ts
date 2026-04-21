import { useState, useEffect, useCallback } from 'react'
import type { ImmersionConfig, ImmersionLevel } from '../types'
import { DEFAULT_IMMERSION_CONFIG } from '../types'

const STORAGE_KEY = 'dream-detective-immersion-config'

export function useImmersionConfig() {
  const [config, setConfig] = useState<ImmersionConfig>(DEFAULT_IMMERSION_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  // 从localStorage加载配置
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setConfig({ ...DEFAULT_IMMERSION_CONFIG, ...parsed })
      } catch {
        setConfig(DEFAULT_IMMERSION_CONFIG)
      }
    }
    setIsLoaded(true)
  }, [])

  // 保存配置到localStorage
  const saveConfig = useCallback((newConfig: ImmersionConfig) => {
    setConfig(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
  }, [])

  // 更新沉浸等级
  const setLevel = useCallback((level: ImmersionLevel) => {
    saveConfig({ ...config, level })
  }, [config, saveConfig])

  // 更新模型模式
  const setModelMode = useCallback((mode: 'unified' | 'separate') => {
    saveConfig({ ...config, modelMode: mode })
  }, [config, saveConfig])

  // 更新统一API Key
  const setUnifiedApiKey = useCallback((key: string) => {
    saveConfig({ ...config, unifiedApiKey: key })
  }, [config, saveConfig])

  // 更新统一模型
  const setUnifiedModel = useCallback((model: string) => {
    saveConfig({ ...config, unifiedModel: model })
  }, [config, saveConfig])

  // 更新图片 API Key
  const setImageApiKey = useCallback((key: string) => {
    saveConfig({ ...config, imageApiKey: key })
  }, [config, saveConfig])

  // 更新图片提供商
  const setImageProvider = useCallback((provider: 'wanxi' | 'dalle' | 'stability' | 'minimax') => {
    saveConfig({ ...config, imageProvider: provider })
  }, [config, saveConfig])

  // 更新语音 API Key
  const setSpeechApiKey = useCallback((key: string) => {
    saveConfig({ ...config, speechApiKey: key })
  }, [config, saveConfig])

  // 更新语音提供商
  const setSpeechProvider = useCallback((provider: 'aliyun' | 'openai' | 'elevenlabs' | 'minimax') => {
    saveConfig({ ...config, speechProvider: provider })
  }, [config, saveConfig])

  // 更新音量
  const setMusicVolume = useCallback((volume: number) => {
    saveConfig({ ...config, musicVolume: volume })
  }, [config, saveConfig])

  // 更新音效开关
  const setSoundEffectsEnabled = useCallback((enabled: boolean) => {
    saveConfig({ ...config, soundEffectsEnabled: enabled })
  }, [config, saveConfig])

  // 重置配置
  const resetConfig = useCallback(() => {
    saveConfig(DEFAULT_IMMERSION_CONFIG)
  }, [saveConfig])

  return {
    config,
    isLoaded,
    saveConfig,
    setLevel,
    setModelMode,
    setUnifiedApiKey,
    setUnifiedModel,
    setImageApiKey,
    setImageProvider,
    setSpeechApiKey,
    setSpeechProvider,
    setMusicVolume,
    setSoundEffectsEnabled,
    resetConfig
  }
}
