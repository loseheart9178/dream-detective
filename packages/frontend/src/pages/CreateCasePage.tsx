import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { ImmersionLevel } from '../types'
import { ImmersionLevelConfig } from '../types'
import { useApiConfig } from '../hooks/useApiConfig'
import { useImmersionConfig } from '../hooks/useImmersionConfig'

// 预设关键词标签
const PRESET_KEYWORDS = [
  { label: '游轮', value: '游轮 暴风雨 海上' },
  { label: '古堡', value: '古堡 贵族 遗产' },
  { label: '雪山', value: '雪山 暴风雪 度假村' },
  { label: '医院', value: '医院 手术室 医生' },
  { label: '学校', value: '学校 校园 教师' },
  { label: '剧院', value: '剧院 演员 首演' }
]

export default function CreateCasePage() {
  const navigate = useNavigate()
  const { apiConfig, getDisplayApiKey, hasApiKey } = useApiConfig()
  const { config: immersionConfig } = useImmersionConfig()
  const [keywords, setKeywords] = useState('')
  const [difficulty, setDifficulty] = useState(2)
  const [numSuspects, setNumSuspects] = useState(4)
  const [immersionLevel, setImmersionLevel] = useState<ImmersionLevel>(immersionConfig.level)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(() => {
    if (!keywords.trim()) {
      setError('请输入至少一个关键词')
      return
    }

    if (keywords.trim().length < 2) {
      setError('关键词至少需要2个字符')
      return
    }

    if (keywords.trim().length > 100) {
      setError('关键词最多100个字符')
      return
    }

    // 跳转到等待页面，携带参数
    const params = new URLSearchParams({
      keywords: keywords.trim(),
      difficulty: String(difficulty),
      numSuspects: String(numSuspects),
      immersionLevel,
      apiProvider: apiConfig?.apiProvider || '',
      apiUrl: apiConfig?.apiUrl || '',
      model: apiConfig?.model || '',
      apiKey: apiConfig?.apiKey || '',
      protocol: apiConfig?.protocol || ''
    })
    navigate(`/waiting?${params.toString()}`)
  }, [keywords, difficulty, numSuspects, immersionLevel, apiConfig, navigate])

  // 点击预设标签
  const handlePresetClick = (value: string) => {
    setKeywords(value)
  }

  // 获取API供应商显示名称
  const getProviderName = () => {
    if (!apiConfig?.apiProvider) return '未配置'
    const providers: Record<string, string> = {
      openai: 'OpenAI',
      dashscope: '通义千问',
      deepseek: 'DeepSeek',
      claude: 'Claude',
      zhipu: '智谱AI',
      moonshot: 'Moonshot',
      local: '本地部署'
    }
    return providers[apiConfig.apiProvider] || apiConfig.apiProvider
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary-400">
            创建新案件
          </h1>
          <div className="flex gap-2">
            <Link
              to="/settings"
              className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1 bg-slate-700 rounded flex items-center gap-1"
            >
              <span>⚙️</span>
              设置
              {hasApiKey ? (
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              ) : (
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              )}
            </Link>
            <Link
              to="/"
              className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1 bg-slate-700 rounded"
            >
              返回首页
            </Link>
          </div>
        </div>

        {/* API配置状态提示 */}
        <div className="bg-slate-700/50 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">AI API:</span>
            {hasApiKey ? (
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                {getProviderName()} ({apiConfig?.model || '默认模型'}) - {getDisplayApiKey()}
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                未配置 (将使用示例案件)
              </span>
            )}
          </div>
          <Link
            to="/settings"
            className="text-primary-400 hover:text-primary-300 text-sm"
          >
            {hasApiKey ? '修改' : '去配置'}
          </Link>
        </div>

        <div className="space-y-6">
          {/* 难度选择 */}
          <div>
            <label className="block text-slate-300 mb-2">难度</label>
            <div className="flex gap-4">
              {[
                { value: 1, label: '简单' },
                { value: 2, label: '中等' },
                { value: 3, label: '困难' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDifficulty(option.value)}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    difficulty === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 嫌疑人数量 */}
          <div>
            <label className="block text-slate-300 mb-2">
              嫌疑人数量: {numSuspects}人
            </label>
            <input
              type="range"
              min="3"
              max="5"
              value={numSuspects}
              onChange={(e) => setNumSuspects(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 沉浸级别选择 */}
          <div>
            <label className="block text-slate-300 mb-2">沉浸体验级别</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ImmersionLevelConfig) as ImmersionLevel[]).map((key) => {
                const level = ImmersionLevelConfig[key]
                return (
                  <button
                    key={key}
                    onClick={() => setImmersionLevel(key)}
                    className={`py-3 px-4 rounded-lg text-sm transition-colors text-center ${
                      immersionLevel === key
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    <div className="font-bold">{level.name}</div>
                    <div className="text-xs opacity-70 mt-1">{level.description}</div>
                  </button>
                )
              })}
            </div>
            {immersionLevel !== 'basic' && !immersionConfig.unifiedApiKey && (
              <p className="text-amber-400 text-xs mt-2">
                提示：沉浸模式需要在设置中配置多媒体API密钥，否则将自动降级为基础模式
              </p>
            )}
          </div>

          {/* 关键词输入 */}
          <div>
            <label className="block text-slate-300 mb-2">关键词</label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="输入场景、主题等关键词，如：游轮 暴风雨 遗产"
              className="w-full h-24 bg-slate-700 text-slate-200 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-slate-500 text-sm mt-1">
              提示：多个关键词用空格分隔 ({keywords.length}/100字)
            </p>
          </div>

          {/* 预设关键词标签 */}
          <div>
            <label className="block text-slate-300 mb-2 text-sm">快速选择</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_KEYWORDS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.value)}
                  className={`px-3 py-1 bg-slate-700 text-slate-400 rounded-full text-sm hover:bg-slate-600 hover:text-slate-200 transition-colors ${
                    keywords === preset.value ? 'ring-2 ring-primary-500 text-primary-400' : ''
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-red-400 text-center text-sm bg-red-900/20 rounded-lg p-2">
              {error}
            </div>
          )}

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            className="w-full py-4 rounded-lg font-bold text-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          >
            生成案件
          </button>
        </div>
      </div>
    </div>
  )
}