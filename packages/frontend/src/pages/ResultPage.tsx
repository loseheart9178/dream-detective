import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Case } from '../types'

export default function ResultPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSolution()
  }, [caseId])

  const fetchSolution = async () => {
    try {
      const response = await fetch(`/api/case/${caseId}/solution`)
      const data = await response.json()
      if (data.success) {
        setCaseData(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-slate-400">加载真相...</p>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>无法加载案件真相</p>
          <Link to="/" className="text-primary-400 mt-4 inline-block">返回首页</Link>
        </div>
      </div>
    )
  }

  const killer = caseData.suspects.find(s => s.id === caseData.solution.killerId)

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-primary-400 mb-2">案件真相</h1>
          <h2 className="text-xl text-slate-400">{caseData.title}</h2>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-red-400 mb-4">真凶</h3>
          <div className="bg-slate-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-slate-200">{killer?.name}</p>
            <p className="text-slate-400">{killer?.age}岁 · {killer?.occupation}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-primary-400 mb-4">作案手法</h3>
          <p className="text-slate-300 leading-relaxed">{caseData.solution.method}</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-primary-400 mb-4">作案动机</h3>
          <p className="text-slate-300 leading-relaxed">{caseData.solution.motive}</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-primary-400 mb-4">时间线</h3>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">
            {caseData.solution.stepByStep}
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-primary-400 mb-4">推理逻辑</h3>
          <p className="text-slate-300 leading-relaxed">{caseData.solution.logicExplanation}</p>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-lg"
          >
            开始新游戏
          </Link>
        </div>
      </div>
    </div>
  )
}