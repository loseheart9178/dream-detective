import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GenerateCaseRequest, Case } from '../types'
import { useGameProgress } from '../hooks/useGameProgress'

export default function CreateCasePage() {
  const navigate = useNavigate()
  const { saveCaseData } = useGameProgress()
  const [keywords, setKeywords] = useState('')
  const [difficulty, setDifficulty] = useState(2)
  const [numSuspects, setNumSuspects] = useState(4)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError('请输入至少一个关键词')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const request: GenerateCaseRequest = {
        keywords: keywords.trim(),
        difficulty,
        numSuspects
      }

      const response = await fetch('/api/case/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (data.success && data.data.caseId) {
        // 获取并保存案件数据到localStorage
        const caseResponse = await fetch(`/api/case/${data.data.caseId}`)
        const caseData = await caseResponse.json()
        if (caseData.success) {
          saveCaseData(caseData.data as Case)
        }
        navigate(`/game/${data.data.caseId}`)
      } else {
        setError(data.message || '生成失败，请重试')
      }
    } catch (err) {
      setError('网络错误，请检查后端服务是否启动')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-primary-400 mb-6 text-center">
          创建新案件
        </h1>

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
              提示：多个关键词用空格分隔
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-red-400 text-center text-sm">{error}</div>
          )}

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              isGenerating
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-500 text-white'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI正在生成案件...
              </span>
            ) : (
              '生成案件'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}