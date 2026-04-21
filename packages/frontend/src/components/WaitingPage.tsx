import { useState, useEffect } from 'react'
import { DETECTIVE_QUOTES, DetectiveStory } from '../types'

interface WaitingPageProps {
  currentPhase: 'text' | 'images' | 'audio' | 'complete'
  progress: number // 0-100
  estimatedTimeLeft?: number // 秒
  onCancel?: () => void
}

// 经典侦探插图URL
const DETECTIVE_ILLUSTRATIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // 放大镜
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop', // 推理
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop', // 法律
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca55?w=400&h=300&fit=crop', // 调查
  'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&h=300&fit=crop', // 线索
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

export default function WaitingPage({ currentPhase, progress, estimatedTimeLeft, onCancel }: WaitingPageProps) {
  const [currentStory, setCurrentStory] = useState<DetectiveStory | null>(null)
  const [fadeIn, setFadeIn] = useState(true)

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

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}分${secs}秒`
  }

  // 随机选择一个插图
const randomIllustration = DETECTIVE_ILLUSTRATIONS[Math.floor(Math.random() * DETECTIVE_ILLUSTRATIONS.length)]

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
        <div className="w-64 h-48 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl">
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
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-slate-400">
          <span>生成中...</span>
          <span>{progress.toFixed(0)}%</span>
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
      {estimatedTimeLeft && estimatedTimeLeft > 0 && (
        <div className="mt-6 text-slate-500 text-sm">
          预计还需: {formatTime(estimatedTimeLeft)}
        </div>
      )}

      {/* 取消按钮 */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-8 px-6 py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          取消生成
        </button>
      )}

      {/* 小提示 */}
      <div className="mt-8 text-slate-600 text-xs text-center max-w-sm">
        根据沉浸级别和网络状况，生成可能需要30秒至2分钟不等
      </div>
    </div>
  )
}