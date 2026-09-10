export type UserRole = 'victim' | 'supporter'

export type PostType = 'request' | 'offer' // request = 依頼, offer = 提供

export type PostCategory =
  | '食料'
  | '飲料'
  | '衣類'
  | '医薬品'
  | '生活用品'
  | '電気機器'
  | 'その他'

export type UrgencyLevel = '高' | '中' | '低'

export interface UserProfile {
  id: string
  name: string
  role: UserRole
  disaster_prefecture: string
  disaster_city: string
}

export interface PostItem {
  id: string
  user_id: string
  user_name: string
  type: PostType
  category: PostCategory
  title: string
  description: string
  received_location: string
  received_prefecture: string
  received_city: string
  urgency: UrgencyLevel
  created_at: string
  status: '募集中' | 'マッチ済み' | '完了'
  tags?: string[]
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
  supporter_id: string
  status: 'before_support' | 'supporting' | 'completed'
  support_started_at?: string
  victim_completed_at?: string
  supporter_completed_at?: string
  completed_at?: string
  created_at: string
  messages: ChatMessage[]
}
