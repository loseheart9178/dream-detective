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
  protocol?: ApiProtocol
}

// API供应商类型
export type ApiProvider = 'openai' | 'dashscope' | 'deepseek' | 'claude' | 'zhipu' | 'moonshot' | 'local'

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
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    allowCustomUrl: false,
    protocol: 'openai',
    modelSuggestions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  dashscope: {
    name: '通义千问',
    displayName: '通义千问 (阿里云)',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    defaultModel: 'qwen-max',
    keyPlaceholder: '请输入Dashscope API Key',
    docsUrl: 'https://dashscope.console.aliyun.com/apiKey',
    allowCustomUrl: false,
    protocol: 'dashscope',
    modelSuggestions: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long']
  },
  deepseek: {
    name: 'DeepSeek',
    displayName: 'DeepSeek (深度求索)',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    allowCustomUrl: false,
    protocol: 'openai',
    modelSuggestions: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder']
  },
  claude: {
    name: 'Claude',
    displayName: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    allowCustomUrl: false,
    protocol: 'anthropic',
    modelSuggestions: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest']
  },
  zhipu: {
    name: '智谱AI',
    displayName: '智谱AI (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4-plus',
    keyPlaceholder: '请输入智谱API Key',
    docsUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    allowCustomUrl: false,
    protocol: 'openai',
    modelSuggestions: ['glm-4-plus', 'glm-4-flash', 'glm-4', 'glm-4-air']
  },
  moonshot: {
    name: 'Moonshot',
    displayName: 'Moonshot (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    allowCustomUrl: false,
    protocol: 'openai',
    modelSuggestions: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
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
    modelSuggestions: ['llama3', 'qwen2', 'mistral', 'codellama', 'deepseek-coder']
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