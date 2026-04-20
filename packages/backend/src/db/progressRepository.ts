import db from './database.js'

// 用户进度仓储
export class ProgressRepository {
  // 创建或更新进度
  static upsert(caseId: string, caseTitle: string): string {
    const id = `${caseId}-${Date.now()}`
    const insert = db.prepare(`
      INSERT OR REPLACE INTO user_progress (id, caseId, collectedClues, askedQuestions, attempts, completed, score, startTime)
      VALUES (?, ?, '[]', '{}', 0, 0, 0, ?)
    `)
    insert.run(id, caseId, new Date().toISOString())
    return id
  }

  // 获取进度
  static findByCaseId(caseId: string): any | null {
    return db.prepare('SELECT * FROM user_progress WHERE caseId = ?').get(caseId) as any
  }

  // 更新收集的线索
  static updateCollectedClues(caseId: string, clues: string[]): void {
    db.prepare(`
      UPDATE user_progress SET collectedClues = ? WHERE caseId = ?
    `).run(JSON.stringify(clues), caseId)
  }

  // 更新询问的问题
  static updateAskedQuestions(caseId: string, questions: Record<string, any>): void {
    db.prepare(`
      UPDATE user_progress SET askedQuestions = ? WHERE caseId = ?
    `).run(JSON.stringify(questions), caseId)
  }

  // 更新尝试次数
  static incrementAttempts(caseId: string): void {
    db.prepare(`
      UPDATE user_progress SET attempts = attempts + 1 WHERE caseId = ?
    `).run(caseId)
  }

  // 标记完成
  static markCompleted(caseId: string, score: number): void {
    db.prepare(`
      UPDATE user_progress SET completed = 1, score = ?, endTime = ? WHERE caseId = ?
    `).run(score, new Date().toISOString(), caseId)
  }

  // 删除进度
  static delete(caseId: string): void {
    db.prepare('DELETE FROM user_progress WHERE caseId = ?').run(caseId)
  }

  // 获取所有进度
  static findAll(): any[] {
    return db.prepare('SELECT * FROM user_progress').all() as any[]
  }
}
