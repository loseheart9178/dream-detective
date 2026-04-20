import db from './database.js'
import type { Case, Victim, Suspect, Clue, Solution } from '../types/index.js'

// 案件仓储
export class CaseRepository {
  // 创建案件
  static create(caseData: Omit<Case, 'createdAt'>): string {
    const insert = db.prepare(`
      INSERT INTO cases (id, title, description, sceneDescription, victim, suspects, clues, solution, difficulty, keywords, createdAt)
      VALUES (@id, @title, @description, @sceneDescription, @victim, @suspects, @clues, @solution, @difficulty, @keywords, @createdAt)
    `)

    insert.run({
      id: caseData.id,
      title: caseData.title,
      description: caseData.description,
      sceneDescription: caseData.sceneDescription,
      victim: JSON.stringify(caseData.victim),
      suspects: JSON.stringify(caseData.suspects),
      clues: JSON.stringify(caseData.clues),
      solution: JSON.stringify(caseData.solution),
      difficulty: caseData.difficulty,
      keywords: caseData.keywords,
      createdAt: new Date().toISOString()
    })

    return caseData.id
  }

  // 获取案件
  static findById(id: string): Case | null {
    const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any
    if (!row) return null

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      sceneDescription: row.sceneDescription,
      victim: JSON.parse(row.victim) as Victim,
      suspects: JSON.parse(row.suspects) as Suspect[],
      clues: JSON.parse(row.clues) as Clue[],
      solution: JSON.parse(row.solution) as Solution,
      difficulty: row.difficulty,
      keywords: row.keywords,
      createdAt: row.createdAt
    }
  }

  // 获取所有案件（不包含 solution）
  static findAll(): Omit<Case, 'solution'>[] {
    const rows = db.prepare('SELECT * FROM cases').all() as any[]
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sceneDescription: row.sceneDescription,
      victim: JSON.parse(row.victim) as Victim,
      suspects: JSON.parse(row.suspects) as Suspect[],
      clues: JSON.parse(row.clues) as Clue[],
      difficulty: row.difficulty,
      keywords: row.keywords,
      createdAt: row.createdAt
    }))
  }

  // 删除案件
  static delete(id: string): void {
    db.prepare('DELETE FROM cases WHERE id = ?').run(id)
  }
}
