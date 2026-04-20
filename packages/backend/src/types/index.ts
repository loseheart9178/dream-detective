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

export interface GenerateCaseRequest {
  keywords: string
  difficulty: number
  numSuspects: number
  apiKey?: string
  apiProvider?: ApiProvider
  apiUrl?: string
  model?: string
  protocol?: ApiProtocol
}

export type ApiProvider = 'openai' | 'dashscope' | 'deepseek' | 'claude' | 'zhipu' | 'moonshot' | 'local' | 'minimax' | 'custom'

// API协议类型
export type ApiProtocol = 'openai' | 'anthropic' | 'dashscope'

export interface ApiConfig {
  apiProvider: ApiProvider
  apiKey: string
  apiUrl: string
  model: string
  protocol?: ApiProtocol
}

export interface SubmitAnswerRequest {
  killerId: string
  explanation: string
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