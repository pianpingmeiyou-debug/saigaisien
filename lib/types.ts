export type UserRole = 'victim' | 'supporter' | 'both' // victim=被災者, supporter=支援者, both=被災者+支援者(共助)

export type RoleType = 'user' | 'admin'

export type AccountStatus = 'active' | 'frozen'

export type PostType = 'request' | 'offer' // request = 依頼, offer = 提供

export type PostCategory =
  | '食料'
  | '飲料'
  | '飲料水'
  | '衣類'
  | '医薬品'
  | '生活用品'
  | '衛生用品'
  | '電気機器'
  | '乳幼児用品'
  | 'その他'

export type UrgencyLevel = '高' | '中' | '低'

export interface UserAuditLog {
  timestamp: string
  action: string
  details: string
}

export interface UserProfile {
  id: string
  user_code: string // ユーザーコード (例: ASU-8829-X39)
  name: string // 公開表示名（ニックネーム）
  role: RoleType // user or admin
  user_role: UserRole // victim, supporter, both
  disaster_prefecture: string
  disaster_city: string
  account_status: AccountStatus // active or frozen
  is_demo?: boolean
  is_verified?: boolean // 本人確認済み（認証マーク表示）
  card_id?: string // デジタル会員証ID
  birth_date?: string // 生年月日
  issue_date?: string // 会員証発行日
  expire_date?: string // 会員証有効期限
  verified_at?: string // 本人確認日時
  verified_method?: string // 本人確認方法
  supporter_qualification?: string // 支援者資格の確認
  audit_logs?: UserAuditLog[] // 監査ログ
  email?: string
  linked_google?: boolean
  linked_line?: boolean
  created_at?: string
  updated_at?: string
}

export interface PostItem {
  id: string
  user_id: string
  user_name: string // 投稿者の公開表示名
  is_verified_user?: boolean // 認証マーク表示フラグ
  type: PostType
  category: PostCategory
  categories?: PostCategory[] // 物資カテゴリの複数選択対応
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
  sender_is_verified?: boolean
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
  victim_is_verified?: boolean
  supporter_id: string
  supporter_name?: string
  supporter_is_verified?: boolean
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

export type PinCategory =
  | '避難所'
  | '井戸'
  | '自販機'
  | '道路通行不能'
  | '通行注意'
  | '土砂崩れ'
  | '倒壊'
  | '通行止め'
  | '浸水'
  | '求援'
  | '指定物資置き場'

export interface VoteDetail {
  id: string
  user_id: string
  user_name: string
  vote_type: 'correct' | 'different'
  comment?: string
  file_url?: string
  created_at: string
}

export interface ShelterReport {
  id: string
  user_id: string
  user_name: string
  people_count: string
  gender_ratio: string
  facility_details: string
  created_at: string
}

export interface SubPostItem {
  id: string
  user_id: string
  user_name: string
  content: string
  photo?: string
  created_at: string
}

export interface MapPinItem {
  id: string
  user_id?: string
  author: string
  author_is_verified?: boolean
  type: PinCategory
  title: string
  content: string
  lat: number
  lng: number
  photo?: string
  verified?: boolean
  created_at: string
  report_count?: number
  status?: 'published' | 'hidden' | 'deleted'
  // 正しい/異なる件数
  correct_count?: number
  different_count?: number
  user_voted?: Record<string, 'correct' | 'different'>
  vote_details?: VoteDetail[]
  // 同一場所の複数投稿蓄積
  sub_posts?: SubPostItem[]
  // 避難所情報蓄積
  shelter_reports?: ShelterReport[]
}

export interface SystemStatus {
  is_stopped: boolean
  stopped_at?: string
}

