import { Router } from 'express'
import { generateCase, getCase, submitAnswer, getSolution, askSuspect } from '../services/caseService.js'

const router = Router()

// 生成案件
router.post('/generate', async (req, res) => {
  try {
    const { keywords, difficulty, numSuspects, immersionLevel, apiKey, apiProvider, apiUrl, model, protocol } = req.body
    const result = await generateCase({
      keywords,
      difficulty,
      numSuspects,
      immersionLevel,
      apiKey,
      apiProvider,
      apiUrl,
      model,
      protocol
    })
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('生成案件失败:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '生成案件失败'
    })
  }
})

// 获取案件
router.get('/:id', async (req, res) => {
  try {
    const caseData = await getCase(req.params.id)
    if (!caseData) {
      return res.status(404).json({ success: false, message: '案件不存在' })
    }
    // 隐藏答案
    const { solution: _, ...publicCase } = caseData as any
    res.json({ success: true, data: publicCase })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取案件失败'
    })
  }
})

// 提交答案
router.post('/:id/submit', async (req, res) => {
  try {
    const { killerId, explanation } = req.body
    const result = await submitAnswer(req.params.id, killerId, explanation)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : '提交答案失败'
    })
  }
})

// 获取真相
router.get('/:id/solution', async (req, res) => {
  try {
    const solution = await getSolution(req.params.id)
    res.json({ success: true, data: solution })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取真相失败'
    })
  }
})

// 询问嫌疑人
router.post('/:id/ask', async (req, res) => {
  try {
    const { suspectId, question } = req.body
    if (!suspectId || !question) {
      return res.status(400).json({
        success: false,
        message: '请提供嫌疑人ID和问题'
      })
    }
    const result = await askSuspect(req.params.id, suspectId, question)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '询问失败'
    })
  }
})

export default router