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
  apiKey?: string
  apiUrl?: string
  apiProvider?: ApiProvider
  model?: string
  protocol?: ApiProtocol
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