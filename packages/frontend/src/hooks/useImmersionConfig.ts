import { useState, useEffect } from 'react'
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
  const saveConfig = (newConfig: ImmersionConfig) => {
    setConfig(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
  }

  // 更新沉浸等级
  const setLevel = (level: ImmersionLevel) => {
    saveConfig({ ...config, level })
  }

  // 更新模型模式
  const setModelMode = (mode: 'unified' | 'separate') => {
    saveConfig({ ...config, modelMode: mode })
  }

  // 更新统一API Key
  const setUnifiedApiKey = (key: string) => {
    saveConfig({ ...config, unifiedApiKey: key })
  }

  // 更新统一模型
  const setUnifiedModel = (model: string) => {
    saveConfig({ ...config, unifiedModel: model })
  }

  // 更新音量
  const setMusicVolume = (volume: number) => {
    saveConfig({ ...config, musicVolume: volume })
  }

  // 更新音效开关
  const setSoundEffectsEnabled = (enabled: boolean) => {
    saveConfig({ ...config, soundEffectsEnabled: enabled })
  }

  // 重置配置
  const resetConfig = () => {
    saveConfig(DEFAULT_IMMERSION_CONFIG)
  }

  return {
    config,
    isLoaded,
    saveConfig,
    setLevel,
    setModelMode,
    setUnifiedApiKey,
    setUnifiedModel,
    setMusicVolume,
    setSoundEffectsEnabled,
    resetConfig
  }
}