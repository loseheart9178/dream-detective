import { Router } from 'express'

const router = Router()

// 获取用户进度
router.get('/:caseId', (req, res) => {
  // TODO: 实现进度存储
  res.json({ 
    success: true, 
    data: {
      caseId: req.params.caseId,
      collectedClues: [],
      askedQuestions: {},
      attempts: 0,
      completed: false,
      score: 0
    }
  })
})

// 更新用户进度
router.post('/:caseId', (req, res) => {
  // TODO: 实现进度保存
  res.json({ success: true, message: '进度已保存' })
})

export default router