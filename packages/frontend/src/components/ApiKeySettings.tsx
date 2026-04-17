import { useState } from 'react'
import type { ApiConfig } from '../types'

interface ApiKeySettingsProps {
  currentConfig: ApiConfig | null
  onSave: (config: ApiConfig) => void
  onDelete: () => void
  displayKey: string
  hasApiKey: boolean
}

export function ApiKeySettings({
  currentConfig,
  onSave,
  onDelete,
  displayKey,
  hasApiKey
}: ApiKeySettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState<'openai' | 'dashscope'>(currentConfig?.apiProvider || 'openai')
  const [showKey, setShowKey] = useState(false)

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入API密钥')
      return
    }
    onSave({ apiKey: apiKey.trim(), apiProvider })
    setApiKey('')
    setIsOpen(false)
  }

  const handleOpen = () => {
    setApiProvider(currentConfig?.apiProvider || 'openai')
    setIsOpen(true)
  }

  if (!isOpen) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">AI API:</span>
            {hasApiKey ? (
              <span className="text-green-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {apiProvider === 'openai' ? 'OpenAI' : '通义千问'} ({displayKey})
              </span>
            ) : (
              <span className="text-amber-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                未配置 (使用示例案件)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              className="text-primary-400 hover:text-primary-300 text-sm px-3 py-1 bg-slate-700 rounded"
            >
              {hasApiKey ? '修改' : '配置'}
            </button>
            {hasApiKey && (
              <button
                onClick={onDelete}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1 bg-slate-700 rounded"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-4">
      <h3 className="text-slate-200 font-bold mb-4">配置AI API密钥</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2 text-sm">API提供商</label>
          <div className="flex gap-2">
            <button
              onClick={() => setApiProvider('openai')}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                apiProvider === 'openai'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              OpenAI (GPT-4o)
            </button>
            <button
              onClick={() => setApiProvider('dashscope')}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                apiProvider === 'dashscope'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              通义千问 (阿里云)
            </button>
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-2 text-sm">
            API密钥 {apiProvider === 'openai' ? '(sk-...)' : '(Dashscope API Key)'}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiProvider === 'openai' ? 'sk-...' : '请输入通义千问API密钥'}
              className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            密钥将保存在本地浏览器中，不会上传到服务器
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}