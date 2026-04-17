import { useState, useEffect, useCallback } from 'react'
import type { UserProgress, QuestionAnswer, Case } from '../types'

const STORAGE_KEY = 'dream-detective-progress'
const CASES_STORAGE_KEY = 'dream-detective-cases'

export function useGameProgress() {
  const [savedProgress, setSavedProgress] = useState<UserProgress | null>(null)
  const [allProgress, setAllProgress] = useState<UserProgress[]>([])

  // 加载所有保存的进度
  useEffect(() => {
    loadAllProgress()
  }, [])

  const loadAllProgress = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const progressList: UserProgress[] = JSON.parse(stored)
        setAllProgress(progressList)
        // 找到最近未完成的进度
        const latestInProgress = progressList
          .filter(p => !p.completed)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
        if (latestInProgress) {
          setSavedProgress(latestInProgress)
        }
      }
    } catch (err) {
      console.error('加载进度失败:', err)
    }
  }, [])

  // 保存进度
  const saveProgress = useCallback((progress: UserProgress) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const progressList: UserProgress[] = stored ? JSON.parse(stored) : []

      // 更新或添加进度
      const existingIndex = progressList.findIndex(p => p.caseId === progress.caseId)
      if (existingIndex >= 0) {
        progressList[existingIndex] = progress
      } else {
        progressList.push(progress)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressList))
      setAllProgress(progressList)
      setSavedProgress(progress)
    } catch (err) {
      console.error('保存进度失败:', err)
    }
  }, [])

  // 删除进度
  const deleteProgress = useCallback((caseId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const progressList: UserProgress[] = stored ? JSON.parse(stored) : []
      const filtered = progressList.filter(p => p.caseId !== caseId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      setAllProgress(filtered)
      if (savedProgress?.caseId === caseId) {
        setSavedProgress(null)
      }
    } catch (err) {
      console.error('删除进度失败:', err)
    }
  }, [savedProgress])

  // 获取指定案件的进度
  const getProgress = useCallback((caseId: string): UserProgress | null => {
    return allProgress.find(p => p.caseId === caseId) || null
  }, [allProgress])

  // 创建新进度
  const createProgress = useCallback((caseId: string, caseTitle: string): UserProgress => {
    const newProgress: UserProgress = {
      caseId,
      caseTitle,
      collectedClues: [],
      askedQuestions: {},
      attempts: 0,
      completed: false,
      score: 0,
      startTime: new Date().toISOString()
    }
    saveProgress(newProgress)
    return newProgress
  }, [saveProgress])

  // 更新收集的线索
  const updateCollectedClues = useCallback((caseId: string, clueIds: string[]) => {
    const progress = getProgress(caseId)
    if (progress) {
      saveProgress({
        ...progress,
        collectedClues: clueIds
      })
    }
  }, [getProgress, saveProgress])

  // 更新询问记录
  const updateAskedQuestions = useCallback((
    caseId: string,
    suspectId: string,
    questions: QuestionAnswer[]
  ) => {
    const progress = getProgress(caseId)
    if (progress) {
      saveProgress({
        ...progress,
        askedQuestions: {
          ...progress.askedQuestions,
          [suspectId]: questions
        }
      })
    }
  }, [getProgress, saveProgress])

  // 标记完成
  const markCompleted = useCallback((caseId: string, score: number) => {
    const progress = getProgress(caseId)
    if (progress) {
      saveProgress({
        ...progress,
        completed: true,
        score,
        endTime: new Date().toISOString()
      })
    }
  }, [getProgress, saveProgress])

  // 增加尝试次数
  const incrementAttempts = useCallback((caseId: string) => {
    const progress = getProgress(caseId)
    if (progress) {
      saveProgress({
        ...progress,
        attempts: progress.attempts + 1
      })
    }
  }, [getProgress, saveProgress])

  // 保存案件数据到localStorage
  const saveCaseData = useCallback((caseData: Case) => {
    try {
      const stored = localStorage.getItem(CASES_STORAGE_KEY)
      const casesList: Case[] = stored ? JSON.parse(stored) : []
      const existingIndex = casesList.findIndex(c => c.id === caseData.id)
      if (existingIndex >= 0) {
        casesList[existingIndex] = caseData
      } else {
        casesList.push(caseData)
      }
      localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(casesList))
    } catch (err) {
      console.error('保存案件数据失败:', err)
    }
  }, [])

  // 从localStorage获取案件数据
  const getCaseData = useCallback((caseId: string): Case | null => {
    try {
      const stored = localStorage.getItem(CASES_STORAGE_KEY)
      if (stored) {
        const casesList: Case[] = JSON.parse(stored)
        return casesList.find(c => c.id === caseId) || null
      }
    } catch (err) {
      console.error('获取案件数据失败:', err)
    }
    return null
  }, [])

  // 删除案件数据
  const deleteCaseData = useCallback((caseId: string) => {
    try {
      const stored = localStorage.getItem(CASES_STORAGE_KEY)
      const casesList: Case[] = stored ? JSON.parse(stored) : []
      const filtered = casesList.filter(c => c.id !== caseId)
      localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(filtered))
    } catch (err) {
      console.error('删除案件数据失败:', err)
    }
  }, [])

  // 获取未完成的进度列表
  const inProgressGames = allProgress.filter(p => !p.completed)

  // 获取已完成的进度列表
  const completedGames = allProgress.filter(p => p.completed)

  return {
    savedProgress,
    allProgress,
    inProgressGames,
    completedGames,
    saveProgress,
    deleteProgress,
    getProgress,
    createProgress,
    updateCollectedClues,
    updateAskedQuestions,
    markCompleted,
    incrementAttempts,
    loadAllProgress,
    saveCaseData,
    getCaseData,
    deleteCaseData
  }
}