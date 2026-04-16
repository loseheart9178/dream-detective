import { Link, useNavigate } from 'react-router-dom'
import { useGameProgress } from '../hooks/useGameProgress'

export default function HomePage() {
  const navigate = useNavigate()
  const { inProgressGames, completedGames, deleteProgress } = useGameProgress()

  const handleContinue = (caseId: string) => {
    navigate(`/game/${caseId}`)
  }

  const handleDelete = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个存档吗？')) {
      deleteProgress(caseId)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-primary-400 mb-4">
          造梦侦探
        </h1>
        <h2 className="text-2xl text-slate-400 mb-8">
          逻辑重构
        </h2>
        <p className="text-slate-300 mb-12 text-lg leading-relaxed">
          输入关键词，AI为你生成独一无二的谋杀解谜案件。
          收集线索，询问嫌疑人，运用推理找出真凶！
        </p>

        <div className="space-y-4">
          <Link
            to="/create"
            className="block w-full py-4 px-8 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg transition-colors text-xl"
          >
            开始新游戏
          </Link>

          {inProgressGames.length > 0 && (
            <div className="mt-6">
              <h3 className="text-slate-300 mb-3 text-left">继续游戏</h3>
              <div className="space-y-2">
                {inProgressGames.map((progress) => (
                  <div
                    key={progress.caseId}
                    onClick={() => handleContinue(progress.caseId)}
                    className="flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-slate-200 font-bold">{progress.caseTitle}</p>
                      <p className="text-slate-500 text-sm">
                        线索: {progress.collectedClues.length} | 尝试: {progress.attempts}次
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(progress.caseId, e)}
                      className="text-slate-500 hover:text-red-400 px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedGames.length > 0 && (
            <div className="mt-6">
              <h3 className="text-slate-300 mb-3 text-left">已破案</h3>
              <div className="space-y-2">
                {completedGames.map((progress) => (
                  <div
                    key={progress.caseId}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="text-left">
                      <p className="text-slate-400 font-bold">{progress.caseTitle}</p>
                      <p className="text-slate-600 text-sm">
                        得分: {progress.score}/100
                      </p>
                    </div>
                    <span className="text-green-400 text-sm">✓ 已破案</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h3 className="text-slate-400 mb-4">推荐关键词</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {['游轮', '古堡', '雪山', '医院', '学校', '暴风雨'].map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}