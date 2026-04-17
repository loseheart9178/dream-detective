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
  apiProvider?: 'openai' | 'dashscope'
}

// API配置类型
export interface ApiConfig {
  apiKey: string
  apiProvider: 'openai' | 'dashscope'
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