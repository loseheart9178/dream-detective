import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { Case, Clue, Suspect } from '../types'

type TabType = 'scene' | 'clues' | 'suspects' | 'submit'

export default function GamePage() {
  const { caseId } = useParams<{ caseId: string }>()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('scene')
  const [collectedClues, setCollectedClues] = useState<string[]>([])
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null)
  const [askedQuestions, setAskedQuestions] = useState<Record<string, string[]>>({})

  useEffect(() => {
    fetchCase()
  }, [caseId])

  const fetchCase = async () => {
    try {
      const response = await fetch(`/api/case/${caseId}`)
      const data = await response.json()
      if (data.success) {
        setCaseData(data.data)
      } else {
        setError(data.message || '加载案件失败')
      }
    } catch (err) {
      setError('网络错误')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCollectClue = (clue: Clue) => {
    if (!collectedClues.includes(clue.id)) {
      setCollectedClues([...collectedClues, clue.id])
    }
  }

  const handleAskQuestion = (suspectId: string, question: string) => {
    setAskedQuestions(prev => ({
      ...prev,
      [suspectId]: [...(prev[suspectId] || []), question]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-slate-400">加载案件中...</p>
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>{error || '案件不存在'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      {/* 案件标题 */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <h1 className="text-2xl font-bold text-primary-400">{caseData.title}</h1>
        <p className="text-slate-400 text-sm mt-1">难度: {'★'.repeat(caseData.difficulty)}</p>
      </div>

      {/* 标签导航 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'scene', label: '案发现场' },
          { key: 'clues', label: `线索 (${collectedClues.length}/${caseData.clues.length})` },
          { key: 'suspects', label: '嫌疑人' },
          { key: 'submit', label: '提交答案' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="bg-slate-800 rounded-lg p-6">
        {activeTab === 'scene' && (
          <div>
            <h2 className="text-xl font-bold text-slate-200 mb-4">案发现场</h2>
            <div className="text-slate-300 leading-relaxed mb-6">
              {caseData.sceneDescription}
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-red-400 mb-2">被害人</h3>
              <p className="text-slate-300"><strong>姓名:</strong> {caseData.victim.name}</p>
              <p className="text-slate-300"><strong>年龄:</strong> {caseData.victim.age}岁</p>
              <p className="text-slate-300"><strong>死因:</strong> {caseData.victim.causeOfDeath}</p>
              <p className="text-slate-300 mt-2">{caseData.victim.description}</p>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-slate-200 mb-2">案件背景</h3>
              <p className="text-slate-300">{caseData.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'clues' && (
          <div>
            <h2 className="text-xl font-bold text-slate-200 mb-4">线索收集</h2>
            <div className="space-y-3">
              {caseData.clues.map((clue) => {
                const isCollected = collectedClues.includes(clue.id)
                return (
                  <div
                    key={clue.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      isCollected ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => handleCollectClue(clue)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-300 font-bold">
                          {isCollected ? clue.location : '???'}
                        </p>
                        <p className="text-slate-400 mt-1">
                          {isCollected ? clue.description : '点击以发现线索'}
                        </p>
                      </div>
                      {isCollected && (
                        <span className="text-green-400">✓</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'suspects' && (
          <div>
            <h2 className="text-xl font-bold text-slate-200 mb-4">嫌疑人</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseData.suspects.map((suspect) => (
                <div
                  key={suspect.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedSuspect?.id === suspect.id
                      ? 'bg-slate-600 ring-2 ring-primary-500'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  onClick={() => setSelectedSuspect(suspect)}
                >
                  <p className="text-slate-200 font-bold text-lg">{suspect.name}</p>
                  <p className="text-slate-400 text-sm">{suspect.age}岁 · {suspect.occupation}</p>
                  <p className="text-slate-500 text-sm mt-1">与死者关系: {suspect.relationToVictim}</p>
                </div>
              ))}
            </div>
            
            {selectedSuspect && (
              <div className="mt-6 bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-slate-200 mb-3">
                  {selectedSuspect.name}的详细信息
                </h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong>动机:</strong> {selectedSuspect.motive}</p>
                  <p><strong>不在场证明:</strong> {selectedSuspect.alibi}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-slate-400 text-sm">询问问题:</p>
                  {['你当时在哪里?', '你和死者关系如何?', '你有什么要说的吗?'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAskQuestion(selectedSuspect.id, q)}
                      className="block w-full text-left px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-slate-300 text-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                {askedQuestions[selectedSuspect.id]?.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-800 rounded">
                    <p className="text-slate-400 text-sm mb-2">已询问:</p>
                    {askedQuestions[selectedSuspect.id].map((q, i) => (
                      <p key={i} className="text-slate-300 text-sm">• {q}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submit' && (
          <SubmitForm caseId={caseId!} suspects={caseData.suspects} />
        )}
      </div>
    </div>
  )
}

function SubmitForm({ caseId, suspects }: { caseId: string; suspects: Suspect[] }) {
  const [killerId, setKillerId] = useState('')
  const [explanation, setExplanation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ correct: boolean; score: number; feedback: string } | null>(null)

  const handleSubmit = async () => {
    if (!killerId || !explanation.trim()) {
      alert('请选择凶手并说明推理过程')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/case/${caseId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ killerId, explanation })
      })
      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <h2 className={`text-2xl font-bold mb-4 ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
          {result.correct ? '恭喜破案成功！' : '推理有误'}
        </h2>
        <p className="text-slate-300 mb-2">得分: {result.score}/100</p>
        <p className="text-slate-400 mb-4">{result.feedback}</p>
        <a
          href={`/result/${caseId}`}
          className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg"
        >
          查看真相
        </a>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-200 mb-4">提交答案</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2">指认凶手</label>
          <div className="space-y-2">
            {suspects.map((suspect) => (
              <button
                key={suspect.id}
                onClick={() => setKillerId(suspect.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  killerId === suspect.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {suspect.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-2">推理过程</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="请说明你的推理过程和依据..."
            className="w-full h-32 bg-slate-700 text-slate-200 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {submitting ? '验证中...' : '提交答案'}
        </button>
      </div>
    </div>
  )
}