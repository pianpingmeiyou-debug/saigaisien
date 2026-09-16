export type UserRole = 'victim' | 'supporter' | 'both' // victim=被災者, supporter=支援者, both=被災者+支援者(共助)

export type RoleType = 'user' | 'admin'

export type AccountStatus = 'active' | 'frozen'

export type PostType = 'request' | 'offer' // request = 依頼, offer = 提供

export type PostCategory =
  | '食料'
  | '飲料'
  | '衣類'
  | '医薬品'
  | '生活用品'
  | '電気機器'
  | '乳幼児用品'
  | 'その他'

export type UrgencyLevel = '高' | '中' | '低'

export interface UserProfile {
  id: string
  name: string // 公開表示名（ニックネーム）
  role: RoleType // user or admin
  user_role: UserRole // victim, supporter, both
  disaster_prefecture: string
  disaster_city: string
  account_status: AccountStatus // active or frozen
  is_demo?: boolean
  linked_google?: boolean
  linked_line?: boolean
  email?: string
  created_at?: string
  updated_at?: string
}

export interface PostItem {
  id: string
  user_id: string
  user_name: string // 投稿者の公開表示名
  type: PostType
  category: PostCategory
  title: string
  description: string
  received_location: string
  received_prefecture: string
  received_city: string
  urgency: UrgencyLevel
  created_at: string
  updated_at?: string
  status: 'published' | 'hidden' | 'deleted' | '募集中' | 'マッチ済み' | '完了'
  tags?: string[]
  report_count?: number
  image_url?: string
}

export interface DisasterLevelItem {
  prefecture: string
  city: string
  level: number // 0, 1, 2, 3
  updated_at: string
}

export interface MatchItem {
  id: string
  post_id: string
  victim_id: string
  supporter_id: string
  status: 'proposed' | 'accepted' | 'completed' | 'cancelled'
  created_at: string
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  sender_name: string
  body: string
  created_at: string
}

export interface ChatSession {
  id: string
  match_id: string
  post_id: string
  post_title: string
  victim_id: string
  victim_name?: string
  supporter_id: string
  supporter_name?: string
  status: 'before_support' | 'supporting' | 'completed'
  support_started_at?: string
  victim_completed_at?: string
  supporter_completed_at?: string
  completed_at?: string
  created_at: string
  messages: ChatMessage[]
}

export type ReportTargetType = 'post' | 'map_pin' | 'chat_user'

export type ReportStatus = 'pending' | 'deleted' | 'rejected'

export const REPORT_REASONS = [
  '不適切な内容',
  '虚偽・誤情報',
  '迷惑行為',
  '危険な内容',
  '個人情報の掲載',
  '重複投稿',
  'その他',
] as const

export type ReportReason = typeof REPORT_REASONS[number]

export interface ReportItem {
  id: string
  reporter_user_id: string
  target_type: ReportTargetType
  target_id: string
  target_title?: string
  target_author_name?: string
  reason: ReportReason
  detail?: string
  status: ReportStatus
  created_at: string
}

export interface MapPinItem {
  id: string
  user_id?: string
  author: string
  type: '避難所' | '道路通行不能' | '通行注意' | '土砂崩れ' | '倒壊' | '通行止め' | '浸水' | '求援' | '指定物資置き場'
  title: string
  content: string
  lat: number
  lng: number
  photo?: string
  verified?: boolean
  created_at?: string
  report_count?: number
  status?: 'published' | 'hidden' | 'deleted'
}
