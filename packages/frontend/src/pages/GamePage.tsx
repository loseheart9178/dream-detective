import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { Case, Clue, Suspect, AskSuspectResponse, QuestionAnswer, QuestionDirectness, CaseMedia } from '../types'
import { useGameProgress } from '../hooks/useGameProgress'
import { useImmersionConfig } from '../hooks/useImmersionConfig'
import QuestionInput from '../components/QuestionInput'
import ImageModal from '../components/ImageModal'
import AudioPlayer from '../components/AudioPlayer'

type TabType = 'scene' | 'clues' | 'suspects' | 'submit'

export default function GamePage() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('scene')
  const [collectedClues, setCollectedClues] = useState<string[]>([])
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null)
  const [askedQuestions, setAskedQuestions] = useState<Record<string, QuestionAnswer[]>>({})
  const [askingQuestion, setAskingQuestion] = useState(false)
  const [showSaveNotice, setShowSaveNotice] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // 多媒体相关状态
  const [caseMedia, setCaseMedia] = useState<CaseMedia | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [ttsAudioUrl] = useState<string | null>(null)

  const {
    getProgress,
    createProgress,
    updateCollectedClues,
    updateAskedQuestions,
    markCompleted,
    incrementAttempts,
    deleteProgress,
    saveCaseData,
    getCaseData
  } = useGameProgress()

  const { config: immersionConfig } = useImmersionConfig()

  // 显示保存提示
  const showSaveMessage = useCallback(() => {
    setShowSaveNotice(true)
    setTimeout(() => setShowSaveNotice(false), 2000)
  }, [])

  // 加载案件和进度
  useEffect(() => {
    if (caseId) {
      fetchCase()
    }
  }, [caseId])

  const fetchCase = async () => {
    try {
      // 先尝试从localStorage获取案件数据
      const localCaseData = getCaseData(caseId!)
      if (localCaseData) {
        setCaseData(localCaseData)
        // 恢复进度
        const savedProgress = getProgress(caseId!)
        if (savedProgress) {
          setCollectedClues(savedProgress.collectedClues)
          const questions: Record<string, QuestionAnswer[]> = {}
          for (const [suspectId, qaList] of Object.entries(savedProgress.askedQuestions)) {
            questions[suspectId] = qaList as QuestionAnswer[]
          }
          setAskedQuestions(questions)
        } else {
          createProgress(caseId!, localCaseData.title)
        }
        setLoading(false)
        return
      }

      // localStorage没有，从后端获取
      const response = await fetch(`/api/case/${caseId}`)
      const data = await response.json()
      if (data.success) {
        setCaseData(data.data)
        // 保存到localStorage
        saveCaseData(data.data)
        // 恢复进度
        const savedProgress = getProgress(caseId!)
        if (savedProgress) {
          setCollectedClues(savedProgress.collectedClues)
          const questions: Record<string, QuestionAnswer[]> = {}
          for (const [suspectId, qaList] of Object.entries(savedProgress.askedQuestions)) {
            questions[suspectId] = qaList as QuestionAnswer[]
          }
          setAskedQuestions(questions)
        } else {
          createProgress(caseId!, data.data.title)
        }
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

  // 获取案件多媒体数据
  const fetchCaseMedia = useCallback(async () => {
    if (!caseId) return
    try {
      const response = await fetch(`/api/case/${caseId}/media`)
      const data = await response.json()
      if (data.success && data.data) {
        setCaseMedia(data.data)
      }
    } catch (err) {
      console.error('获取案件多媒体失败', err)
    }
  }, [caseId])

  useEffect(() => {
    if (caseId && immersionConfig.level !== 'basic') {
      fetchCaseMedia()
    }
  }, [caseId, immersionConfig.level, fetchCaseMedia])

  // 保存线索进度
  useEffect(() => {
    if (caseId && collectedClues.length > 0) {
      updateCollectedClues(caseId, collectedClues)
      showSaveMessage()
    }
  }, [collectedClues, caseId, updateCollectedClues, showSaveMessage])

  // 保存问答进度
  useEffect(() => {
    if (caseId && Object.keys(askedQuestions).length > 0) {
      // 保存所有嫌疑人的问答
      for (const [suspectId, questions] of Object.entries(askedQuestions)) {
        if (questions.some(qa => qa.answer && !qa.isLoading)) {
          updateAskedQuestions(caseId, suspectId, questions.filter(qa => !qa.isLoading))
          showSaveMessage()
        }
      }
    }
  }, [askedQuestions, caseId, updateAskedQuestions, showSaveMessage])

  const handleCollectClue = (clue: Clue) => {
    if (!collectedClues.includes(clue.id)) {
      setCollectedClues([...collectedClues, clue.id])
    }
  }

  const handleAskQuestion = async (suspectId: string, question: string, directness: number) => {
    // 检查是否已经问过这个问题
    const existingQuestions = askedQuestions[suspectId] || []
    if (existingQuestions.some(qa => qa.question === question)) {
      return
    }

    // 添加加载状态
    setAskedQuestions(prev => ({
      ...prev,
      [suspectId]: [...(prev[suspectId] || []), { question, answer: '', isLoading: true, directness: directness as QuestionDirectness }]
    }))

    setAskingQuestion(true)

    try {
      const response = await fetch(`/api/case/${caseId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspectId, question })
      })
      const data = await response.json()

      if (data.success) {
        const answerData: AskSuspectResponse = data.data
        // 更新回答
        setAskedQuestions(prev => ({
          ...prev,
          [suspectId]: prev[suspectId].map(qa =>
            qa.question === question
              ? { ...qa, answer: answerData.answer, isLoading: false }
              : qa
          )
        }))
      } else {
        // 错误处理
        setAskedQuestions(prev => ({
          ...prev,
          [suspectId]: prev[suspectId].map(qa =>
            qa.question === question
              ? { ...qa, answer: '对方似乎不愿回答...', isLoading: false }
              : qa
          )
        }))
      }
    } catch (err) {
      console.error(err)
      setAskedQuestions(prev => ({
        ...prev,
        [suspectId]: prev[suspectId].map(qa =>
          qa.question === question
            ? { ...qa, answer: '网络错误，请稍后重试', isLoading: false }
            : qa
        )
      }))
    } finally {
      setAskingQuestion(false)
    }
  }

  // 重新生成案件
  const handleRegenerate = async (saveCurrent: boolean) => {
    if (!caseData) return

    setRegenerating(true)
    try {
      // 如果需要保存当前案件，标记为已保存
      if (saveCurrent && caseId) {
        // 当前案件已自动保存，无需额外操作
      } else {
        // 删除当前进度
        deleteProgress(caseId!)
      }

      // 生成新案件
      const response = await fetch('/api/case/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: caseData.keywords,
          difficulty: caseData.difficulty,
          numSuspects: caseData.suspects.length
        })
      })

      const data = await response.json()
      if (data.success && data.data.caseId) {
        // 获取并保存新案件数据到localStorage
        const caseResponse = await fetch(`/api/case/${data.data.caseId}`)
        const caseResult = await caseResponse.json()
        if (caseResult.success) {
          saveCaseData(caseResult.data)
        }
        navigate(`/game/${data.data.caseId}`)
      } else {
        alert('生成失败，请重试')
      }
    } catch (err) {
      console.error(err)
      alert('网络错误')
    } finally {
      setRegenerating(false)
      setShowRegenerateModal(false)
    }
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
      {/* 保存提示 - 左上角 */}
      {showSaveNotice && (
        <div className="fixed top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          进度已保存
        </div>
      )}

      {/* 案件标题 */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary-400">{caseData.title}</h1>
            <p className="text-slate-400 text-sm mt-1">难度: {'★'.repeat(caseData.difficulty)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRegenerateModal(true)}
              className="text-slate-400 hover:text-amber-400 text-sm px-3 py-1 bg-slate-700 rounded flex items-center gap-1"
            >
              <span>🔄</span> 重新生成
            </button>
            <Link
              to="/"
              className="text-slate-400 hover:text-slate-200 text-sm px-3 py-1 bg-slate-700 rounded"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>

      {/* 进度状态 */}
      <div className="bg-slate-800/50 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">
            线索: <span className="text-primary-400">{collectedClues.length}</span>/{caseData.clues.length}
          </span>
          <span className="text-slate-400">
            询问: <span className="text-primary-400">{Object.values(askedQuestions).flat().filter(qa => qa.answer).length}</span>次
          </span>
        </div>
        <span className="text-green-400 text-sm flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          已自动保存
        </span>
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

            {/* 案发现场图片 */}
            {immersionConfig.level !== 'basic' && caseMedia?.sceneImages && caseMedia.sceneImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-slate-200 mb-3">案发现场</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caseMedia.sceneImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`案发现场 ${idx + 1}`}
                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clues' && (
          <div>
            <h2 className="text-xl font-bold text-slate-200 mb-4">线索收集</h2>
            <div className="space-y-3">
              {caseData.clues.map((clue) => {
                const isCollected = collectedClues.includes(clue.id)
                const clueImage = caseMedia?.clueImages?.[caseData.clues.indexOf(clue)]
                return (
                  <div
                    key={clue.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      isCollected ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => handleCollectClue(clue)}
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
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
                      {/* 线索图片 */}
                      {isCollected && immersionConfig.level !== 'basic' && clueImage && (
                        <div
                          className="w-20 h-20 rounded overflow-hidden cursor-pointer flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); setSelectedImage(clueImage); }}
                        >
                          <img src={clueImage} alt={clue.location} className="w-full h-full object-cover" />
                        </div>
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
              {caseData.suspects.map((suspect, idx) => {
                const suspectImage = caseMedia?.suspectImages?.[idx]
                return (
                  <div
                    key={suspect.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedSuspect?.id === suspect.id
                        ? 'bg-slate-600 ring-2 ring-primary-500'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => setSelectedSuspect(suspect)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 嫌疑人头像 */}
                      {immersionConfig.level !== 'basic' && suspectImage ? (
                        <div
                          className="w-12 h-12 rounded-full overflow-hidden cursor-pointer flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); setSelectedImage(suspectImage); }}
                        >
                          <img src={suspectImage} alt={suspect.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-slate-400 flex-shrink-0">
                          {suspect.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-slate-200 font-bold text-lg">{suspect.name}</p>
                        <p className="text-slate-400 text-sm">{suspect.age}岁 · {suspect.occupation}</p>
                        <p className="text-slate-500 text-sm mt-1">与死者关系: {suspect.relationToVictim}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedSuspect && (
              <div className="mt-6 bg-slate-700 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {/* 选中嫌疑人头像 */}
                  {immersionConfig.level !== 'basic' && caseMedia?.suspectImages && (
                    <div
                      className="w-24 h-24 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                      onClick={() => {
                        const idx = caseData.suspects.findIndex(s => s.id === selectedSuspect.id)
                        const img = caseMedia?.suspectImages?.[idx]
                        if (img) setSelectedImage(img)
                      }}
                    >
                      <img
                        src={caseMedia.suspectImages[caseData.suspects.findIndex(s => s.id === selectedSuspect.id)]}
                        alt={selectedSuspect.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-200 mb-3">
                      {selectedSuspect.name}的详细信息
                    </h3>
                    <div className="space-y-2 text-slate-300">
                      <p><strong>动机:</strong> {selectedSuspect.motive}</p>
                      <p><strong>不在场证明:</strong> {selectedSuspect.alibi}</p>
                    </div>
                  </div>
                </div>
                {/* 新的问题组件 */}
                <div className="mt-4">
                  <p className="text-slate-400 text-sm mb-2">询问问题:</p>
                  <QuestionInput
                    disabled={askingQuestion}
                    onAskQuestion={(q, d) => handleAskQuestion(selectedSuspect.id, q, d)}
                  />
                </div>
                {askedQuestions[selectedSuspect.id]?.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-slate-400 text-sm">对话记录:</p>
                    {askedQuestions[selectedSuspect.id].map((qa, i) => (
                      <div key={i} className="p-3 bg-slate-800 rounded">
                        <p className="text-primary-400 text-sm mb-2">
                          <strong>你:</strong> {qa.question}
                        </p>
                        {qa.isLoading ? (
                          <p className="text-slate-500 text-sm italic">正在思考中...</p>
                        ) : (
                          <div className="flex items-start gap-2">
                            <p className="text-slate-300 text-sm flex-1">
                              <strong>{selectedSuspect.name}:</strong> {qa.answer}
                            </p>
                            {/* TTS 语音播放按钮 */}
                            {immersionConfig.level !== 'basic' && qa.answer && (
                              <AudioPlayer
                                src={ttsAudioUrl || undefined}
                                type="tts"
                                label="朗读"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submit' && (
          <SubmitForm
            caseId={caseId!}
            suspects={caseData.suspects}
            onCorrectAnswer={(score) => {
              markCompleted(caseId!, score)
              navigate(`/result/${caseId}`)
            }}
            onWrongAnswer={() => incrementAttempts(caseId!)}
          />
        )}
      </div>

      {/* 重新生成案件弹窗 */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-200 mb-4">重新生成案件</h2>
            <p className="text-slate-400 mb-6">
              当前案件进度将会丢失。是否保存当前案件后再生成新案件？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateModal(false)}
                disabled={regenerating}
                className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => handleRegenerate(false)}
                disabled={regenerating}
                className="flex-1 py-2 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500 disabled:opacity-50"
              >
                不保存，直接生成
              </button>
              <button
                onClick={() => handleRegenerate(true)}
                disabled={regenerating}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50"
              >
                保存并生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片查看弹窗 */}
      {selectedImage && (
        <ImageModal
          src={selectedImage}
          alt="案件图片"
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  )
}

function SubmitForm({
  caseId,
  suspects,
  onCorrectAnswer,
  onWrongAnswer
}: {
  caseId: string
  suspects: Suspect[]
  onCorrectAnswer: (score: number) => void
  onWrongAnswer: () => void
}) {
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
        if (data.data.correct) {
          onCorrectAnswer(data.data.score)
        } else {
          onWrongAnswer()
        }
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
        <button
          onClick={() => result.correct ? onCorrectAnswer(result.score) : null}
          className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg"
        >
          {result.correct ? '查看真相' : '继续推理'}
        </button>
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