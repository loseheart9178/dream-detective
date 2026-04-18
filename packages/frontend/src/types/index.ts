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
}

// API供应商类型
export type ApiProvider = 'openai' | 'dashscope' | 'deepseek' | 'claude' | 'zhipu' | 'moonshot' | 'local-openai' | 'local-anthropic'

// API配置类型
export interface ApiConfig {
  apiProvider: ApiProvider
  apiKey: string
  apiUrl: string
  model: string
}

// 本地部署配置
export const LOCAL_PROVIDERS: Record<string, {
  name: string
  displayName: string
  defaultPort: string
  endpoint: string
  authHeader: string
}> = {
  'local-openai': {
    name: '本地OpenAI兼容',
    displayName: '本地部署 (OpenAI兼容)',
    defaultPort: '11434',
    endpoint: '/v1/chat/completions',
    authHeader: 'Bearer'
  },
  'local-anthropic': {
    name: '本地Anthropic兼容',
    displayName: '本地部署 (Anthropic兼容)',
    defaultPort: '8080',
    endpoint: '/v1/messages',
    authHeader: 'x-api-key'
  }
}

// 预设供应商配置
export const API_PROVIDERS: Record<ApiProvider, {
  name: string
  displayName: string
  baseUrl: string
  models: Array<{ id: string; name: string; default: boolean }>
  keyPlaceholder: string
  docsUrl: string
  allowCustomUrl: boolean
  allowCustomModel: boolean
}> = {
  openai: {
    name: 'OpenAI',
    displayName: 'OpenAI (GPT-4o)',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (推荐)', default: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (经济)', default: false },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', default: false }
    ],
    keyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    allowCustomUrl: false,
    allowCustomModel: false
  },
  dashscope: {
    name: '通义千问',
    displayName: '通义千问 (阿里云)',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    models: [
      { id: 'qwen-max', name: 'Qwen-Max (推荐)', default: true },
      { id: 'qwen-plus', name: 'Qwen-Plus', default: false },
      { id: 'qwen-turbo', name: 'Qwen-Turbo (经济)', default: false }
    ],
    keyPlaceholder: '请输入Dashscope API Key',
    docsUrl: 'https://dashscope.console.aliyun.com/apiKey',
    allowCustomUrl: false,
    allowCustomModel: false
  },
  deepseek: {
    name: 'DeepSeek',
    displayName: 'DeepSeek (深度求索)',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (推荐)', default: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', default: false }
    ],
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    allowCustomUrl: false,
    allowCustomModel: false
  },
  claude: {
    name: 'Claude',
    displayName: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (推荐)', default: true },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', default: false },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', default: false }
    ],
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    allowCustomUrl: false,
    allowCustomModel: false
  },
  zhipu: {
    name: '智谱AI',
    displayName: '智谱AI (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus (推荐)', default: true },
      { id: 'glm-4-flash', name: 'GLM-4 Flash (免费)', default: false }
    ],
    keyPlaceholder: '请输入智谱API Key',
    docsUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    allowCustomUrl: false,
    allowCustomModel: false
  },
  moonshot: {
    name: 'Moonshot',
    displayName: 'Moonshot (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', default: true },
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', default: false }
    ],
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    allowCustomUrl: false,
    allowCustomModel: false
  },
  'local-openai': {
    name: '本地OpenAI兼容',
    displayName: '本地部署 (OpenAI兼容)',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    models: [
      { id: '', name: '请输入模型名称', default: true }
    ],
    keyPlaceholder: '请输入API Key（可留空）',
    docsUrl: '',
    allowCustomUrl: true,
    allowCustomModel: true
  },
  'local-anthropic': {
    name: '本地Anthropic兼容',
    displayName: '本地部署 (Anthropic兼容)',
    baseUrl: 'http://localhost:8080/v1/messages',
    models: [
      { id: '', name: '请输入模型名称', default: true }
    ],
    keyPlaceholder: '请输入API Key（可留空）',
    docsUrl: '',
    allowCustomUrl: true,
    allowCustomModel: true
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
}

// 游戏状态类型
export interface GameState {
  currentCase: Case | null
  progress: UserProgress | null
  isLoading: boolean
  error: string | null
}