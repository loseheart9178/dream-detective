import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiConfig } from '../hooks/useApiConfig'
import { API_PROVIDERS, type ApiProvider, type ApiConfig } from '../types'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { apiConfig, saveApiConfig, deleteApiConfig, getDisplayApiKey, hasApiKey } = useApiConfig()

  const [provider, setProvider] = useState<ApiProvider>(apiConfig?.apiProvider || 'openai')
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState(apiConfig?.apiUrl || '')
  const [model, setModel] = useState(apiConfig?.model || '')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // 当供应商切换时，更新默认URL和模型
  useEffect(() => {
    const config = API_PROVIDERS[provider]
    if (config) {
      setApiUrl(config.baseUrl)
      setModel(config.models.find(m => m.default)?.id || config.models[0]?.id || '')
    }
  }, [provider])

  // 处理保存
  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入API密钥')
      return
    }

    const config: ApiConfig = {
      apiProvider: provider,
      apiKey: apiKey.trim(),
      apiUrl: API_PROVIDERS[provider].allowCustomUrl ? apiUrl.trim() : API_PROVIDERS[provider].baseUrl,
      model: model.trim()
    }

    saveApiConfig(config)
    alert('配置已保存')
    navigate('/')
  }

  // 测试连接
  const handleTest = async () => {
    if (!apiKey.trim()) {
      alert('请先输入API密钥')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const config = API_PROVIDERS[provider]
      const url = config.allowCustomUrl ? apiUrl : config.baseUrl
      const testModel = model || config.models[0]?.id

      // 根据不同供应商构建不同的请求
      let response: Response

      if (provider === 'dashscope') {
        // 通义千问特殊格式
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: testModel,
            input: { prompt: '你好' },
            parameters: { max_tokens: 10 }
          })
        })
      } else if (provider === 'claude') {
        // Claude特殊格式
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey.trim(),
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: testModel,
            max_tokens: 10,
            messages: [{ role: 'user', content: '你好' }]
          })
        })
      } else {
        // OpenAI兼容格式 (OpenAI, DeepSeek, 智谱, Moonshot, 自定义)
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: '你好' }],
            max_tokens: 10
          })
        })
      }

      if (response.ok) {
        setTestResult({ success: true, message: '连接成功！' })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestResult({
          success: false,
          message: `连接失败: ${response.status} - ${errorData.error?.message || errorData.message || '未知错误'}`
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `连接失败: ${err instanceof Error ? err.message : '网络错误'}`
      })
    } finally {
      setTesting(false)
    }
  }

  // 处理删除
  const handleDelete = () => {
    if (confirm('确定要删除API配置吗？')) {
      deleteApiConfig()
      setApiKey('')
      setTestResult(null)
      alert('配置已删除')
    }
  }

  const currentConfig = API_PROVIDERS[provider]

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-primary-400">设置</h1>
          <div className="w-16"></div>
        </div>

        {/* API配置 */}
        <div className="bg-slate-800 rounded-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            📡 API配置
          </h2>

          <div className="space-y-4">
            {/* 供应商选择 */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm">API供应商</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(API_PROVIDERS) as ApiProvider[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setProvider(key)}
                    className={`py-2 px-3 rounded-lg text-sm transition-colors text-left ${
                      provider === key
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {API_PROVIDERS[key].displayName}
                  </button>
                ))}
              </div>
            </div>

            {/* API地址 */}
            {currentConfig.allowCustomUrl && (
              <div>
                <label className="block text-slate-300 mb-2 text-sm">API地址</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.example.com/v1/chat/completions"
                  className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* 模型选择 */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm">模型</label>
              {currentConfig.allowCustomUrl ? (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="请输入模型名称"
                  className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {currentConfig.models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`py-2 px-3 rounded-lg text-sm transition-colors text-left ${
                        model === m.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* API密钥 */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm">API密钥</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentConfig.keyPlaceholder}
                  className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              {currentConfig.docsUrl && (
                <p className="text-slate-500 text-xs mt-1">
                  获取密钥: <a href={currentConfig.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">{currentConfig.docsUrl}</a>
                </p>
              )}
            </div>

            {/* 当前配置状态 */}
            {hasApiKey && apiConfig && (
              <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
                <p className="text-slate-400">
                  当前配置: <span className="text-green-400">{API_PROVIDERS[apiConfig.apiProvider]?.name || apiConfig.apiProvider}</span>
                  {' '}/ {apiConfig.model || '默认模型'}
                  {' '}/ {getDisplayApiKey()}
                </p>
              </div>
            )}

            {/* 测试结果 */}
            {testResult && (
              <div className={`rounded-lg p-3 text-sm ${testResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {testResult.success ? '✓' : '✗'} {testResult.message}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleTest}
                disabled={testing || !apiKey.trim()}
                className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 disabled:opacity-50"
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500"
              >
                保存配置
              </button>
            </div>

            {hasApiKey && (
              <button
                onClick={handleDelete}
                className="w-full py-2 text-red-400 hover:text-red-300 text-sm"
              >
                删除配置
              </button>
            )}
          </div>
        </div>

        {/* 关于 */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            📖 关于
          </h2>
          <div className="text-slate-400 text-sm space-y-1">
            <p>造梦侦探：逻辑重构</p>
            <p>版本: 1.0.0</p>
            <p>杭电AI产品设计大赛参赛作品</p>
          </div>
        </div>
      </div>
    </div>
  )
}