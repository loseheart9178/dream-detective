import { useState, useEffect, useCallback } from 'react'
import type { ApiConfig } from '../types'

const STORAGE_KEY = 'dream-detective-api-config'

export function useApiConfig() {
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null)

  // 加载保存的配置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored) as ApiConfig
        // 只显示密钥后4位
        setApiConfig(config)
      }
    } catch (err) {
      console.error('加载API配置失败:', err)
    }
  }, [])

  // 保存配置
  const saveApiConfig = useCallback((config: ApiConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      setApiConfig(config)
    } catch (err) {
      console.error('保存API配置失败:', err)
    }
  }, [])

  // 删除配置
  const deleteApiConfig = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setApiConfig(null)
    } catch (err) {
      console.error('删除API配置失败:', err)
    }
  }, [])

  // 获取显示用的密钥（隐藏中间部分）
  const getDisplayApiKey = useCallback(() => {
    if (!apiConfig?.apiKey) return ''
    const key = apiConfig.apiKey
    if (key.length <= 8) return '****'
    return `${key.slice(0, 4)}...${key.slice(-4)}`
  }, [apiConfig])

  return {
    apiConfig,
    saveApiConfig,
    deleteApiConfig,
    getDisplayApiKey,
    hasApiKey: !!apiConfig?.apiKey
  }
}