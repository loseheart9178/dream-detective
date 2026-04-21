import { v4 as uuidv4 } from 'uuid'
import type { Case, Suspect, Clue, Victim, Solution, AskSuspectResponse, ApiProvider, ApiProtocol, ImmersionLevel, CaseMedia, ImmersionConfig } from '../types'
import { CaseRepository } from '../db/caseRepository.js'
import { MediaRepository } from '../db/mediaRepository.js'
import { ProgressRepository } from '../db/progressRepository.js'
import { generateSceneImage, generateSuspectPortrait, generateClueImage, generatePlaceholderSVG } from './imageService.js'
import { synthesizeSpeech } from './ttsService.js'

// 类型定义
type GeneratedCaseData = Omit<Case, 'id' | 'difficulty' | 'keywords' | 'createdAt'>

// API供应商配置
const API_PROVIDERS: Record<ApiProvider, {
  baseUrl: string
  defaultModel: string
  headers: (key: string) => Record<string, string>
  buildBody: (model: string, prompt: string) => object
  parseResponse: (data: any) => string
}> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, prompt) => ({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  dashscope: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen-plus',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, prompt) => ({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, prompt) => ({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-haiku-latest',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }),
    buildBody: (model, prompt) => ({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    }),
    parseResponse: (data) => data.content?.[0]?.text || ''
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-flash',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, prompt) => ({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'kimi-latest',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, prompt) => ({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  local: {
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    defaultModel: '',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': key ? `Bearer ${key}` : 'Bearer dummy'
    }),
    buildBody: (model, prompt) => ({
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    defaultModel: 'MiniMax-Text-01',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    buildBody: (model, prompt) => ({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': key ? `Bearer ${key}` : 'Bearer dummy'
    }),
    buildBody: (model, prompt) => ({
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  }
}

// API协议配置（用于本地部署）
const API_PROTOCOLS: Record<ApiProtocol, {
  headers: (key: string) => Record<string, string>
  buildBody: (model: string, prompt: string) => object
  parseResponse: (data: any) => string
}> = {
  openai: {
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': key ? `Bearer ${key}` : 'Bearer dummy'
    }),
    buildBody: (model, prompt) => ({
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || ''
  },
  anthropic: {
    headers: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key || 'dummy',
      'anthropic-version': '2023-06-01'
    }),
    buildBody: (model, prompt) => ({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    }),
    parseResponse: (data) => data.content?.[0]?.text || ''
  },
  dashscope: {
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key || 'dummy'}`
    }),
    buildBody: (model, prompt) => ({
      model: model || 'qwen-turbo',
      input: { prompt },
      parameters: { temperature: 0.8 }
    }),
    parseResponse: (data) => data.output?.text || ''
  }
}

// 内存存储 (开发阶段)
const cases: Map<string, Case> = new Map()

// 示例案件模板
const sampleCaseTemplates: GeneratedCaseData[] = [
  // 模板1: 商业大亨之死
  {
    title: '商业大亨之死',
    description: '一个风雨交加的夜晚，知名企业家刘建国被发现死在自己的书房中。案发现场门窗紧锁，只有几个嫌疑人有作案可能。',
    sceneDescription: '书房内一片狼藉，死者倒在书桌旁，胸口有一处致命伤。书桌上散落着各种文件，窗户紧闭，但窗帘被拉开。',
    victim: {
      name: '刘建国',
      age: 52,
      description: '一位成功的企业家，经营着一家上市公司。性格强势，商业手段强硬。',
      causeOfDeath: '被利器刺中胸口，当场死亡'
    },
    suspects: [
      { id: 's1', name: '张明', age: 45, occupation: '公司CEO', relationToVictim: '生意伙伴', motive: '因商业纠纷欠下巨额债务', alibi: '案发时在办公室开会', lies: '声称与死者关系很好', secret: '实际上正在策划收购死者公司' },
      { id: 's2', name: '李婷', age: 32, occupation: '私人助理', relationToVictim: '死者助理', motive: '发现死者有不正当关系的证据', alibi: '案发时在餐厅吃晚餐', lies: '说死者是个好人', secret: '实际上被死者威胁' },
      { id: 's3', name: '王强', age: 28, occupation: '保安', relationToVictim: '死者下属', motive: '被死者解雇后怀恨在心', alibi: '案发时在值班室看监控', lies: '声称没看到任何人进出', secret: '实际上看到了真凶但被收买' },
      { id: 's4', name: '陈雪', age: 38, occupation: '医生', relationToVictim: '死者前妻', motive: '争夺孩子抚养权失败', alibi: '案发时在医院值班', lies: '说已经放下了过去', secret: '实际上一直无法释怀' }
    ],
    clues: [
      { id: 'c1', location: '死者书房', description: '一份被撕碎的商业合同，上面有张明的签名', isFatal: false, isRedHerring: false, relatedTo: 's1' },
      { id: 'c2', location: '死者办公桌', description: '一条沾有血迹的丝巾，与李婷的款式相同', isFatal: false, isRedHerring: true, relatedTo: 's2' },
      { id: 'c3', location: '案发现场', description: '一把带有指纹的刀，指纹属于王强', isFatal: false, isRedHerring: true, relatedTo: 's3' },
      { id: 'c4', location: '死者保险箱', description: '一张银行转账记录，显示死者向张明账户转入大额资金', isFatal: true, isRedHerring: false, relatedTo: 's1' },
      { id: 'c5', location: '监控录像', description: '案发时间张明的车出现在死者家附近', isFatal: true, isRedHerring: false, relatedTo: 's1' },
      { id: 'c6', location: '死者手机', description: '与张明的短信记录，显示两人有激烈争吵', isFatal: true, isRedHerring: false, relatedTo: 's1' }
    ],
    solution: {
      killerId: 's1',
      method: '张明趁死者独自在家时进入，用事先准备好的刀刺杀了死者。他事先收买了保安王强，让他在监控中删除了自己的进出记录。',
      motive: '张明因商业纠纷欠下巨额债务，试图通过杀害死者来逃避债务并收购其公司。死者发现了他的计划并准备揭发。',
      stepByStep: '1. 晚上8点，张明到达死者家附近\n2. 8:30，趁死者独自在家时进入\n3. 两人发生争执，张明刺杀了死者\n4. 9:00，张明离开，并收买保安删除监控\n5. 9:30，尸体被发现',
      logicExplanation: '关键线索是转账记录和短信记录，证明张明有动机。监控录像显示他的车在现场。而其他嫌疑人的线索都是干扰项。'
    }
  },
  // 模板2: 游轮谋杀案
  {
    title: '游轮惊魂夜',
    description: '豪华游轮"星辰号"在公海上航行时，富商王志远被发现死在自己的头等舱内。船上的每个人都有不在场证明，但真凶就在其中。',
    sceneDescription: '头等舱内，死者倒在床边，头部有钝器击打的痕迹。舱门紧锁，窗户完好，只有死者本人能从内部打开。',
    victim: {
      name: '王志远',
      age: 58,
      description: '一位富有的投资人，正在游轮上庆祝自己的生日。为人傲慢，得罪过不少人。',
      causeOfDeath: '头部被钝器重击，导致颅内出血死亡'
    },
    suspects: [
      { id: 's1', name: '林晓', age: 35, occupation: '游轮经理', relationToVictim: '死者员工', motive: '被死者当众羞辱并威胁开除', alibi: '案发时在船尾酒吧', lies: '声称死者是个好人', secret: '实际上被死者勒索' },
      { id: 's2', name: '周海', age: 42, occupation: '投资顾问', relationToVictim: '死者合伙人', motive: '死者挪用了他的投资款', alibi: '案发时在赌场', lies: '说与死者合作愉快', secret: '实际上准备起诉死者' },
      { id: 's3', name: '苏美', age: 28, occupation: '歌手', relationToVictim: '死者情人', motive: '被死者抛弃并威胁', alibi: '案发时在演出', lies: '说死者很爱她', secret: '实际上被死者威胁公开关系' },
      { id: 's4', name: '陈刚', age: 45, occupation: '船长', relationToVictim: '死者朋友', motive: '死者知道他走私的秘密', alibi: '案发时在驾驶室', lies: '说与死者是多年好友', secret: '实际上被死者勒索' }
    ],
    clues: [
      { id: 'c1', location: '死者舱房', description: '一个打碎的酒瓶，上面有林晓的指纹', isFatal: false, isRedHerring: true, relatedTo: 's1' },
      { id: 'c2', location: '死者保险箱', description: '一份投资合同，显示周海的资金被挪用', isFatal: false, isRedHerring: false, relatedTo: 's2' },
      { id: 'c3', location: '死者床头', description: '一封威胁信，信纸上有苏美的香水味', isFatal: false, isRedHerring: true, relatedTo: 's3' },
      { id: 'c4', location: '死者手机', description: '一条发给陈刚的短信，威胁要曝光走私', isFatal: true, isRedHerring: false, relatedTo: 's4' },
      { id: 'c5', location: '甲板', description: '一个被丢弃的灭火器，上面有陈刚的指纹', isFatal: true, isRedHerring: false, relatedTo: 's4' },
      { id: 'c6', location: '监控记录', description: '陈刚在案发时间出现在死者舱房附近', isFatal: true, isRedHerring: false, relatedTo: 's4' }
    ],
    solution: {
      killerId: 's4',
      method: '陈刚作为船长，拥有所有舱房的钥匙。他用灭火器击打死者头部，然后伪造了密室状态。',
      motive: '死者发现了陈刚走私货物的秘密，并威胁要向当局举报。陈刚为了保护自己的秘密，决定杀人灭口。',
      stepByStep: '1. 晚上10点，陈刚用备用钥匙进入死者舱房\n2. 用灭火器击打死者头部\n3. 伪造密室，从内部锁门后从窗户离开\n4. 10:30，回到驾驶室制造不在场证明\n5. 次日早上，尸体被发现',
      logicExplanation: '只有船长有钥匙能制造密室。灭火器和监控记录证明陈刚在场。威胁短信揭示了动机。'
    }
  },
  // 模板3: 古堡疑案
  {
    title: '古堡迷雾',
    description: '暴风雨之夜，古堡主人赵德明被发现死在书房中。所有客人都被暴风雨困在古堡内，凶手就在其中。',
    sceneDescription: '书房内烛光摇曳，死者倒在书桌前的椅子上，手中握着半杯红酒。书桌上的文件散落一地，窗户被暴风雨吹开。',
    victim: {
      name: '赵德明',
      age: 65,
      description: '古堡主人，一位富有的收藏家。性格古怪，与家人关系疏远。',
      causeOfDeath: '红酒中被下毒，导致心脏骤停'
    },
    suspects: [
      { id: 's1', name: '赵明', age: 38, occupation: '古堡继承人', relationToVictim: '死者儿子', motive: '被父亲剥夺继承权', alibi: '案发时在自己的房间', lies: '说与父亲关系很好', secret: '实际上欠下巨额赌债' },
      { id: 's2', name: '张华', age: 55, occupation: '管家', relationToVictim: '死者管家', motive: '被死者发现偷窃古董', alibi: '案发时在厨房准备晚餐', lies: '说死者对他很好', secret: '实际上被死者威胁要报警' },
      { id: 's3', name: '李芳', age: 42, occupation: '护士', relationToVictim: '死者护工', motive: '被死者骚扰', alibi: '案发时在照顾其他病人', lies: '说死者是个好人', secret: '实际上收集了死者骚扰的证据' },
      { id: 's4', name: '王教授', age: 60, occupation: '考古学家', relationToVictim: '死者朋友', motive: '死者拒绝出售珍贵古董', alibi: '案发时在图书馆研究', lies: '说与死者是多年好友', secret: '实际上对死者怀恨在心' }
    ],
    clues: [
      { id: 'c1', location: '死者书房', description: '一份遗嘱，显示赵明被剥夺继承权', isFatal: false, isRedHerring: false, relatedTo: 's1' },
      { id: 'c2', location: '死者酒柜', description: '一瓶被打开的红酒，上面有张华的指纹', isFatal: false, isRedHerring: true, relatedTo: 's2' },
      { id: 'c3', location: '死者床边', description: '一本日记，记录了李芳被骚扰的经历', isFatal: false, isRedHerring: true, relatedTo: 's3' },
      { id: 'c4', location: '死者保险箱', description: '一封与王教授的往来信件，关于古董交易', isFatal: true, isRedHerring: false, relatedTo: 's4' },
      { id: 'c5', location: '书房垃圾桶', description: '一个空的毒药瓶，是王教授实验室的', isFatal: true, isRedHerring: false, relatedTo: 's4' },
      { id: 'c6', location: '图书馆', description: '王教授的研究笔记，记录了古董鉴定结果', isFatal: true, isRedHerring: false, relatedTo: 's4' }
    ],
    solution: {
      killerId: 's4',
      method: '王教授利用自己的化学知识，在死者的红酒中下毒。他利用暴风雨作为掩护，制造了完美的不在场证明。',
      motive: '王教授多年来一直想购买赵德明收藏的一件国宝级古董，但赵德明一直拒绝。王教授发现赵德明打算将古董捐给博物馆，于是决定杀人夺取。',
      stepByStep: '1. 晚餐前，王教授借口参观书房，在红酒中下毒\n2. 晚餐后回到图书馆，制造不在场证明\n3. 晚上9点，赵德明回到书房喝下毒酒\n4. 9:30，毒发身亡\n5. 次日早上，尸体被发现',
      logicExplanation: '毒药瓶和信件证明王教授有作案手段和动机。他的研究笔记显示他对古董有强烈的占有欲。'
    }
  }
]

export async function generateCase(params: {
  keywords: string
  difficulty: number
  numSuspects: number
  immersionLevel?: ImmersionLevel
  apiKey?: string
  apiProvider?: ApiProvider
  apiUrl?: string
  model?: string
  protocol?: ApiProtocol
}): Promise<{ caseId: string }> {
  const { keywords, difficulty, numSuspects, immersionLevel = 'basic', apiKey, apiProvider, apiUrl, model, protocol } = params

  // 调用AI服务生成案件
  const caseData = await generateCaseWithAI(keywords, difficulty, numSuspects, apiKey, apiProvider, apiUrl, model, protocol)
  const caseId = uuidv4()

  const newCase: Case = {
    id: caseId,
    ...caseData,
    difficulty,
    keywords,
    createdAt: new Date().toISOString()
  }

  // 根据沉浸级别生成多媒体
  if (immersionLevel !== 'basic') {
    await generateCaseMedia(newCase, immersionLevel, apiKey)
  }

  // 保存到数据库
  CaseRepository.create(newCase)
  // 同时保留在内存中用于快速访问
  cases.set(caseId, newCase)
  return { caseId }
}

// 生成案件多媒体
async function generateCaseMedia(caseData: Case, level: ImmersionLevel, apiKey?: string): Promise<void> {
  const config: ImmersionConfig = {
    level,
    modelMode: 'unified',
    unifiedApiKey: apiKey,
    musicVolume: 50,
    soundEffectsEnabled: true
  }

  const media: CaseMedia = {
    sceneImages: [],
    suspectImages: [],
    clueImages: []
  }

  // 生成案发现场图（标准/沉浸都生成）
  if (level === 'standard' || level === 'immersive') {
    const sceneResult = await generateSceneImage(caseData.sceneDescription, config)
    if (sceneResult.success && sceneResult.imageUrl) {
      media.sceneImages.push(sceneResult.imageUrl)
    } else {
      // 降级：使用占位图
      media.sceneImages.push(generatePlaceholderSVG('案发现场'))
    }
  }

  // 生成嫌疑人画像（标准/沉浸都生成）
  if (level === 'standard' || level === 'immersive') {
    for (const suspect of caseData.suspects) {
      const portraitResult = await generateSuspectPortrait(suspect, config)
      if (portraitResult.success && portraitResult.imageUrl) {
        media.suspectImages.push(portraitResult.imageUrl)
      } else {
        media.suspectImages.push(generatePlaceholderSVG(suspect.name))
      }
    }
  }

  // 生成线索图（仅沉浸模式）
  if (level === 'immersive') {
    for (const clue of caseData.clues) {
      const clueResult = await generateClueImage(clue.description, clue.location, config)
      if (clueResult.success && clueResult.imageUrl) {
        media.clueImages.push(clueResult.imageUrl)
      } else {
        media.clueImages.push(generatePlaceholderSVG(clue.location))
      }
    }
  }

  // 保存多媒体到数据库
  MediaRepository.create(caseData.id, media)
}

export async function getCase(id: string): Promise<Case | null> {
  // 先从内存获取
  const cached = cases.get(id)
  if (cached) return cached
  // 从数据库获取
  const dbCase = CaseRepository.findById(id)
  if (dbCase) {
    cases.set(id, dbCase)
    return dbCase
  }
  return null
}

// 获取案件多媒体
export async function getCaseMedia(caseId: string) {
  return CaseRepository.findMediaByCaseId(caseId)
}

export async function submitAnswer(
  caseId: string,
  killerId: string,
  explanation: string
): Promise<{ correct: boolean; score: number; feedback: string; solution?: Solution }> {
  const caseData = await getCase(caseId)
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
  return await getCase(caseId)
}

// 问题直白度分类
function classifyQuestionDirectness(question: string): number {
  const q = question.toLowerCase()

  // 危险模式 (0) - 直接指控
  const dodgyPatterns = [
    /(?:你是|是不是|是不是说).*凶手/,
    /你.*杀.*(?:他|她|死者)/,
    /(?:承认|坦白).*(?:犯罪|杀人)/,
    /你有.*嫌疑/,
    /(?:别|不要).*说谎|你在.*说谎/
  ]

  // 可疑模式 (1) - 假设有罪质问
  const suspiciousPatterns = [
    /为什么.*(?:杀|害|攻击)/,
    /(?:难道|是不是).*你/,
    /有.*什么.*动机/,
    /(?:不太|有点).*可疑|我.*怀疑/
  ]

  // 委婉模式 (3) - 间接试探
  const subtlePatterns = [
    /那天.*晚.*一个人/,
    /最后.*见到.*时候/,
    /有.*什么.*看法/,
    /可以.*说.*一下/,
    /那天.*有.*人.*一起/
  ]

  if (dodgyPatterns.some(p => p.test(q))) return 0
  if (suspiciousPatterns.some(p => p.test(q))) return 1
  if (subtlePatterns.some(p => p.test(q))) return 3
  return 2 // 默认中性
}

// 询问嫌疑人
export async function askSuspect(
  caseId: string,
  suspectId: string,
  question: string
): Promise<AskSuspectResponse> {
  const caseData = await getCase(caseId)
  if (!caseData) {
    throw new Error('案件不存在')
  }

  const suspect = caseData.suspects.find((s: Suspect) => s.id === suspectId)
  if (!suspect) {
    throw new Error('嫌疑人不存在')
  }

  const isKiller = suspectId === caseData.solution.killerId
  const directness = classifyQuestionDirectness(question)

  // 检查是否配置了API
  const apiKey = process.env.OPENAI_API_KEY || process.env.DASHSCOPE_API_KEY

  if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'your_dashscope_api_key_here') {
    // 返回示例回答
    return generateSampleAnswer(suspect, question, isKiller, directness)
  }

  // 调用AI生成回答
  return generateAnswerWithAI(suspect, question, isKiller, caseData, directness)
}

// 示例回答 (无API时使用)
function generateSampleAnswer(suspect: Suspect, question: string, isKiller: boolean, directness: number): AskSuspectResponse {
  const q = question.toLowerCase()
  let answer: string

  // 根据直白度调整回答策略
  if (isKiller) {
    if (directness === 0) {
      // 危险问题 - 强烈否认
      answer = '你疯了吗？！我怎么会杀他！我们关系那么好，你这是在诬陷我！'
    } else if (directness === 1) {
      // 可疑问题 - 冷静否认+轻度误导
      const others = ['我觉得可能是...', '那晚我确实看到了', '你不应该只盯着我']
      answer = others[Math.floor(Math.random() * others.length)] + '，也许该查查别人。'
    } else if (directness === 2) {
      // 中性问题 - 半真半假
      if (q.includes('哪里') || q.includes('时间') || q.includes('地点')) {
        answer = suspect.alibi.split('。')[0] + '。'
      } else if (q.includes('关系')) {
        answer = suspect.lies
      } else {
        answer = '我不太想多说，希望你能理解。'
      }
    } else {
      // 委婉问题 - 基本真话但点到为止
      answer = '那晚我确实一个人在家，但我真的不知道发生了什么...'
    }
  } else {
    if (directness === 0) {
      // 非凶手对危险问题 - 困惑委屈
      answer = '你为什么这么问我？我真的不知道发生了什么，我会配合调查的。'
    } else if (directness === 1) {
      // 可疑问题 - 轻度不满但配合
      answer = '我没有理由杀他。我们确实有过矛盾，但那都是工作上的正常分歧。'
    } else if (directness === 2) {
      // 中性问题 - 如实回答
      if (q.includes('哪里') || q.includes('时间') || q.includes('地点')) {
        answer = suspect.alibi
      } else if (q.includes('关系')) {
        answer = `我们是${suspect.relationToVictim}，关系应该说是正常的。`
      } else {
        answer = '如果有任何线索能帮到警方，我愿意配合。'
      }
    } else {
      // 委婉问题 - 完全放松
      answer = '那晚我在家看电视，很早就睡了。我对刘总没有任何恶意，真的很震惊听到这个消息。'
    }
  }

  return {
    answer,
    isLie: isKiller && directness < 2,
    directness
  }
}

// AI生成回答
async function generateAnswerWithAI(
  suspect: Suspect,
  question: string,
  isKiller: boolean,
  caseData: Case,
  directness: number
): Promise<AskSuspectResponse> {
  const prompt = buildAskPrompt(suspect, question, isKiller, caseData, directness)
  const temperature = isKiller && directness <= 1 ? 0.3 : 0.7

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
        temperature,
        max_tokens: 200
      })
    })

    const data = await response.json()
    const answer = data.choices[0].message.content.trim()
    return { answer, isLie: isKiller, directness }
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
        parameters: { temperature, max_tokens: 200 }
      })
    })

    const data = await response.json()
    const answer = data.output.text.trim()
    return { answer, isLie: isKiller, directness }
  }

  throw new Error('未配置AI API密钥')
}

function buildAskPrompt(suspect: Suspect, question: string, isKiller: boolean, caseData: Case, directness: number): string {
  const victimName = caseData.victim.name

  // 根据直白度和身份构建行为指令
  let behavior: string
  let responseLength: string
  let emotionalTone: string

  if (isKiller) {
    switch (directness) {
      case 0: // 危险
        behavior = `【关键】这是危险级别的问题！对方几乎在直接指控你！你必须：
        1. 强烈否认："什么？！你在说什么！我不是凶手！"
        2. 表现出愤怒或受伤："你怎么能这样问我？"
        3. 反过来质问对方或提及他人的嫌疑
        4. 绝对不能承认，哪怕暗示也不行`
        responseLength = '短促有力，1-2句话，带有情绪'
        emotionalTone = '愤怒/受伤/防御'
        break
      case 1: // 可疑
        behavior = `【重要】对方在怀疑你。这类问题预设了你可能有罪。
        1. 冷静否认，但可以有一点点防卫姿态
        2. 给出表面合理的解释
        3. 适当转移话题到其他人身上
        4. 不要太激动，否则反而显得心虚`
        responseLength = '中等长度，2-3句话'
        emotionalTone = '冷静但略显不悦'
        break
      case 2: // 中性
        behavior = `这是正常的询问。你可以：
        1. 如实回答背景信息（这些都是真的）
        2. 但关键点（动机、不在场证明）要半真半假
        3. 适当加入一些看似合理的细节来增加可信度
        4. 如果被追问敏感点，可以略微转移`
        responseLength = '中等长度，2-3句话'
        emotionalTone = '平静/配合'
        break
      default: // 3 委婉
        behavior = `这个问题很委婉，没有明显针对你。你可能会放松警惕。
        但记住：你仍然要隐瞒你是凶手的事实！
        1. 基本如实回答（因为问题本身不威胁你）
        2. 但如果有漏洞可能被对方捕捉到
        3. 不要主动说太多，点到为止`
        responseLength = '简短，1-2句话'
        emotionalTone = '放松/自然'
        break
    }
  } else {
    // 非凶手
    switch (directness) {
      case 0: // 危险
        behavior = `【困惑】这个问题太突然了，让我觉得被冒犯。
        1. 表示困惑："你为什么这么问？"
        2. 否认但可能显得委屈
        3. 不应该反问或指责，保持被动防御`
        responseLength = '短促，1-2句话'
        emotionalTone = '困惑/委屈/震惊'
        break
      case 1: // 可疑
        behavior = `对方在怀疑我，这让我不太舒服。
        1. 否认但可能略带不满
        2. 解释清楚自己的清白
        3. 如果问到你的secret，会紧张但尽力回避`
        responseLength = '中等长度，2-3句话'
        emotionalTone = '略显不满/紧张'
        break
      case 2: // 中性
        behavior = `正常的问题，我可以配合回答。
        1. 如实回答（你的alibi是真的）
        2. 如果被问到secret，会有点回避但不至于说谎
        3. 可能无意中透露一些对真凶不利的信息`
        responseLength = '中等长度，2-3句话'
        emotionalTone = '自然/配合'
        break
      default: // 3 委婉
        behavior = `这个问题很轻松，没有压力。
        1. 完全放松，如实回答
        2. 可能会主动多说一些
        3. 如果知道对真凶不利的信息，可能无意中说出来`
        responseLength = '可能会稍长，2-4句话'
        emotionalTone = '放松/健谈'
        break
    }
  }

  const directnessLabel = ['危险', '可疑', '中性', '委婉'][directness]

  return `你是一个谋杀案中的嫌疑人，请以第一人称回答问题。

【基本信息】
姓名：${suspect.name}
年龄：${suspect.age}岁
职业：${suspect.occupation}
与死者关系：${suspect.relationToVictim}
死者姓名：${victimName}

【角色设定】
${isKiller
    ? `重要：你是真正的凶手！你的动机是：${suspect.motive}。你的不在场证明是假的：${suspect.alibi}。你说过的话：${suspect.lies}。`
    : `你不是凶手。你的动机是：${suspect.motive}，但你没有杀人。你的不在场证明是真的：${suspect.alibi}。你有一个秘密：${suspect.secret}，如果被直接问到会试图回避。`
}

【当前问题类型】${directnessLabel}

【回答要求】
${behavior}

回答长度：${responseLength}
情绪基调：${emotionalTone}

请用自然、口语化的方式回答。不要写出任何角色指示或括号说明。`
}

// AI生成案件
async function generateCaseWithAI(
  keywords: string,
  difficulty: number,
  numSuspects: number,
  apiKey?: string,
  apiProvider?: ApiProvider,
  apiUrl?: string,
  model?: string,
  protocol?: ApiProtocol
): Promise<GeneratedCaseData> {
  // 检查是否配置了API（前端传入或环境变量）
  const hasApiKey = apiKey ||
    (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') ||
    (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your_dashscope_api_key_here')

  if (!hasApiKey) {
    // 返回示例案件用于开发测试
    return generateSampleCase(numSuspects)
  }

  // 调用真实AI API
  return generateCaseWithRealAI(keywords, difficulty, numSuspects, apiKey, apiProvider || 'openai', apiUrl, model, protocol)
}

// 示例案件 (用于开发测试) - 随机选择模板
function generateSampleCase(numSuspects: number): GeneratedCaseData {
  // 随机选择一个模板
  const template = sampleCaseTemplates[Math.floor(Math.random() * sampleCaseTemplates.length)]

  // 根据嫌疑人数量调整
  const suspects = template.suspects.slice(0, numSuspects)

  // 确保真凶在选中的嫌疑人中
  const killerInSelected = suspects.some(s => s.id === template.solution.killerId)
  if (!killerInSelected && suspects.length > 0) {
    // 如果真凶不在选中的嫌疑人中，将第一个嫌疑人替换为真凶
    const killer = template.suspects.find(s => s.id === template.solution.killerId)
    if (killer) {
      suspects[0] = killer
    }
  }

  return {
    ...template,
    suspects,
    clues: template.clues.filter(c => suspects.some(s => s.id === c.relatedTo))
  }
}

// 真实AI生成
async function generateCaseWithRealAI(
  keywords: string,
  difficulty: number,
  numSuspects: number,
  apiKey?: string,
  apiProvider: ApiProvider = 'openai',
  apiUrl?: string,
  model?: string,
  protocol?: ApiProtocol
): Promise<GeneratedCaseData> {
  const prompt = buildPrompt(keywords, difficulty, numSuspects)

  // 获取API密钥
  let key = apiKey
  if (!key) {
    // 尝试从环境变量获取
    if (apiProvider === 'openai' && process.env.OPENAI_API_KEY) {
      key = process.env.OPENAI_API_KEY
    } else if (apiProvider === 'dashscope' && process.env.DASHSCOPE_API_KEY) {
      key = process.env.DASHSCOPE_API_KEY
    }
  }

  if (!key && apiProvider !== 'local') {
    throw new Error('未配置AI API密钥')
  }

  // 调用统一的API函数
  return callAIAPI(prompt, key || '', apiProvider, apiUrl, model, numSuspects, 3, protocol)
}

// 统一调用AI API（带超时和重试）
async function callAIAPI(
  prompt: string,
  apiKey: string,
  provider: ApiProvider,
  customUrl?: string,
  customModel?: string,
  numSuspects: number = 4,
  retries = 3,
  protocol?: ApiProtocol
): Promise<GeneratedCaseData> {
  const config = API_PROVIDERS[provider]
  const url = customUrl || config.baseUrl
  const model = customModel || config.defaultModel

  // 本地部署使用协议配置
  const protocolConfig = provider === 'local' && protocol ? API_PROTOCOLS[protocol] : null
  const headers = protocolConfig ? protocolConfig.headers(apiKey) : config.headers(apiKey)
  const body = protocolConfig ? protocolConfig.buildBody(model, prompt) : config.buildBody(model, prompt)
  const parseFn = protocolConfig ? protocolConfig.parseResponse : config.parseResponse

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90000) // 90秒超时

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`${provider} API错误: ${response.status} - ${errorData.error?.message || errorData.message || '未知错误'}`)
    }

    const data = await response.json()
    const content = parseFn(data)

    if (!content) {
      throw new Error(`${provider} API返回格式错误`)
    }

    return parseAIResponse(content, numSuspects)
  } catch (error: unknown) {
    clearTimeout(timeout)

    // 网络错误或超时，尝试重试
    if (retries > 0 && (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch')))) {
      console.log(`${provider}请求失败，剩余重试次数: ${retries - 1}`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      return callAIAPI(prompt, apiKey, provider, customUrl, customModel, numSuspects, retries - 1, protocol)
    }

    throw error
  }
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

// 生成TTS语音
export async function synthesizeTTS(
  text: string,
  immersionLevel: ImmersionLevel,
  apiKey?: string
): Promise<{ audioUrl?: string; fallback: boolean }> {
  if (immersionLevel === 'basic') {
    return { fallback: true }
  }

  const config: ImmersionConfig = {
    level: immersionLevel,
    modelMode: 'unified',
    unifiedApiKey: apiKey,
    musicVolume: 50,
    soundEffectsEnabled: true
  }

  try {
    const result = await synthesizeSpeech(text, config)
    if (result.success && result.audioUrl) {
      return { audioUrl: result.audioUrl, fallback: false }
    }
    return { fallback: true }
  } catch (error) {
    console.error('TTS synthesis failed:', error)
    return { fallback: true }
  }
}