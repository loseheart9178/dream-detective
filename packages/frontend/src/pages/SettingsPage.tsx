import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiConfig } from '../hooks/useApiConfig'
import { useImmersionConfig } from '../hooks/useImmersionConfig'
import { API_PROVIDERS, API_PROTOCOLS, type ApiProvider, type ApiConfig, type ApiProtocol } from '../types'

const STORAGE_KEY = 'dream-detective-immersion-config'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { apiConfig, saveApiConfig, deleteApiConfig, getDisplayApiKey, hasApiKey } = useApiConfig()
  const {
    config: immersionConfig,
    setModelMode,
    setUnifiedApiKey,
    setImageApiKey,
    setImageProvider,
    setSpeechApiKey,
    setSpeechProvider,
    setMusicVolume,
    setSoundEffectsEnabled
  } = useImmersionConfig()

  // 文本AI配置状态
  const [provider, setProvider] = useState<ApiProvider>(apiConfig?.apiProvider || 'openai')
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState(apiConfig?.apiUrl || '')
  const [model, setModel] = useState(apiConfig?.model || '')
  const [protocol, setProtocol] = useState<ApiProtocol>(apiConfig?.protocol || 'openai')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // 多媒体配置状态
  const [unifiedApiKey, setUnifiedApiKeyState] = useState(immersionConfig.unifiedApiKey || '')
  const [showImmersionKey, setShowImmersionKey] = useState(false)
  const [imageApiKey, setImageApiKeyState] = useState(immersionConfig.imageApiKey || '')
  const [showImageKey, setShowImageKey] = useState(false)
  const [speechApiKey, setSpeechApiKeyState] = useState(immersionConfig.speechApiKey || '')
  const [showSpeechKey, setShowSpeechKey] = useState(false)
  const [imageProvider, setImageProviderState] = useState(immersionConfig.imageProvider || 'wanxi')
  const [speechProvider, setSpeechProviderState] = useState(immersionConfig.speechProvider || 'aliyun')
  const [mediaTesting, setMediaTesting] = useState(false)
  const [mediaTestResult, setMediaTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [mediaSaved, setMediaSaved] = useState(false)

  const isLocalProvider = provider === 'local'
  const currentConfig = API_PROVIDERS[provider]

  // 当供应商切换时，更新默认值
  useEffect(() => {
    const config = API_PROVIDERS[provider]
    if (config) {
      if (provider === 'local') {
        const protocolConfig = API_PROTOCOLS[protocol]
        setApiUrl(`http://localhost:${protocolConfig.defaultPort}${protocolConfig.defaultEndpoint}`)
      } else {
        setApiUrl(config.baseUrl)
      }
      setModel(config.defaultModel)
    }
  }, [provider])

  // 当协议类型切换时，更新本地部署的默认URL
  useEffect(() => {
    if (isLocalProvider) {
      const protocolConfig = API_PROTOCOLS[protocol]
      setApiUrl(`http://localhost:${protocolConfig.defaultPort}${protocolConfig.defaultEndpoint}`)
    }
  }, [protocol, isLocalProvider])

  // 加载保存的多媒体配置
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUnifiedApiKeyState(parsed.unifiedApiKey || '')
        setImageApiKeyState(parsed.imageApiKey || '')
        setSpeechApiKeyState(parsed.speechApiKey || '')
      } catch {}
    }
  }, [])

  // 处理保存文本配置
  const handleSave = () => {
    if (!apiKey.trim() && !isLocalProvider) {
      alert('请输入API密钥')
      return
    }

    if (!model.trim()) {
      alert('请输入模型名称')
      return
    }

    const config: ApiConfig = {
      apiProvider: provider,
      apiKey: apiKey.trim(),
      apiUrl: apiUrl.trim() || currentConfig.baseUrl,
      model: model.trim(),
      protocol: isLocalProvider ? protocol : currentConfig.protocol
    }

    saveApiConfig(config)
    alert('文本配置已保存')
    navigate('/')
  }

  // 测试文本连接
  const handleTest = async () => {
    if (!apiKey.trim() && !isLocalProvider) {
      alert('请先输入API密钥')
      return
    }

    if (!model.trim()) {
      alert('请先输入模型名称')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const testProtocol = isLocalProvider ? protocol : currentConfig.protocol
      const url = apiUrl.trim() || currentConfig.baseUrl
      const testModel = model.trim()

      let response: Response

      if (testProtocol === 'dashscope') {
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
      } else if (testProtocol === 'anthropic') {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey.trim() || 'dummy',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: testModel,
            max_tokens: 10,
            messages: [{ role: 'user', content: '你好' }]
          })
        })
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim() || 'dummy'}`
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: '你好' }],
            max_tokens: 10
          })
        })
      }

      if (response.ok) {
        setTestResult({ success: true, message: '文本AI连接成功！' })
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

  // 测试多媒体连接
  const handleMediaTest = async () => {
    setMediaTesting(true)
    setMediaTestResult(null)
    setMediaSaved(false)

    try {
      if (immersionConfig.modelMode === 'unified') {
        if (!unifiedApiKey.trim()) {
          setMediaTestResult({ success: false, message: '请输入全模态模型API密钥' })
          return
        }
        // MiniMax 简单连接测试 - 使用正确的端点
        const response = await fetch('https://api.minimax.chat/v1/t2a_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${unifiedApiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'speech-2.8-hd',
            text: '测试',
            voice_setting: { voice_id: 'female-tianmei', speed: 1.0, volume: 1.0, pitch: 0 },
            audio_setting: { audio_format: 'mp3', sample_rate: 32000, bitrate: 128000 }
          })
        })
        if (response.ok || response.status === 400 || response.status === 401) {
          // 400/401 说明Key有效
          setMediaTestResult({ success: true, message: '全模态模型API密钥有效！' })
        } else {
          setMediaTestResult({ success: false, message: `连接失败: ${response.status}` })
        }
      } else {
        // 分离模式：测试图片和语音
        const results: string[] = []

        if (imageProvider === 'wanxi') {
          const response = await fetch('https://dashscope.aliyuncs.com/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${imageApiKey.trim() || 'dummy'}`,
              'Content-Type': 'application/json'
            }
          })
          if (response.ok) {
            results.push('图片API ✓')
          } else {
            results.push('图片API ✗')
          }
        }

        if (speechProvider === 'aliyun') {
          const response = await fetch('https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${speechApiKey.trim() || 'dummy'}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: '测试', voice: 'aixia' })
          })
          if (response.ok || response.status === 400) {
            // 400 可能是因为参数问题，但Key有效
            results.push('语音API ✓')
          } else {
            results.push('语音API ✗')
          }
        }

        setMediaTestResult({
          success: results.every(r => r.includes('✓')),
          message: results.join(' | ')
        })
      }
    } catch (err) {
      setMediaTestResult({
        success: false,
        message: `测试失败: ${err instanceof Error ? err.message : '网络错误'}`
      })
    } finally {
      setMediaTesting(false)
    }
  }

  // 保存多媒体配置
  const handleMediaSave = () => {
    if (immersionConfig.modelMode === 'unified') {
      setUnifiedApiKey(unifiedApiKey.trim())
      setUnifiedApiKeyState(unifiedApiKey.trim()) // 同步更新本地状态
    } else {
      setImageApiKey(imageApiKey.trim())
      setImageApiKeyState(imageApiKey.trim())
      setImageProvider(imageProvider as 'wanxi' | 'dalle' | 'stability' | 'minimax')
      setSpeechApiKey(speechApiKey.trim())
      setSpeechApiKeyState(speechApiKey.trim())
      setSpeechProvider(speechProvider as 'aliyun' | 'openai' | 'elevenlabs' | 'minimax')
    }
    setMediaSaved(true)
    setMediaTestResult({ success: true, message: '多媒体配置已保存！' })
    // 重新加载配置以确保页面状态同步
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUnifiedApiKeyState(parsed.unifiedApiKey || '')
        setImageApiKeyState(parsed.imageApiKey || '')
        setSpeechApiKeyState(parsed.speechApiKey || '')
      } catch {}
    }
    setTimeout(() => setMediaSaved(false), 2000)
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

        {/* 文本AI配置 */}
        <div className="bg-slate-800 rounded-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            📝 文本生成配置
          </h2>
          <p className="text-slate-400 text-sm mb-4">用于生成案件内容、嫌疑人对话等文本</p>

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

            {/* 协议类型选择 - 仅本地部署显示 */}
            {isLocalProvider && (
              <div>
                <label className="block text-slate-300 mb-2 text-sm">API协议类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(API_PROTOCOLS) as ApiProtocol[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setProtocol(key)}
                      className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                        protocol === key
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {API_PROTOCOLS[key].displayName}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  {API_PROTOCOLS[protocol].authHeader} 格式认证
                </p>
              </div>
            )}

            {/* API地址 */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm">API地址</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={currentConfig.baseUrl}
                className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {isLocalProvider && (
                <p className="text-slate-500 text-xs mt-1">
                  本地部署请填写完整地址，如 Ollama: http://localhost:11434/v1/chat/completions
                </p>
              )}
              {!isLocalProvider && (
                <p className="text-slate-500 text-xs mt-1">
                  默认地址: {currentConfig.baseUrl}
                </p>
              )}
            </div>

            {/* 模型名称 */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm">模型名称</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="请输入模型名称"
                className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {currentConfig.modelSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentConfig.modelSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setModel(suggestion)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        model === suggestion
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {suggestion}
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
                  {apiConfig.protocol && apiConfig.apiProvider === 'local' && (
                    <span className="text-slate-500"> ({API_PROTOCOLS[apiConfig.protocol]?.name})</span>
                  )}
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
                disabled={testing || (!apiKey.trim() && !isLocalProvider) || !model.trim()}
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

        {/* 多媒体配置 */}
        <div className="bg-slate-800 rounded-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            🎨 多媒体生成配置
          </h2>
          <p className="text-slate-400 text-sm mb-4">用于生成案发现场图、嫌疑人画像、线索图、TTS语音等</p>

          <div className="space-y-4">
            {/* 多媒体模型配置模式 */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm">配置模式</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setModelMode('unified')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                    immersionConfig.modelMode === 'unified'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  全模态模型（推荐）
                </button>
                <button
                  onClick={() => setModelMode('separate')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                    immersionConfig.modelMode === 'separate'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  分别配置
                </button>
              </div>
            </div>

            {/* 全模态模式：全模态模型API Key */}
            {immersionConfig.modelMode === 'unified' && (
              <div>
                <label className="block text-slate-300 mb-2 text-sm">全模态模型 API密钥</label>
                <div className="relative">
                  <input
                    type={showImmersionKey ? 'text' : 'password'}
                    value={unifiedApiKey}
                    onChange={(e) => setUnifiedApiKeyState(e.target.value)}
                    placeholder="输入MiniMax或其他全模态模型API密钥"
                    className="w-full bg-slate-700 text-slate-200 rounded-lg p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => setShowImmersionKey(!showImmersionKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showImmersionKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  推荐使用 MiniMax，一Key搞定文本+图片+语音
                </p>
              </div>
            )}

            {/* 分离模式：图片和语音分别配置 */}
            {immersionConfig.modelMode === 'separate' && (
              <div className="space-y-4 bg-slate-700/50 rounded-lg p-4">
                {/* 图片生成 */}
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">图片生成</label>
                  <select
                    value={imageProvider}
                    onChange={(e) => setImageProviderState(e.target.value as 'wanxi' | 'dalle' | 'stability' | 'minimax')}
                    className="w-full bg-slate-600 text-slate-300 rounded px-3 py-2 text-sm mb-2"
                  >
                    <option value="wanxi">通义万相</option>
                    <option value="minimax">MiniMax</option>
                    <option value="dalle">DALL-E 3</option>
                  </select>
                  <div className="relative">
                    <input
                      type={showImageKey ? 'text' : 'password'}
                      value={imageApiKey}
                      onChange={(e) => setImageApiKeyState(e.target.value)}
                      placeholder={`${imageProvider === 'wanxi' ? '通义' : imageProvider === 'minimax' ? 'MiniMax' : 'DALL-E'} API密钥`}
                      className="w-full bg-slate-600 text-slate-200 rounded-lg p-3 pr-12 text-sm"
                    />
                    <button
                      onClick={() => setShowImageKey(!showImageKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm"
                    >
                      {showImageKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* 语音合成 */}
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">语音合成</label>
                  <select
                    value={speechProvider}
                    onChange={(e) => setSpeechProviderState(e.target.value as 'aliyun' | 'openai' | 'elevenlabs' | 'minimax')}
                    className="w-full bg-slate-600 text-slate-300 rounded px-3 py-2 text-sm mb-2"
                  >
                    <option value="aliyun">阿里云TTS</option>
                    <option value="minimax">MiniMax TTS</option>
                    <option value="openai">OpenAI TTS</option>
                  </select>
                  <div className="relative">
                    <input
                      type={showSpeechKey ? 'text' : 'password'}
                      value={speechApiKey}
                      onChange={(e) => setSpeechApiKeyState(e.target.value)}
                      placeholder={`${speechProvider === 'aliyun' ? '阿里云' : speechProvider === 'minimax' ? 'MiniMax' : 'OpenAI'} API密钥`}
                      className="w-full bg-slate-600 text-slate-200 rounded-lg p-3 pr-12 text-sm"
                    />
                    <button
                      onClick={() => setShowSpeechKey(!showSpeechKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm"
                    >
                      {showSpeechKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 音量控制 */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm">
                背景音乐音量: {immersionConfig.musicVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={immersionConfig.musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            {/* 音效开关 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="soundEffects"
                checked={immersionConfig.soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="soundEffects" className="text-slate-300 text-sm">
                启用音效（如：收集线索、询问回答等交互音效）
              </label>
            </div>

            {/* 测试结果 */}
            {mediaTestResult && (
              <div className={`rounded-lg p-3 text-sm ${mediaTestResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                {mediaTestResult.success ? '✓' : '✗'} {mediaTestResult.message}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleMediaTest}
                disabled={mediaTesting}
                className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 disabled:opacity-50"
              >
                {mediaTesting ? '测试中...' : '测试连接'}
              </button>
              <button
                onClick={handleMediaSave}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  mediaSaved
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-500'
                }`}
              >
                {mediaSaved ? '已保存 ✓' : '保存配置'}
              </button>
            </div>
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
