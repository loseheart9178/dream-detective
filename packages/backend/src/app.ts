import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import caseRoutes from './routes/case.js'
import progressRoutes from './routes/progress.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())

// 路由
app.use('/api/case', caseRoutes)
app.use('/api/progress', progressRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '造梦侦探后端服务运行中' })
})

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  })
})

app.listen(PORT, () => {
  console.log(`🚀 造梦侦探后端服务已启动: http://localhost:${PORT}`)
})