import db from './database.js'
import type { CaseMedia } from '../types/index.js'

// 案件多媒体仓储
export class MediaRepository {
  // 保存案件多媒体
  static create(caseId: string, media: CaseMedia): void {
    // 删除旧的记录
    db.prepare('DELETE FROM case_media WHERE caseId = ?').run(caseId)

    // 插入场景图
    const insertImage = db.prepare(`
      INSERT INTO case_media (id, caseId, type, url)
      VALUES (?, ?, ?, ?)
    `)

    const { v4: uuidv4 } = require('uuid')

    media.sceneImages?.forEach((url, idx) => {
      insertImage.run(uuidv4(), caseId, `scene_${idx}`, url)
    })

    media.suspectImages?.forEach((url, idx) => {
      insertImage.run(uuidv4(), caseId, `suspect_${idx}`, url)
    })

    media.clueImages?.forEach((url, idx) => {
      insertImage.run(uuidv4(), caseId, `clue_${idx}`, url)
    })

    if (media.backgroundMusic) {
      insertImage.run(uuidv4(), caseId, 'bgm', media.backgroundMusic)
    }
  }

  // 获取案件多媒体
  static findByCaseId(caseId: string): CaseMedia | null {
    const rows = db.prepare('SELECT type, url FROM case_media WHERE caseId = ?').all(caseId) as { type: string, url: string }[]

    if (rows.length === 0) return null

    const media: CaseMedia = {
      sceneImages: [],
      suspectImages: [],
      clueImages: []
    }

    rows.forEach(row => {
      if (row.type === 'bgm') {
        media.backgroundMusic = row.url
      } else if (row.type.startsWith('scene_')) {
        media.sceneImages?.push(row.url)
      } else if (row.type.startsWith('suspect_')) {
        media.suspectImages?.push(row.url)
      } else if (row.type.startsWith('clue_')) {
        media.clueImages?.push(row.url)
      }
    })

    return media
  }

  // 删除案件多媒体
  static delete(caseId: string): void {
    db.prepare('DELETE FROM case_media WHERE caseId = ?').run(caseId)
  }
}
