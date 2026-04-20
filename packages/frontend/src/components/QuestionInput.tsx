import { useState } from 'react'
import { QuestionDirectnessLabels, QuestionDirectnessColors, QuestionDirectness } from '../types'

interface QuestionInputProps {
  disabled: boolean
  onAskQuestion: (question: string, directness: number) => void
  presetQuestions?: string[]
}

const PRESET_QUESTIONS = [
  { text: '你当时在哪里?', directness: 2 as QuestionDirectness },
  { text: '你和死者关系如何?', directness: 2 as QuestionDirectness },
  { text: '你有什么要说的吗?', directness: 2 as QuestionDirectness }
]

function classifyQuestionDirectness(question: string): QuestionDirectness {
  const q = question.toLowerCase()

  const dodgyPatterns = [
    /(?:你是|是不是|是不是说).*凶手/,
    /你.*杀.*(?:他|她|死者)/,
    /(?:承认|坦白).*(?:犯罪|杀人)/,
    /你有.*嫌疑/,
    /(?:别|不要).*说谎|你在.*说谎/
  ]

  const suspiciousPatterns = [
    /为什么.*(?:杀|害|攻击)/,
    /(?:难道|是不是).*你/,
    /有.*什么.*动机/,
    /(?:不太|有点).*可疑|我.*怀疑/
  ]

  const subtlePatterns = [
    /那天.*晚.*一个人/,
    /最后.*见到.*时候/,
    /有.*什么.*看法/,
    /可以.*说.*一下/,
    /那天.*有.*人.*一起/
  ]

  if (dodgyPatterns.some(p => p.test(q))) return 0
  if (suspiciousPatterns.some(p => p.test(q))) return 1
  if (subtlePatterns.some(p => p.test(q))) return 3
  return 2
}

export default function QuestionInput({
  disabled,
  onAskQuestion,
  presetQuestions = PRESET_QUESTIONS.map(q => q.text)
}: QuestionInputProps) {
  const [customQuestion, setCustomQuestion] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  const currentDirectness = customQuestion.trim()
    ? classifyQuestionDirectness(customQuestion)
    : null

  const handleSubmit = async (question: string, directness: QuestionDirectness) => {
    if (!question.trim() || disabled) return

    if (directness === 0) {
      setShowWarning(true)
      await new Promise(r => setTimeout(r, 1500))
      setShowWarning(false)
    }

    onAskQuestion(question, directness)
    setCustomQuestion('')
  }

  return (
    <div className="space-y-3">
      {/* 预设问题 */}
      <div className="space-y-2">
        <p className="text-slate-400 text-sm">快速提问:</p>
        {presetQuestions.map((q, idx) => {
          const directness = PRESET_QUESTIONS[idx]?.directness || 2
          return (
            <button
              key={q}
              onClick={() => handleSubmit(q, directness)}
              disabled={disabled}
              className="block w-full text-left px-3 py-2 rounded text-sm bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-slate-300"
            >
              {q}
            </button>
          )
        })}
      </div>

      {/* 自定义问题输入 */}
      <div className="mt-4">
        <p className="text-slate-400 text-sm mb-2">自定义问题:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="输入你的问题..."
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && currentDirectness !== null) {
                handleSubmit(customQuestion, currentDirectness)
              }
            }}
            className="flex-1 bg-slate-600 text-slate-200 rounded px-3 py-2 disabled:opacity-50 placeholder-slate-400"
          />
          <button
            onClick={() => currentDirectness !== null && handleSubmit(customQuestion, currentDirectness)}
            disabled={disabled || !customQuestion.trim()}
            className="bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            询问
          </button>
        </div>

        {/* 直白度指示器 */}
        {currentDirectness !== null && customQuestion.trim() && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-slate-400">问题委婉度:</span>
            <div className="flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded text-white ${QuestionDirectnessColors[currentDirectness]}`}>
                {QuestionDirectnessLabels[currentDirectness]}
              </span>
              <span className="text-slate-500">
                {currentDirectness <= 1 ? '← 嫌疑人可能不配合' : currentDirectness >= 3 ? '更易获得真实回答 →' : ''}
              </span>
            </div>
          </div>
        )}

        {/* 危险警告 */}
        {showWarning && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded text-xs text-red-300">
            警告: 这个问题太过直白！嫌疑人可能会强烈否认或完全转移话题。
          </div>
        )}
      </div>
    </div>
  )
}