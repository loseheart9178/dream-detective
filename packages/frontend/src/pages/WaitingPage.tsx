import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGameProgress } from '../hooks/useGameProgress'
import type { Case, GenerateCaseRequest } from '../types'
import { DETECTIVE_QUOTES, DetectiveStory } from '../types'

// 经典侦探插图URL
const DETECTIVE_ILLUSTRATIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca55?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&h=600&fit=crop',
]

const PHASE_LABELS: Record<string, string> = {
  text: '正在生成案件剧情...',
  images: '正在生成场景图片...',
  audio: '正在生成语音...',
  complete: '案件生成完成！'
}

const PHASE_DESCRIPTIONS: Record<string, string> = {
  text: '让AI构思一个精彩的侦探故事',
  images: '为案件生成逼真的场景和人物图',
  audio: '合成嫌疑人语音回答',
  complete: ''
}

type Phase = 'text' | 'images' | 'audio' | 'complete'

export default function WaitingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { saveCaseData } = useGameProgress()

  const [currentStory, setCurrentStory] = useState<DetectiveStory | null>(null)
  const [fadeIn, setFadeIn] = useState(true)
  const [currentPhase, setCurrentPhase] = useState<Phase>('text')
  const [progress, setProgress] = useState(10)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'retry' | 'back' | null>(null)

  // 随机选择一个插图
  const randomIllustration = DETECTIVE_ILLUSTRATIONS[Math.floor(Math.random() * DETECTIVE_ILLUSTRATIONS.length)]

  // 随机选择一个侦探故事/名言
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DETECTIVE_QUOTES.length)
    setCurrentStory(DETECTIVE_QUOTES[randomIndex])
  }, [])

  // 每30秒切换一次名言
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false)
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * DETECTIVE_QUOTES.length)
        setCurrentStory(DETECTIVE_QUOTES[randomIndex])
        setFadeIn(true)
      }, 300)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // 开始生成案件
  const generateCase = useCallback(async () => {
    const keywords = searchParams.get('keywords') || ''
    const difficulty = parseInt(searchParams.get('difficulty') || '2')
    const numSuspects = parseInt(searchParams.get('numSuspects') || '4')
    const immersionLevel = searchParams.get('immersionLevel') || 'basic'
    const apiProvider = searchParams.get('apiProvider') || ''
    const apiUrl = searchParams.get('apiUrl') || ''
    const model = searchParams.get('model') || ''
    const apiKey = searchParams.get('apiKey') || ''
    const protocol = searchParams.get('protocol') || ''

    if (!keywords || keywords.length < 2) {
      setError('关键词无效，请返回重新输入')
      return
    }

    try {
      setCurrentPhase('text')
      setProgress(20)

      const request: GenerateCaseRequest = {
        keywords,
        difficulty,
        numSuspects,
        immersionLevel: immersionLevel as any,
        apiKey: apiKey || undefined,
        apiProvider: (apiProvider || undefined) as any,
        apiUrl: apiUrl || undefined,
        model: model || undefined,
        protocol: (protocol || undefined) as any
      }

      setProgress(40)
      const response = await fetch('/api/case/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '生成失败，请重试')
      }

      if (data.success && data.data.caseId) {
        if (immersionLevel !== 'basic') {
          setCurrentPhase('images')
          setProgress(60)
        }

        // 获取案件详情
        const caseResponse = await fetch(`/api/case/${data.data.caseId}`)
        if (!caseResponse.ok) {
          throw new Error('获取案件详情失败')
        }
        const caseData = await caseResponse.json()

        if (caseData.success) {
          setCurrentPhase('complete')
          setProgress(100)
          saveCaseData(caseData.data as Case)

          // 延迟跳转到游戏页面，让用户看到完成状态
          setTimeout(() => {
            navigate(`/game/${data.data.caseId}`)
          }, 1500)
        } else {
          throw new Error(caseData.message || '获取案件详情失败')
        }
      } else {
        throw new Error(data.message || '生成失败，请重试')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成失败，请返回重试'
      // 检测是否是529服务器拥挤错误
      const isServerBusy = errorMessage.includes('529') || errorMessage.includes('服务器拥挤')
      setError(errorMessage)
      setErrorType(isServerBusy ? 'retry' : 'back')
      console.error(err)
    }
  }, [searchParams, saveCaseData, navigate])

  useEffect(() => {
    generateCase()
  }, [])

  const handleGoBack = () => {
    navigate('/create')
  }

  const handleRetry = () => {
    setError(null)
    setErrorType(null)
    generateCase()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-400 mb-4">案件生成失败</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {errorType === 'retry' ? (
              <>
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                >
                  重试
                </button>
                <button
                  onClick={handleGoBack}
                  className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  返回
                </button>
              </>
            ) : (
              <button
                onClick={handleGoBack}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
              >
                返回重新生成
              </button>
            )}
          </div>
          {errorType === 'retry' && (
            <p className="text-slate-500 text-sm mt-4">
              服务器繁忙，建议稍后重试
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      {/* 主标题 */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">正在构建你的案件</h1>
        <p className="text-slate-400">{PHASE_LABELS[currentPhase]}</p>
      </div>

      {/* 经典侦探插图 */}
      <div className="mb-8 relative">
        <div className="w-72 h-56 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl">
          <img
            src={randomIllustration}
            alt="侦探插图"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
            经典侦探故事
          </span>
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="w-full max-w-md mb-8">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-slate-400">
          <span>生成中...</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* 当前阶段描述 */}
      <div className="text-center mb-8 text-slate-300">
        {PHASE_DESCRIPTIONS[currentPhase]}
      </div>

      {/* 侦探名言卡片 */}
      <div className={`w-full max-w-lg bg-slate-800/50 rounded-xl p-6 border border-slate-700 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {currentStory && (
          <>
            <div className="text-xs text-primary-400 mb-2 uppercase tracking-wider">
              {currentStory.type === 'quote' ? '侦探名言' : currentStory.type === 'tip' ? '推理技巧' : '故事'}
            </div>
            <blockquote className="text-slate-200 text-lg mb-4 leading-relaxed">
              "{currentStory.content}"
            </blockquote>
            {currentStory.author && (
              <div className="text-right">
                <span className="text-slate-400 text-sm">—— {currentStory.author}</span>
                {currentStory.source && (
                  <span className="text-slate-500 text-xs block">{currentStory.source}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 预估时间 */}
      <div className="mt-6 text-slate-500 text-sm">
        {currentPhase === 'complete' ? '生成完成！正在跳转到游戏...' : '预计需要 30秒 - 2分钟'}
      </div>

      {/* 小提示 */}
      <div className="mt-8 text-slate-600 text-xs text-center max-w-sm">
        根据沉浸级别和网络状况，生成可能需要30秒至2分钟不等
      </div>
    </div>
  )
}