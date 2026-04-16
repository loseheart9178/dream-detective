import { v4 as uuidv4 } from 'uuid'
import type { Case, Suspect, Clue, Victim, Solution } from '../types.js'

// 类型定义
type GeneratedCaseData = Omit<Case, 'id' | 'difficulty' | 'keywords' | 'createdAt'>

// 内存存储 (开发阶段)
const cases: Map<string, Case> = new Map()

export async function generateCase(params: {
  keywords: string
  difficulty: number
  numSuspects: number
}): Promise<{ caseId: string }> {
  const { keywords, difficulty, numSuspects } = params
  
  // 调用AI服务生成案件
  const caseData = await generateCaseWithAI(keywords, difficulty, numSuspects)
  const caseId = uuidv4()
  
  const newCase: Case = {
    id: caseId,
    ...caseData,
    difficulty,
    keywords,
    createdAt: new Date().toISOString()
  }
  
  cases.set(caseId, newCase)
  return { caseId }
}

export async function getCase(id: string): Promise<Case | null> {
  return cases.get(id) || null
}

export async function submitAnswer(
  caseId: string, 
  killerId: string, 
  explanation: string
): Promise<{ correct: boolean; score: number; feedback: string; solution?: Solution }> {
  const caseData = cases.get(caseId)
  if (!caseData) {
    throw new Error('案件不存在')
  }

  const isCorrect = killerId === caseData.solution.killerId
  
  let score = 0
  let feedback = ''

  if (isCorrect) {
    // 基础分50分
    score = 50
    // 解释完整度加分
    if (explanation.length > 50) score += 20
    if (explanation.length > 100) score += 10
    // 提到关键线索加分
    if (explanation.includes('线索') || explanation.includes('证据')) score += 10
    if (explanation.includes('时间') || explanation.includes('不在场证明')) score += 10
    
    feedback = '推理正确！你已经成功找到了真凶。'
  } else {
    feedback = '推理有误。请重新审视线索，找出真正的凶手。'
  }

  return {
    correct: isCorrect,
    score: Math.min(score, 100),
    feedback,
    solution: isCorrect ? caseData.solution : undefined
  }
}

export async function getSolution(caseId: string): Promise<Case | null> {
  return cases.get(caseId) || null
}

// AI生成案件
async function generateCaseWithAI(
  keywords: string, 
  difficulty: number, 
  numSuspects: number
): Promise<GeneratedCaseData> {
  // 检查是否配置了API
  const apiKey = process.env.OPENAI_API_KEY || process.env.DASHSCOPE_API_KEY
  
  if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'your_dashscope_api_key_here') {
    // 返回示例案件用于开发测试
    return generateSampleCase(numSuspects)
  }

  // 调用真实AI API
  return generateCaseWithRealAI(keywords, difficulty, numSuspects)
}

// 示例案件 (用于开发测试)
function generateSampleCase(numSuspects: number): GeneratedCaseData {
  const suspects: Suspect[] = [
    {
      id: 's1',
      name: '张明',
      age: 45,
      occupation: '公司CEO',
      relationToVictim: '生意伙伴',
      motive: '因商业纠纷欠下巨额债务',
      alibi: '案发时在办公室开会',
      lies: '声称与死者关系很好',
      secret: '实际上正在策划收购死者公司'
    },
    {
      id: 's2',
      name: '李婷',
      age: 32,
      occupation: '私人助理',
      relationToVictim: '死者助理',
      motive: '发现死者有不正当关系的证据',
      alibi: '案发时在餐厅吃晚餐',
      lies: '说死者是个好人',
      secret: '实际上被死者威胁'
    },
    {
      id: 's3',
      name: '王强',
      age: 28,
      occupation: '保安',
      relationToVictim: '死者下属',
      motive: '被死者解雇后怀恨在心',
      alibi: '案发时在值班室看监控',
      lies: '声称没看到任何人进出',
      secret: '实际上看到了真凶但被收买'
    },
    {
      id: 's4',
      name: '陈雪',
      age: 38,
      occupation: '医生',
      relationToVictim: '死者前妻',
      motive: '争夺孩子抚养权失败',
      alibi: '案发时在医院值班',
      lies: '说已经放下了过去',
      secret: '实际上一直无法释怀'
    },
    {
      id: 's5',
      name: '赵伟',
      age: 50,
      occupation: '律师',
      relationToVictim: '死者法律顾问',
      motive: '发现死者挪用公款',
      alibi: '案发时在事务所',
      lies: '说死者是个守法公民',
      secret: '实际上帮死者做假账'
    }
  ].slice(0, numSuspects)

  const clues: Clue[] = [
    {
      id: 'c1',
      location: '死者书房',
      description: '一份被撕碎的商业合同，上面有张明的签名',
      isFatal: false,
      isRedHerring: false,
      relatedTo: 's1'
    },
    {
      id: 'c2',
      location: '死者办公桌',
      description: '一条沾有血迹的丝巾，与李婷的款式相同',
      isFatal: false,
      isRedHerring: true,
      relatedTo: 's2'
    },
    {
      id: 'c3',
      location: '案发现场',
      description: '一把带有指纹的刀，指纹属于王强',
      isFatal: false,
      isRedHerring: true,
      relatedTo: 's3'
    },
    {
      id: 'c4',
      location: '死者保险箱',
      description: '一张银行转账记录，显示死者向张明账户转入大额资金',
      isFatal: true,
      isRedHerring: false,
      relatedTo: 's1'
    },
    {
      id: 'c5',
      location: '监控录像',
      description: '案发时间张明的车出现在死者家附近',
      isFatal: true,
      isRedHerring: false,
      relatedTo: 's1'
    },
    {
      id: 'c6',
      location: '死者手机',
      description: '与张明的短信记录，显示两人有激烈争吵',
      isFatal: true,
      isRedHerring: false,
      relatedTo: 's1'
    }
  ]

  const victim: Victim = {
    name: '刘建国',
    age: 52,
    description: '一位成功的企业家，经营着一家上市公司。性格强势，商业手段强硬。',
    causeOfDeath: '被利器刺中胸口，当场死亡'
  }

  const solution: Solution = {
    killerId: 's1',
    method: '张明趁死者独自在家时进入，用事先准备好的刀刺杀了死者。他事先收买了保安王强，让他在监控中删除了自己的进出记录。',
    motive: '张明因商业纠纷欠下巨额债务，试图通过杀害死者来逃避债务并收购其公司。死者发现了他的计划并准备揭发。',
    stepByStep: '1. 晚上8点，张明到达死者家附近\n2. 8:30，趁死者独自在家时进入\n3. 两人发生争执，张明刺杀了死者\n4. 9:00，张明离开，并收买保安删除监控\n5. 9:30，尸体被发现',
    logicExplanation: '关键线索是转账记录和短信记录，证明张明有动机。监控录像显示他的车在现场。而其他嫌疑人的线索都是干扰项。'
  }

  return {
    title: '商业大亨之死',
    description: '一个风雨交加的夜晚，知名企业家刘建国被发现死在自己的书房中。案发现场门窗紧锁，只有几个嫌疑人有作案可能。',
    sceneDescription: '书房内一片狼藉，死者倒在书桌旁，胸口有一处致命伤。书桌上散落着各种文件，窗户紧闭，但窗帘被拉开。',
    victim,
    suspects,
    clues,
    solution
  }
}

// 真实AI生成
async function generateCaseWithRealAI(
  keywords: string, 
  difficulty: number, 
  numSuspects: number
): Promise<GeneratedCaseData> {
  const prompt = buildPrompt(keywords, difficulty, numSuspects)
  
  // 尝试OpenAI
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      })
    })
    
    const data = await response.json()
    const content = data.choices[0].message.content
    return parseAIResponse(content, numSuspects)
  }
  
  // 尝试通义千问
  if (process.env.DASHSCOPE_API_KEY) {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: { prompt },
        parameters: { temperature: 0.8 }
      })
    })
    
    const data = await response.json()
    const content = data.output.text
    return parseAIResponse(content, numSuspects)
  }
  
  throw new Error('未配置AI API密钥')
}

function buildPrompt(keywords: string, difficulty: number, numSuspects: number): string {
  const clueCount = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8
  const redHerringCount = difficulty === 1 ? 1 : difficulty === 2 ? 2 : 3
  
  return `你是一个专业的谋杀之谜剧本创作者。
用户给出的关键词是：${keywords}
难度：${difficulty}（1-3），嫌疑人数量：${numSuspects}

请按照以下要求生成一个完整的谋杀解谜案件：

1. 遵循 "不可能犯罪 → 嫌疑人各有动机 → 线索指向不同方向 → 真凶隐藏巧妙 → 核心诡计逻辑自洽" 的结构
2. 所有线索必须指向唯一正确解答，逻辑不能有矛盾
3. 嫌疑人中至少有2人有明显嫌疑，但真凶只有一个
4. 难度为${difficulty}时，安排${clueCount}条线索，其中${redHerringCount}条干扰线索
5. 案件背景要符合"${keywords}"的主题设定

请以JSON格式输出，包含以下字段：
{
  "title": "案件标题",
  "description": "案件背景简述",
  "sceneDescription": "案发现场详细描述",
  "victim": {
    "name": "被害人姓名",
    "age": 年龄,
    "description": "被害人描述",
    "causeOfDeath": "死因"
  },
  "suspects": [
    {
      "id": "s1/s2/s3...",
      "name": "姓名",
      "age": 年龄,
      "occupation": "职业",
      "relationToVictim": "与死者关系",
      "motive": "动机",
      "alibi": "不在场证明",
      "lies": "嫌疑人所说的谎言/矛盾点",
      "secret": "嫌疑人隐藏的秘密"
    }
  ],
  "clues": [
    {
      "id": "c1/c2/c3...",
      "location": "发现位置",
      "description": "线索描述",
      "isFatal": true或false,
      "isRedHerring": true或false,
      "relatedTo": "指向哪个嫌疑人ID"
    }
  ],
  "solution": {
    "killerId": "真凶ID",
    "method": "作案手法详细描述",
    "motive": "真凶动机",
    "stepByStep": "时间线步骤",
    "logicExplanation": "如何通过线索推理出真凶的逻辑链"
  }
}

重要：
1. 确保输出是合法JSON，不要有多余字符
2. 不要包含血腥暴力内容
3. 真凶必须是嫌疑人中的一个`
}

function parseAIResponse(content: string, numSuspects: number): GeneratedCaseData {
  // 提取JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI返回格式错误，无法解析JSON')
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      title: parsed.title || '神秘案件',
      description: parsed.description || '',
      sceneDescription: parsed.sceneDescription || '',
      victim: parsed.victim,
      suspects: parsed.suspects?.slice(0, numSuspects) || [],
      clues: parsed.clues || [],
      solution: parsed.solution
    }
  } catch {
    throw new Error('JSON解析失败')
  }
}