import { Link } from 'react-router-dom'

export default function HomePage() {
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
          
          <button
            className="w-full py-3 px-8 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            disabled
          >
            继续游戏 (开发中)
          </button>
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