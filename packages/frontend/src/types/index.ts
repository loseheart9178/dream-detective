// 案件相关类型
export interface Suspect {
  id: string
  name: string
  age: number
  occupation: string
  relationToVictim: string
  motive: string
  alibi: string
  lies: string
  secret: string
}

export interface Victim {
  name: string
  age: number
  description: string
  causeOfDeath: string
}

export interface Clue {
  id: string
  location: string
  description: string
  isFatal: boolean
  isRedHerring: boolean
  relatedTo: string
}

export interface Solution {
  killerId: string
  method: string
  motive: string
  stepByStep: string
  logicExplanation: string
}

export interface Case {
  id: string
  title: string
  description: string
  sceneDescription: string
  victim: Victim
  suspects: Suspect[]
  clues: Clue[]
  solution: Solution
  difficulty: number
  keywords: string
  createdAt: string
}

// 用户进度相关类型
export interface QuestionAnswer {
  question: string
  answer: string
  isLoading?: boolean
  directness?: QuestionDirectness
}

export interface UserProgress {
  caseId: string
  caseTitle: string
  collectedClues: string[]
  askedQuestions: Record<string, QuestionAnswer[]>
  attempts: number
  completed: boolean
  score: number
  startTime: string
  endTime?: string
}

// API请求类型
export interface GenerateCaseRequest {
  keywords: string
  difficulty: number
  numSuspects: number
  immersionLevel?: ImmersionLevel
  apiKey?: string
  apiUrl?: string
  apiProvider?: ApiProvider
  model?: string
  protocol?: ApiProtocol
  unifiedApiKey?: string
}

// API供应商类型
export type ApiProvider = 'openai' | 'dashscope' | 'deepseek' | 'claude' | 'zhipu' | 'moonshot' | 'local' | 'minimax' | 'custom'

// API协议类型
export type ApiProtocol = 'openai' | 'anthropic' | 'dashscope'

// API配置类型
export interface ApiConfig {
  apiProvider: ApiProvider
  apiKey: string
  apiUrl: string
  model: string
  protocol?: ApiProtocol // 协议类型，主要用于本地部署
}

// 协议类型配置
export const API_PROTOCOLS: Record<ApiProtocol, {
  name: string
  displayName: string
  defaultEndpoint: string
  authHeader: string
  defaultPort: string
}> = {
  openai: {
    name: 'OpenAI兼容',
    displayName: 'OpenAI 兼容协议',
    defaultEndpoint: '/v1/chat/completions',
    authHeader: 'Authorization: Bearer',
    defaultPort: '11434'
  },
  anthropic: {
    name: 'Anthropic兼容',
    displayName: 'Anthropic 兼容协议',
    defaultEndpoint: '/v1/messages',
    authHeader: 'x-api-key',
    defaultPort: '8080'
  },
  dashscope: {
    name: '通义千问兼容',
    displayName: '通义千问 兼容协议',
    defaultEndpoint: '/api/v1/services/aigc/text-generation/generation',
    authHeader: 'Authorization: Bearer',
    defaultPort: '8000'
  }
}

// 预设供应商配置
export const API_PROVIDERS: Record<ApiProvider, {
  name: string
  displayName: string
  baseUrl: string
  defaultModel: string
  keyPlaceholder: string
  docsUrl: string
  allowCustomUrl: boolean
  protocol: ApiProtocol
  modelSuggestions: string[]
}> = {
  openai: {
    name: 'OpenAI',
    displayName: 'OpenAI (GPT-4o)',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    allowCustomUrl: true,
    protocol: 'openai',
    modelSuggestions: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini']
  },
  dashscope: {
    name: '通义千问',
    displayName: '通义千问 (阿里云)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    defaultModel: 'qwen-plus',
    keyPlaceholder: '请输入Dashscope API Key',
    docsUrl: 'https://dashscope.console.aliyun.com/apiKey',
    allowCustomUrl: true,
    protocol: 'openai',
    modelSuggestions: ['qwen-plus', 'qwen-turbo', 'qwen3-235b-a22b', 'qwen3-32b']
  },
  deepseek: {
    name: 'DeepSeek',
    displayName: 'DeepSeek (深度求索)',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    allowCustomUrl: true,
    protocol: 'openai',
    modelSuggestions: ['deepseek-chat', 'deepseek-reasoner']
  },
  claude: {
    name: 'Claude',
    displayName: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-haiku-latest',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    allowCustomUrl: true,
    protocol: 'anthropic',
    modelSuggestions: ['claude-3-5-haiku-latest', 'claude-sonnet-4-20250514', 'claude-opus-4-20250514']
  },
  zhipu: {
    name: '智谱AI',
    displayName: '智谱AI (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-flash',
    keyPlaceholder: '请输入智谱API Key',
    docsUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    allowCustomUrl: true,
    protocol: 'openai',
    modelSuggestions: ['glm-4-flash', 'glm-4-airx', 'glm-4-plus']
  },
  moonshot: {
    name: 'Moonshot',
    displayName: 'Moonshot (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'kimi-latest',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    allowCustomUrl: true,
    protocol: 'openai',
    modelSuggestions: ['kimi-latest', 'moonshot-v1-8k', 'moonshot-v1-32k']
  },
  local: {
    name: '本地部署',
    displayName: '本地部署',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    defaultModel: '',
    keyPlaceholder: '请输入API Key（可留空）',
    docsUrl: '',
    allowCustomUrl: true,
    protocol: 'openai',
    modelSuggestions: ['llama3.1', 'qwen2.5', 'deepseek-r1', 'mistral']
  },
  minimax: {
    name: 'MiniMax',
    displayName: 'MiniMax (海螺AI)',
    baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    defaultModel: 'MiniMax-Text-01',
    keyPlaceholder: '请输入MiniMax API Key',
    docsUrl: 'https://www.minimaxi.com/document/GuYaoWenTang/perplexity/api',
    allowCustomUrl: false,
    protocol: 'openai',
    modelSuggestions: ['MiniMax-Text-01']
  },
  custom: {
    name: '自定义',
    displayName: '自定义供应商',
    baseUrl: '',
    defaultModel: '',
    keyPlaceholder: '请输入API地址',
    docsUrl: '',
    allowCustomUrl: true,
    protocol: 'openai',
    modelSuggestions: []
  }
}

export interface SubmitAnswerRequest {
  killerId: string
  explanation: string
}

export interface SubmitAnswerResponse {
  correct: boolean
  score: number
  feedback: string
  solution?: Solution
}

export interface AskSuspectRequest {
  suspectId: string
  question: string
}

export interface AskSuspectResponse {
  answer: string
  isLie?: boolean
  directness?: number
}

// 问题直白度 0=危险 1=可疑 2=中性 3=委婉
export type QuestionDirectness = 0 | 1 | 2 | 3

export const QuestionDirectnessLabels: Record<QuestionDirectness, string> = {
  0: '危险',
  1: '可疑',
  2: '中性',
  3: '委婉'
}

export const QuestionDirectnessColors: Record<QuestionDirectness, string> = {
  0: 'bg-red-600',
  1: 'bg-yellow-600',
  2: 'bg-slate-600',
  3: 'bg-green-600'
}

// 游戏状态类型
export interface GameState {
  currentCase: Case | null
  progress: UserProgress | null
  isLoading: boolean
  error: string | null
}

// ============================================
// 沉浸式体验相关类型
// ============================================

// 沉浸感等级
export type ImmersionLevel = 'basic' | 'standard' | 'immersive'

export const ImmersionLevelConfig: Record<ImmersionLevel, {
  name: string
  description: string
  hasImages: boolean
  hasAudio: boolean
  hasMusic: boolean
}> = {
  basic: {
    name: '基础',
    description: '纯文本案件，无多媒体',
    hasImages: false,
    hasAudio: false,
    hasMusic: false
  },
  standard: {
    name: '标准',
    description: '案发现场图 + 关键线索图 + 语音回答',
    hasImages: true,
    hasAudio: true,
    hasMusic: false
  },
  immersive: {
    name: '沉浸',
    description: '全部图片 + 语音 + 背景音乐 + 音效',
    hasImages: true,
    hasAudio: true,
    hasMusic: true
  }
}

// 多媒体模型配置模式
export type MediaModelMode = 'unified' | 'separate'

// 沉浸体验配置
export interface ImmersionConfig {
  level: ImmersionLevel
  modelMode: MediaModelMode
  // 统一模式（全模态模型，如MiniMax）
  unifiedApiKey?: string
  unifiedModel?: string
  // 分离模式
  imageApiKey?: string
  imageProvider?: 'wanxi' | 'dalle' | 'stability' | 'minimax'
  speechApiKey?: string
  speechProvider?: 'aliyun' | 'openai' | 'elevenlabs' | 'minimax'
  // 音量控制
  musicVolume: number
  soundEffectsEnabled: boolean
}

// 案件多媒体媒体
export interface CaseMedia {
  sceneImages: string[]   // 案发现场图
  suspectImages: string[] // 嫌疑人画像
  clueImages: string[]    // 线索物品图
  backgroundMusic?: string // 背景音乐URL
}

// 侦探故事/名言
export interface DetectiveStory {
  id: string
  type: 'quote' | 'case' | 'tip' | 'story'
  content: string
  author?: string
  source?: string
  tags: string[]
}

// 内置侦探名言库
export const DETECTIVE_QUOTES: DetectiveStory[] = [
  { id: 'q1', type: 'quote', content: '排除所有不可能的因素，剩下的无论多么难以置信，都是真相。', author: '夏洛克·福尔摩斯', source: '《巴斯克维尔的猎犬》', tags: ['推理', '名言'] },
  { id: 'q2', type: 'quote', content: '游戏已经开始了，或者说，从来就没有结束过。', author: '赫尔克里·波洛', source: '《帷幕》', tags: ['推理', '名言'] },
  { id: 'q3', type: 'quote', content: '一切犯罪都源于嫉妒与贪婪，而侦探的职责就是找到那把打开真相的钥匙。', author: '明智小五郎', source: '《明智侦探记》', tags: ['推理', '名言'] },
  { id: 'q4', type: 'quote', content: '真相有时候就像洋葱，剥开一层还有一层，而侦探的工作就是剥到最后。', author: '科伦坡', source: '《科伦坡探案》', tags: ['推理', '名言'] },
  { id: 'q5', type: 'quote', content: '不要相信你的眼睛，有时候真相藏在最不起眼的细节里。', author: '詹姆斯·莫里亚蒂', source: '《恐怖谷》', tags: ['推理', '名言'] },
  { id: 'q6', type: 'quote', content: '每个凶手都会留下痕迹，没有完美的犯罪，只有未被发现的线索。', author: '埃勒里·奎因', source: '《希腊棺材之谜》', tags: ['推理', '名言'] },
  { id: 'q7', type: 'quote', content: '推理不是一蹴而就的，而是一步一步逼近真相的过程。', author: '金田一耕助', source: '《本阵杀人事件》', tags: ['推理', '名言'] },
  { id: 'q8', type: 'quote', content: '最危险的罪犯往往是那些看起来最不可能犯罪的人。', author: '夏洛克·福尔摩斯', source: '《四签名》', tags: ['推理', '名言'] },
  { id: 'q9', type: 'quote', content: '当你排除了一切不可能的因素，剩下的无论多么荒诞，那就是真相。', author: '夏洛克·福尔摩斯', source: '《巴斯克维尔的猎犬》', tags: ['推理', '名言'] },
  { id: 'q10', type: 'quote', content: '世界上没有所谓的偶然，一切巧合背后都有必然的联系。', author: '赫尔克里·波洛', source: '《东方快车谋杀案》', tags: ['推理', '名言'] },
  { id: 't1', type: 'tip', content: '询问嫌疑人时，不同的问题直白度会得到不同风格的回答。委婉的问题更容易获得真实信息。', tags: ['技巧', '询问'] },
  { id: 't2', type: 'tip', content: '线索中的"干扰线索"会误导你的推理，注意识别哪些是与案件核心相关的。', tags: ['技巧', '线索'] },
  { id: 't3', type: 'tip', content: '嫌疑人的"动机"是破案关键，仔细分析每个嫌疑人与死者的关系。', tags: ['技巧', '动机'] },
  { id: 't4', type: 'tip', content: '嫌疑人的"谎言"往往是破案的突破口，注意他们在回答中的矛盾。', tags: ['技巧', '谎言'] },
  { id: 't5', type: 'tip', content: '"不在场证明"是真凶最在意的部分，交叉验证多个嫌疑人的时间线。', tags: ['技巧', '时间线'] }
]

// 默认沉浸配置
export const DEFAULT_IMMERSION_CONFIG: ImmersionConfig = {
  level: 'basic',
  modelMode: 'unified',
  musicVolume: 50,
  soundEffectsEnabled: true
}