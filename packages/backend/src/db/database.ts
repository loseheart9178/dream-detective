import Database, { Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据库路径
const dbPath = path.join(__dirname, '../../data/cases.db')

// 确保数据目录存在
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db: DatabaseType = new Database(dbPath)

// 初始化数据库表
db.exec(`
  -- 案件表
  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    sceneDescription TEXT,
    victim TEXT,
    suspects TEXT,
    clues TEXT,
    solution TEXT,
    difficulty INTEGER,
    keywords TEXT,
    createdAt TEXT,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  -- 用户进度表
  CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    caseId TEXT NOT NULL,
    collectedClues TEXT DEFAULT '[]',
    askedQuestions TEXT DEFAULT '{}',
    attempts INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    startTime TEXT,
    endTime TEXT,
    FOREIGN KEY (caseId) REFERENCES cases(id)
  )
`)

db.exec(`
  -- 案件多媒体表
  CREATE TABLE IF NOT EXISTS case_media (
    id TEXT PRIMARY KEY,
    caseId TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caseId) REFERENCES cases(id)
  )
`)

// 插入示例数据（如果数据库为空）
const caseCount = db.prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number }
if (caseCount.count === 0) {
  console.log('正在插入示例案件数据...')

  const sampleCases = [
    {
      id: 'sample-1',
      title: '商业大亨之死',
      description: '一个风雨交加的夜晚，知名企业家刘建国被发现死在自己的书房中。',
      sceneDescription: '书房内一片狼藉，死者倒在书桌旁，胸口有一处致命伤。',
      victim: JSON.stringify({
        name: '刘建国',
        age: 52,
        description: '一位成功的企业家，经营着一家上市公司。',
        causeOfDeath: '被利器刺中胸口，当场死亡'
      }),
      suspects: JSON.stringify([
        { id: 's1', name: '张明', age: 45, occupation: '公司 CEO', relationToVictim: '生意伙伴', motive: '因商业纠纷欠下巨额债务', alibi: '案发时在办公室开会', lies: '声称与死者关系很好', secret: '实际上正在策划收购死者公司' },
        { id: 's2', name: '李婷', age: 32, occupation: '私人助理', relationToVictim: '死者助理', motive: '发现死者有不正当关系的证据', alibi: '案发时在餐厅吃晚餐', lies: '说死者是个好人', secret: '实际上被死者威胁' },
        { id: 's3', name: '王强', age: 28, occupation: '保安', relationToVictim: '死者下属', motive: '被死者解雇后怀恨在心', alibi: '案发时在值班室看监控', lies: '声称没看到任何人进出', secret: '实际上看到了真凶但被收买' },
        { id: 's4', name: '陈雪', age: 38, occupation: '医生', relationToVictim: '死者前妻', motive: '争夺孩子抚养权失败', alibi: '案发时在医院值班', lies: '说已经放下了过去', secret: '实际上一直无法释怀' }
      ]),
      clues: JSON.stringify([
        { id: 'c1', location: '死者书房', description: '一份被撕碎的商业合同，上面有张明的签名', isFatal: false, isRedHerring: false, relatedTo: 's1' },
        { id: 'c2', location: '死者办公桌', description: '一条沾有血迹的丝巾，与李婷的款式相同', isFatal: false, isRedHerring: true, relatedTo: 's2' },
        { id: 'c3', location: '案发现场', description: '一把带有指纹的刀，指纹属于王强', isFatal: false, isRedHerring: true, relatedTo: 's3' },
        { id: 'c4', location: '死者保险箱', description: '一张银行转账记录，显示死者向张明账户转入大额资金', isFatal: true, isRedHerring: false, relatedTo: 's1' },
        { id: 'c5', location: '监控录像', description: '案发时间张明的车出现在死者家附近', isFatal: true, isRedHerring: false, relatedTo: 's1' },
        { id: 'c6', location: '死者手机', description: '与张明的短信记录，显示两人有激烈争吵', isFatal: true, isRedHerring: false, relatedTo: 's1' }
      ]),
      solution: JSON.stringify({
        killerId: 's1',
        method: '张明趁死者独自在家时进入，用事先准备好的刀刺杀了死者。他事先收买了保安王强，让他在监控中删除了自己的进出记录。',
        motive: '张明因商业纠纷欠下巨额债务，试图通过杀害死者来逃避债务并收购其公司。',
        stepByStep: '1. 晚上 8 点，张明到达死者家附近\n2. 8:30，趁死者独自在家时进入\n3. 两人发生争执，张明刺杀了死者\n4. 9:00，张明离开，并收买保安删除监控\n5. 9:30，尸体被发现',
        logicExplanation: '关键线索是转账记录和短信记录，证明张明有动机。监控录像显示他的车在现场。'
      }),
      difficulty: 2,
      keywords: '商业 办公室 谋杀',
      createdAt: new Date().toISOString()
    }
  ]

  const insert = db.prepare(`
    INSERT INTO cases (id, title, description, sceneDescription, victim, suspects, clues, solution, difficulty, keywords, createdAt)
    VALUES (@id, @title, @description, @sceneDescription, @victim, @suspects, @clues, @solution, @difficulty, @keywords, @createdAt)
  `)

  const insertMany = db.transaction((cases) => {
    for (const c of cases) {
      insert.run(c)
    }
  })

  insertMany(sampleCases)
  console.log('示例案件数据插入完成')
}

export default db
