import { parseLocation, calculateDistanceKm, findCity, PREFECTURES, CITIES_DATA } from './cities'
import {
  UserProfile,
  PostItem,
  DisasterLevelItem,
  ChatSession,
  ChatMessage,
  UserRole,
  PostCategory,
  UrgencyLevel,
  PostType,
  ReportItem,
  ReportReason,
  ReportTargetType,
  MapPinItem,
  PinCategory,
  VoteDetail,
  ShelterReport,
  SubPostItem,
  SystemStatus,
} from './types'

export type {
  UserProfile,
  PostItem,
  DisasterLevelItem,
  ChatSession,
  ChatMessage,
  UserRole,
  PostCategory,
  UrgencyLevel,
  PostType,
  ReportItem,
  ReportReason,
  ReportTargetType,
  MapPinItem,
  PinCategory,
  VoteDetail,
  ShelterReport,
  SubPostItem,
  SystemStatus,
}

const STORAGE_KEY_PREFIX = 'asunowa_'

// 12時間以内判定
export function isWithin12Hours(dateStr: string): boolean {
  if (!dateStr) return false
  const time = new Date(dateStr).getTime()
  const diffHours = (Date.now() - time) / (1000 * 60 * 60)
  return diffHours >= 0 && diffHours <= 12
}

// ユーザーコード生成
export function generateUserCode(): string {
  const rand = Math.floor(1000 + Math.random() * 9000)
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const char = letters[Math.floor(Math.random() * letters.length)]
  return `ASU-${rand}-${char}`
}

// 全国市区町村の初期災害レベル (初期値 Lv0)
const INITIAL_DISASTER_LEVELS: DisasterLevelItem[] = CITIES_DATA.map(c => ({
  prefecture: c.prefecture,
  city: c.city,
  level: 0,
  updated_at: new Date().toISOString(),
}))

// 未ログイン状態の初期ユーザー（1-1-1 仕様）
const INITIAL_UNLOGGED_USER: UserProfile = {
  id: 'user_unregistered',
  user_code: '',
  name: '',
  role: 'user',
  user_role: 'victim',
  disaster_prefecture: '',
  disaster_city: '',
  account_status: 'active',
  is_demo: false,
  is_verified: false,
}

// デモユーザーの初期データ (1-2, 3-1-1 仕様: 会員証発行済み)
const INITIAL_DEMO_USER: UserProfile = {
  id: 'user_demo_1',
  user_code: 'ASU-9900-DEMO',
  card_id: 'CARD-2026-88192',
  name: 'あすのわ太郎',
  role: 'user',
  user_role: 'victim', // victim, supporter, both
  disaster_prefecture: '鳥取県',
  disaster_city: '米子市',
  account_status: 'active',
  is_demo: true,
  is_verified: true,
  birth_date: '1995年4月12日',
  issue_date: '2026年01月15日',
  expire_date: '2028年01月15日',
  verified_at: '2026-01-15T10:00:00Z',
  verified_method: '公的個人認証サービス（マイナンバーカード）',
  supporter_qualification: '防災士・普通救命講習修了',
  audit_logs: [
    { timestamp: '2026-01-15 10:00:00', action: '本人確認承認', details: 'マイナンバーカード公的署名による自動照合成功' },
    { timestamp: '2026-02-01 14:20:00', action: '資格情報更新', details: '防災士資格証明書の提示を確認' },
  ],
}

// 登録ユーザー一覧（ログイン・管理者照合用）
const INITIAL_ALL_USERS: UserProfile[] = [
  INITIAL_DEMO_USER,
  {
    id: 'user_supporter_1',
    user_code: 'ASU-1024-SUPP',
    card_id: 'CARD-2026-11024',
    name: '佐藤 健',
    role: 'user',
    user_role: 'supporter',
    disaster_prefecture: '鳥取県',
    disaster_city: '米子市',
    account_status: 'active',
    is_demo: false,
    is_verified: true,
    email: 'sato@example.com',
    birth_date: '1988年11月03日',
    issue_date: '2026年02月01日',
    expire_date: '2028年02月01日',
    verified_at: '2026-02-01T11:30:00Z',
    verified_method: '運転免許証確認',
    supporter_qualification: 'ボランティア経験多数',
  },
  {
    id: 'user_victim_1',
    user_code: 'ASU-5512-VICT',
    card_id: 'CARD-2026-55120',
    name: '鈴木 花子',
    role: 'user',
    user_role: 'victim',
    disaster_prefecture: '鳥取県',
    disaster_city: '鳥取市',
    account_status: 'active',
    is_demo: false,
    is_verified: false,
    email: 'suzuki@example.com',
  },
  {
    id: 'user_admin_master',
    user_code: 'ASU-0000-ADMIN',
    card_id: 'CARD-ADMIN-00001',
    name: '管理者 (明日の環運営)',
    role: 'admin',
    user_role: 'both',
    disaster_prefecture: '東京都',
    disaster_city: '千代田区',
    account_status: 'active',
    is_demo: false,
    is_verified: true,
    email: 'admin@asunowa.jp',
    birth_date: '1980年01月01日',
    issue_date: '2026年01月01日',
    expire_date: '2030年01月01日',
  },
]

// 初期投稿データ
const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post_1',
    user_id: 'user_supporter_1',
    user_name: '佐藤 健',
    is_verified_user: true,
    type: 'offer',
    category: '飲料',
    title: '500mlミネラルウォーター 24本提供可能',
    description: '米子市内でお渡し可能です。自家用車で指定場所まで持っていけます。',
    received_location: '鳥取県米子市河井町 避難所前',
    received_prefecture: '鳥取県',
    received_city: '米子市',
    urgency: '高',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: '募集中',
    tags: ['水', '車移動可'],
    report_count: 0,
  },
  {
    id: 'post_2',
    user_id: 'user_victim_1',
    user_name: '鈴木 花子',
    is_verified_user: false,
    type: 'request',
    category: '乳幼児用品',
    title: '粉ミルクとMサイズおむつが緊急で必要です',
    description: '生後8ヶ月の乳児がいます。鳥取市内の避難所で受け取り希望です。',
    received_location: '鳥取県鳥取市尚徳町 市民体育館',
    received_prefecture: '鳥取県',
    received_city: '鳥取市',
    urgency: '高',
    created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    status: '募集中',
    tags: ['粉ミルク', 'おむつ'],
    report_count: 0,
  },
  {
    id: 'post_3',
    user_id: 'user_supporter_2',
    user_name: '高橋 誠',
    is_verified_user: true,
    type: 'offer',
    category: '電気機器',
    title: 'モバイルバッテリー・ポータブル電源貸出',
    description: '大容量ポータブル電源1台とフル充電済みバッテリー3個をお貸しできます。',
    received_location: '鳥取県米子市東町',
    received_prefecture: '鳥取県',
    received_city: '米子市',
    urgency: '中',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: '募集中',
    tags: ['電源', 'スマホ充電'],
    report_count: 0,
  },
  {
    id: 'post_4',
    user_id: 'user_supporter_3',
    user_name: '山本 一郎',
    is_verified_user: false,
    type: 'offer',
    category: '衣類',
    title: '防寒着・大人用毛布 5枚',
    description: '未使用の防寒毛布が余っています。お届けします。',
    received_location: '鳥取県境港市竹内団地',
    received_prefecture: '鳥取県',
    received_city: '境港市',
    urgency: '中',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: '募集中',
    tags: ['毛布', '防寒'],
    report_count: 0,
  },
]

// 初期チャット
const INITIAL_CHATS: ChatSession[] = [
  {
    id: 'chat_demo_1',
    match_id: 'match_demo_1',
    post_id: 'post_demo_1',
    post_title: '保存食・カンパン 10箱のお渡し',
    victim_id: 'user_demo_1',
    victim_name: 'あすのわ太郎',
    victim_is_verified: true,
    supporter_id: 'user_supporter_1',
    supporter_name: '佐藤 健',
    supporter_is_verified: true,
    status: 'supporting',
    support_started_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    messages: [
      {
        id: 'msg_1',
        chat_id: 'chat_demo_1',
        sender_id: 'user_supporter_1',
        sender_name: '佐藤 健',
        sender_is_verified: true,
        body: 'はじめまして。保存食10箱をお持ちします。避難所入口で15時頃いかがでしょうか？',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'msg_2',
        chat_id: 'chat_demo_1',
        sender_id: 'user_demo_1',
        sender_name: 'あすのわ太郎',
        sender_is_verified: true,
        body: '大変助かります！15時に避難所入口でお待ちしております。',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: 'msg_3',
        chat_id: 'chat_demo_1',
        sender_id: 'user_supporter_1',
        sender_name: '佐藤 健',
        sender_is_verified: true,
        body: 'ただいま車で移動開始いたしました。「支援を開始する」を押しました。',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
  },
]

// 初期地図ピン (井戸・自販機・避難所を含む)
const INITIAL_MAP_PINS: MapPinItem[] = [
  {
    id: 'pin_1',
    type: '避難所',
    title: '米子市総合体育館 避難所',
    author: '米子市防災課',
    author_is_verified: true,
    content: '物資受取・仮眠スペースあり。給水口設置済み。',
    lat: 35.435,
    lng: 133.34,
    verified: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    report_count: 0,
    status: 'published',
    correct_count: 12,
    different_count: 0,
    shelter_reports: [
      {
        id: 'sr_1',
        user_id: 'user_demo_1',
        user_name: 'あすのわ太郎',
        people_count: '約120名',
        gender_ratio: '男性4:女性6 (高齢者多数)',
        facility_details: '暖房稼働中、毛布追加配布あり。ペット同伴スペース屋外に確保。',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: 'pin_2',
    type: '井戸',
    title: '河井町 公共生活用水井戸',
    author: '地域ボランティア',
    author_is_verified: true,
    content: '手押しポンプ使用可能。飲用には煮沸推奨。生活用水としてご利用ください。',
    lat: 35.429,
    lng: 133.332,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    report_count: 0,
    status: 'published',
    correct_count: 5,
    different_count: 0,
  },
  {
    id: 'pin_3',
    type: '自販機',
    title: '米子駅前 災害時フリー自販機',
    author: '駅前商店会',
    author_is_verified: true,
    content: '停電時無料供給モード稼働中。ボタンを押すだけで飲料が出てきます。',
    lat: 35.423,
    lng: 133.336,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    report_count: 0,
    status: 'published',
    correct_count: 8,
    different_count: 1,
  },
  {
    id: 'pin_4',
    type: '浸水',
    title: '米子市役所周辺 冠水情報',
    author: '山田 健',
    author_is_verified: false,
    content: '水深約15cm。普通車の通行は低速なら可能ですが注意してください。',
    lat: 35.4281,
    lng: 133.3308,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    report_count: 0,
    status: 'published',
    correct_count: 3,
    different_count: 0,
  },
  {
    id: 'pin_5',
    type: '通行注意',
    title: '加茂川橋付近 ひび割れ',
    author: '佐藤 健',
    author_is_verified: true,
    content: '橋梁面に段差発生。片側交互通行となっています。',
    lat: 35.432,
    lng: 133.328,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    report_count: 0,
    status: 'published',
    correct_count: 7,
    different_count: 0,
  },
]

// Helper for LocalStorage
function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = window.localStorage.getItem(STORAGE_KEY_PREFIX + key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage save error:', e)
  }
}

// システム全面停止ステータス
export function getSystemStatus(): SystemStatus {
  return getStorage<SystemStatus>('system_status', { is_stopped: false })
}

export function saveSystemStopped(stopped: boolean): SystemStatus {
  const status: SystemStatus = {
    is_stopped: stopped,
    stopped_at: stopped ? new Date().toISOString() : undefined,
  }
  setStorage('system_status', status)
  return status
}

// ユーザー情報
export function getUserProfile(): UserProfile {
  return getStorage<UserProfile>('user', INITIAL_UNLOGGED_USER)
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile()
  let userCode = current.user_code
  if (!userCode && (profile.name || profile.disaster_city)) {
    userCode = generateUserCode()
  }

  const updated: UserProfile = {
    ...current,
    ...profile,
    user_code: profile.user_code ?? userCode ?? '',
    updated_at: new Date().toISOString(),
  }
  setStorage('user', updated)

  // 管理者用全ユーザーリストも同期
  const allUsers = getAllUsers()
  const idx = allUsers.findIndex(u => u.id === updated.id)
  if (idx >= 0) {
    allUsers[idx] = updated
  } else if (updated.id !== 'user_unregistered') {
    allUsers.push(updated)
  }
  setStorage('all_users', allUsers)

  return updated
}

export function setDemoUserMode(role: UserRole = 'victim'): UserProfile {
  const updatedDemo: UserProfile = {
    ...INITIAL_DEMO_USER,
    user_role: role,
  }
  setStorage('user', updatedDemo)
  return updatedDemo
}

export function setAdminUserMode(): UserProfile {
  const adminUser = INITIAL_ALL_USERS.find(u => u.role === 'admin') || INITIAL_ALL_USERS[3]
  setStorage('user', adminUser)
  return adminUser
}

export function loginWithUserCode(code: string): { success: boolean; user?: UserProfile; error?: string } {
  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) return { success: false, error: 'ユーザーコードを入力してください' }

  const allUsers = getAllUsers()
  const found = allUsers.find(u => u.user_code.toUpperCase() === cleanCode)
  if (found) {
    setStorage('user', found)
    return { success: true, user: found }
  }

  const newUser: UserProfile = {
    id: 'user_' + Date.now(),
    user_code: cleanCode,
    name: '一般ユーザー (' + cleanCode.slice(-4) + ')',
    role: 'user',
    user_role: 'victim',
    disaster_prefecture: '鳥取県',
    disaster_city: '米子市',
    account_status: 'active',
    is_demo: false,
    is_verified: false,
  }
  saveUserProfile(newUser)
  return { success: true, user: newUser }
}

export function getAllUsers(): UserProfile[] {
  return getStorage<UserProfile[]>('all_users', INITIAL_ALL_USERS)
}

export function updateUserAccountStatus(userId: string, status: 'active' | 'frozen'): UserProfile[] {
  const allUsers = getAllUsers()
  const updated = allUsers.map(u => (u.id === userId ? { ...u, account_status: status } : u))
  setStorage('all_users', updated)

  const currentUser = getUserProfile()
  if (currentUser.id === userId) {
    saveUserProfile({ account_status: status })
  }
  return updated
}

// 災害レベル
export function getDisasterLevels(): DisasterLevelItem[] {
  return getStorage<DisasterLevelItem[]>('disaster_levels', INITIAL_DISASTER_LEVELS)
}

export function saveDisasterLevel(pref: string, city: string, level: number): DisasterLevelItem[] {
  const current = getDisasterLevels()
  const idx = current.findIndex(item => item.prefecture === pref && item.city === city)
  const updatedItem: DisasterLevelItem = {
    prefecture: pref,
    city: city,
    level,
    updated_at: new Date().toISOString(),
  }

  let updatedList: DisasterLevelItem[]
  if (idx >= 0) {
    updatedList = [...current]
    updatedList[idx] = updatedItem
  } else {
    updatedList = [...current, updatedItem]
  }

  setStorage('disaster_levels', updatedList)
  return updatedList
}

export function getCityDisasterLevel(pref: string, city: string): number {
  if (!pref || !city) return 0
  const levels = getDisasterLevels()
  const found = levels.find(l => l.prefecture === pref && l.city === city)
  return found ? found.level : 0
}

export function getLocationDisasterLevel(locationStr: string): number {
  const parsed = parseLocation(locationStr)
  return getCityDisasterLevel(parsed.prefecture, parsed.city)
}

// 投稿
export function getPosts(): PostItem[] {
  return getStorage<PostItem[]>('posts', INITIAL_POSTS)
}

export function getMyPosts(userId?: string): PostItem[] {
  const user = getUserProfile()
  const targetId = userId || user.id
  const posts = getPosts()
  return posts.filter(p => p.user_id === targetId && p.status !== 'deleted')
}

export function updatePost(postId: string, updatedFields: Partial<PostItem>): { success: boolean; post?: PostItem; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため、投稿の編集はできません。' }
  }

  const posts = getPosts()
  const idx = posts.findIndex(p => p.id === postId)
  if (idx < 0) return { success: false, error: '投稿が見つかりませんでした' }

  if (posts[idx].user_id !== user.id && user.role !== 'admin') {
    return { success: false, error: '他のユーザーの投稿は編集できません' }
  }

  const updated: PostItem = {
    ...posts[idx],
    ...updatedFields,
    updated_at: new Date().toISOString(),
  }
  posts[idx] = updated
  setStorage('posts', posts)
  return { success: true, post: updated }
}

export function deletePost(postId: string): { success: boolean; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen' && user.role !== 'admin') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため操作できません。' }
  }

  const posts = getPosts()
  const idx = posts.findIndex(p => p.id === postId)
  if (idx < 0) return { success: false, error: '投稿が見つかりませんでした' }

  if (posts[idx].user_id !== user.id && user.role !== 'admin') {
    return { success: false, error: '他のユーザーの投稿は削除できません' }
  }

  posts.splice(idx, 1)
  setStorage('posts', posts)
  return { success: true }
}

export function getSortedFilteredPosts(userPref: string, userCity: string, userRole: UserRole): PostItem[] {
  const posts = getPosts()
  const userCityInfo = (userPref && userCity) ? (findCity(userPref, userCity) ?? { lat: 35.4281, lng: 133.3308 }) : { lat: 35.4281, lng: 133.3308 }

  const filtered = posts.filter(p => {
    if (p.status === 'hidden' || p.status === 'deleted') return false
    if (userRole === 'victim') return p.type === 'offer'
    if (userRole === 'supporter') return p.type === 'request'
    return true // 'both'
  })

  const urgencyScore = { 高: 3, 中: 2, 低: 1 }

  return [...filtered].sort((a, b) => {
    const aIsMatchPrefCity = a.received_prefecture === userPref && a.received_city === userCity
    const bIsMatchPrefCity = b.received_prefecture === userPref && b.received_city === userCity

    if (aIsMatchPrefCity !== bIsMatchPrefCity) {
      return aIsMatchPrefCity ? -1 : 1
    }

    const locA = parseLocation(a.received_location)
    const locB = parseLocation(b.received_location)

    const distA = calculateDistanceKm(userCityInfo.lat, userCityInfo.lng, locA.lat, locA.lng)
    const distB = calculateDistanceKm(userCityInfo.lat, userCityInfo.lng, locB.lat, locB.lng)

    if (distA !== distB) {
      return distA - distB
    }

    const scoreA = urgencyScore[a.urgency] ?? 0
    const scoreB = urgencyScore[b.urgency] ?? 0
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function addPost(newPostData: {
  title?: string
  category?: PostCategory
  categories?: PostCategory[]
  description: string
  received_location: string
  urgency: UrgencyLevel
  type?: PostType
  tags?: string[]
  image_url?: string
}): { success: boolean; post?: PostItem; error?: string } {
  const user = getUserProfile()

  if (user.account_status === 'frozen') {
    return {
      success: false,
      error: 'ご利用のアカウントは凍結されているため、新規投稿はできません。',
    }
  }

  const parsed = parseLocation(newPostData.received_location)
  const currentLevel = getCityDisasterLevel(parsed.prefecture, parsed.city)

  if (currentLevel >= 3) {
    return {
      success: false,
      error: 'この機能はレベル2以下の時のみ使用できます。安全な状態になるまでお待ち下さい。',
    }
  }

  let postType: PostType = newPostData.type || (user.user_role === 'victim' ? 'request' : 'offer')
  if (user.user_role === 'victim') postType = 'request'
  if (user.user_role === 'supporter') postType = 'offer'

  const selectedCategories: PostCategory[] = (newPostData.categories && newPostData.categories.length > 0)
    ? newPostData.categories
    : (newPostData.category ? [newPostData.category] : ['その他'])

  const primaryCategory = selectedCategories[0]

  const created: PostItem = {
    id: 'post_' + Date.now(),
    user_id: user.id,
    user_name: user.name || '明日の環ユーザー',
    is_verified_user: !!user.is_verified,
    type: postType,
    category: primaryCategory,
    categories: selectedCategories,
    title: newPostData.title || `${selectedCategories.join('・')}に関するお知らせ・受付`,
    description: newPostData.description,
    received_location: newPostData.received_location,
    received_prefecture: parsed.prefecture,
    received_city: parsed.city,
    urgency: newPostData.urgency,
    created_at: new Date().toISOString(),
    status: '募集中',
    tags: newPostData.tags,
    report_count: 0,
    image_url: newPostData.image_url,
  }

  const posts = getPosts()
  const updated = [created, ...posts]
  setStorage('posts', updated)

  return { success: true, post: created }
}

// 地図ピン
export function getMapPins(): MapPinItem[] {
  return getStorage<MapPinItem[]>('map_pins', INITIAL_MAP_PINS)
}

// 7-1 ピン投稿 (直近15km以内判定 & 投稿タイトルの非必須)
export function addMapPin(pinData: {
  type: PinCategory
  title?: string
  content?: string
  lat: number
  lng: number
  photo?: string
  userLat?: number
  userLng?: number
}): { success: boolean; pin?: MapPinItem; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため、ピンの設置はできません。' }
  }

  // 15km以内距離チェック
  if (pinData.userLat !== undefined && pinData.userLng !== undefined) {
    const distKm = calculateDistanceKm(pinData.userLat, pinData.userLng, pinData.lat, pinData.lng)
    if (distKm > 15) {
      return { success: false, error: '位置情報が離れているため、ピンを立てられません' }
    }
  }

  const newPin: MapPinItem = {
    id: 'pin_' + Date.now(),
    user_id: user.id,
    author: user.name || '地域ユーザー',
    author_is_verified: !!user.is_verified,
    type: pinData.type,
    title: pinData.title || `${pinData.type}の地点情報`,
    content: pinData.content || '',
    lat: pinData.lat,
    lng: pinData.lng,
    photo: pinData.photo,
    verified: user.role === 'admin',
    created_at: new Date().toISOString(),
    report_count: 0,
    status: 'published',
    correct_count: 0,
    different_count: 0,
  }

  const pins = getMapPins()
  const updated = [newPin, ...pins]
  setStorage('map_pins', updated)
  return { success: true, pin: newPin }
}

// 9. 「正しい〇」「異なる✕」確認・投票機能 (2km以内 & 補足情報追加)
export function votePin(
  pinId: string,
  voteType: 'correct' | 'different',
  comment?: string,
  photoUrl?: string,
  userLat?: number,
  userLng?: number
): { success: boolean; pin?: MapPinItem; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため操作できません。' }
  }

  const pins = getMapPins()
  const pin = pins.find(p => p.id === pinId)
  if (!pin) return { success: false, error: '該当のピンが見つかりません' }

  // 2km以内チェック
  if (userLat !== undefined && userLng !== undefined) {
    const distKm = calculateDistanceKm(userLat, userLng, pin.lat, pin.lng)
    if (distKm > 2) {
      return { success: false, error: '投稿地点から離れているため、確認・投票を行えません（2km以内が必要）。' }
    }
  }

  const userVoted = pin.user_voted || {}
  if (userVoted[user.id]) {
    return { success: false, error: 'すでにこの投稿へ評価を投票済みです。' }
  }

  userVoted[user.id] = voteType
  pin.user_voted = userVoted

  if (voteType === 'correct') {
    pin.correct_count = (pin.correct_count || 0) + 1
  } else {
    pin.different_count = (pin.different_count || 0) + 1
  }

  if (comment || photoUrl) {
    const detail: VoteDetail = {
      id: 'vdet_' + Date.now(),
      user_id: user.id,
      user_name: user.name || '確認者',
      vote_type: voteType,
      comment: comment?.trim(),
      file_url: photoUrl,
      created_at: new Date().toISOString(),
    }
    pin.vote_details = [detail, ...(pin.vote_details || [])]
  }

  setStorage('map_pins', pins)
  return { success: true, pin }
}

// 12. 避難所への情報投稿 (人数、男女比、設備詳細 2km以内)
export function addShelterReport(
  pinId: string,
  peopleCount: string,
  genderRatio: string,
  facilityDetails: string,
  userLat?: number,
  userLng?: number
): { success: boolean; pin?: MapPinItem; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため操作できません。' }
  }

  const pins = getMapPins()
  const pin = pins.find(p => p.id === pinId)
  if (!pin) return { success: false, error: '避難所が見つかりません' }

  if (userLat !== undefined && userLng !== undefined) {
    const distKm = calculateDistanceKm(userLat, userLng, pin.lat, pin.lng)
    if (distKm > 2) {
      return { success: false, error: '避難所から離れているため、情報投稿できません（2km以内が必要）。' }
    }
  }

  const report: ShelterReport = {
    id: 'shelter_rep_' + Date.now(),
    user_id: user.id,
    user_name: user.name || '情報提供者',
    people_count: peopleCount.trim(),
    gender_ratio: genderRatio.trim(),
    facility_details: facilityDetails.trim(),
    created_at: new Date().toISOString(),
  }

  pin.shelter_reports = [report, ...(pin.shelter_reports || [])]
  setStorage('map_pins', pins)
  return { success: true, pin }
}

// 10. 同じ場所への複数投稿追加
export function addSubPostToPin(
  pinId: string,
  content: string,
  photo?: string
): { success: boolean; pin?: MapPinItem; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため操作できません。' }
  }

  const pins = getMapPins()
  const pin = pins.find(p => p.id === pinId)
  if (!pin) return { success: false, error: '該当のピンが見つかりません' }

  const subPost: SubPostItem = {
    id: 'subp_' + Date.now(),
    user_id: user.id,
    user_name: user.name || '投稿者',
    content: content.trim(),
    photo,
    created_at: new Date().toISOString(),
  }

  pin.sub_posts = [subPost, ...(pin.sub_posts || [])]
  setStorage('map_pins', pins)
  return { success: true, pin }
}

export function deleteMapPin(pinId: string): { success: boolean; error?: string } {
  const pins = getMapPins()
  const updated = pins.filter(p => p.id !== pinId)
  setStorage('map_pins', updated)
  return { success: true }
}

// 通報システム
export function getReports(): ReportItem[] {
  return getStorage<ReportItem[]>('reports', [])
}

export function createReport(data: {
  target_type: ReportTargetType
  target_id: string
  target_title?: string
  target_author_name?: string
  reason: ReportReason
  detail?: string
}): { success: boolean; error?: string } {
  const user = getUserProfile()

  if (user.account_status === 'frozen') {
    return {
      success: false,
      error: 'ご利用のアカウントは凍結されているため、通報機能はご利用いただけません。',
    }
  }

  const reports = getReports()

  const alreadyReported = reports.some(
    r => r.reporter_user_id === user.id && r.target_type === data.target_type && r.target_id === data.target_id
  )

  if (alreadyReported) {
    return { success: false, error: 'この対象はすでに通報済みです（同一対象への通報は1回までです）。' }
  }

  const newReport: ReportItem = {
    id: 'rep_' + Date.now(),
    reporter_user_id: user.id,
    target_type: data.target_type,
    target_id: data.target_id,
    target_title: data.target_title,
    target_author_name: data.target_author_name,
    reason: data.reason,
    detail: data.detail,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  reports.push(newReport)
  setStorage('reports', reports)

  const targetReportsCount = reports.filter(
    r => r.target_type === data.target_type && r.target_id === data.target_id && r.status !== 'rejected'
  ).length

  if (data.target_type === 'post') {
    const posts = getPosts()
    const p = posts.find(item => item.id === data.target_id)
    if (p) {
      p.report_count = targetReportsCount
      if (targetReportsCount >= 5) {
        p.status = 'hidden'
      }
      setStorage('posts', posts)
    }
  } else if (data.target_type === 'map_pin') {
    const pins = getMapPins()
    const pin = pins.find(item => item.id === data.target_id)
    if (pin) {
      pin.report_count = targetReportsCount
      if (targetReportsCount >= 5) {
        pin.status = 'hidden'
      }
      setStorage('map_pins', pins)
    }
  }

  return { success: true }
}

export function handleAdminReportAction(reportId: string, action: 'delete' | 'reject'): { success: boolean } {
  const reports = getReports()
  const rep = reports.find(r => r.id === reportId)
  if (!rep) return { success: false }

  if (action === 'delete') {
    rep.status = 'deleted'
    if (rep.target_type === 'post') {
      deletePost(rep.target_id)
    } else if (rep.target_type === 'map_pin') {
      deleteMapPin(rep.target_id)
    }
  } else {
    rep.status = 'rejected'
    if (rep.target_type === 'post') {
      const posts = getPosts()
      const p = posts.find(item => item.id === rep.target_id)
      if (p && p.status === 'hidden') {
        p.status = '募集中'
        setStorage('posts', posts)
      }
    } else if (rep.target_type === 'map_pin') {
      const pins = getMapPins()
      const pin = pins.find(item => item.id === rep.target_id)
      if (pin && pin.status === 'hidden') {
        pin.status = 'published'
        setStorage('map_pins', pins)
      }
    }
  }

  setStorage('reports', reports)
  return { success: true }
}

// チャットセッション
export function getChatSessions(): ChatSession[] {
  let chats = getStorage<ChatSession[]>('chats', INITIAL_CHATS)

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()
  let hasChanges = false

  chats = chats.map(c => {
    if (c.status === 'supporting') {
      const vTime = c.victim_completed_at ? new Date(c.victim_completed_at).getTime() : 0
      const sTime = c.supporter_completed_at ? new Date(c.supporter_completed_at).getTime() : 0

      if (vTime > 0 && sTime > 0) {
        hasChanges = true
        return { ...c, status: 'completed', completed_at: new Date().toISOString() }
      }

      if ((vTime > 0 && now - vTime >= SEVEN_DAYS_MS) || (sTime > 0 && now - sTime >= SEVEN_DAYS_MS)) {
        hasChanges = true
        return { ...c, status: 'completed', completed_at: new Date().toISOString() }
      }
    }
    return c
  })

  if (hasChanges) {
    setStorage('chats', chats)
  }

  return chats
}

export function getChatSessionById(id: string): ChatSession | undefined {
  const chats = getChatSessions()
  return chats.find(c => c.id === id)
}

export function applyAndCreateMatch(postId: string): { success: boolean; chat?: ChatSession; error?: string } {
  const user = getUserProfile()

  if (user.account_status === 'frozen') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため、支援・依頼の申し出はできません。' }
  }

  const posts = getPosts()
  const post = posts.find(p => p.id === postId)

  if (!post) {
    return { success: false, error: '該当の投稿が見つかりませんでした' }
  }

  if (post.status !== '募集中' && post.status !== 'published') {
    return { success: false, error: 'この投稿は現在マッチングを受け付けていません' }
  }

  const level = getCityDisasterLevel(post.received_prefecture, post.received_city)
  if (level >= 3) {
    return {
      success: false,
      error: 'この機能はレベル2以下の時のみ利用できます。安全な状態になるまでお待ち下さい。',
    }
  }

  let victimId = user.id
  let victimName = user.name
  let victimVerified = !!user.is_verified
  let supporterId = post.user_id
  let supporterName = post.user_name
  let supporterVerified = !!post.is_verified_user

  if (post.type === 'request') {
    victimId = post.user_id
    victimName = post.user_name
    victimVerified = !!post.is_verified_user
    supporterId = user.id
    supporterName = user.name
    supporterVerified = !!user.is_verified
  }

  post.status = 'マッチ済み'
  setStorage('posts', posts)

  const newChat: ChatSession = {
    id: 'chat_' + Date.now(),
    match_id: 'match_' + Date.now(),
    post_id: post.id,
    post_title: post.title,
    victim_id: victimId,
    victim_name: victimName,
    victim_is_verified: victimVerified,
    supporter_id: supporterId,
    supporter_name: supporterName,
    supporter_is_verified: supporterVerified,
    status: 'before_support',
    created_at: new Date().toISOString(),
    messages: [
      {
        id: 'msg_' + Date.now(),
        chat_id: 'chat_' + Date.now(),
        sender_id: user.id,
        sender_name: user.name,
        sender_is_verified: !!user.is_verified,
        body: `マッチングが成立しました！「${post.title}」について連絡を開始します。`,
        created_at: new Date().toISOString(),
      },
    ],
  }

  const chats = getChatSessions()
  const updatedChats = [newChat, ...chats]
  setStorage('chats', updatedChats)

  return { success: true, chat: newChat }
}

export function startSupport(chatId: string): { success: boolean; chat?: ChatSession; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'アカウント凍結中のため操作できません。' }
  }

  const chats = getChatSessions()
  const chat = chats.find(c => c.id === chatId)
  if (!chat) return { success: false, error: 'チャットが見つかりません' }

  const posts = getPosts()
  const post = posts.find(p => p.id === chat.post_id)
  if (post) {
    const level = getCityDisasterLevel(post.received_prefecture, post.received_city)
    if (level >= 3) {
      return {
        success: false,
        error: 'この機能はレベル2以下の時のみ利用できます。安全な状態になるまでお待ち下さい。',
      }
    }
  }

  if (chat.status !== 'before_support') {
    return { success: false, error: '既に支援が開始されています' }
  }

  chat.status = 'supporting'
  chat.support_started_at = new Date().toISOString()
  chat.messages.push({
    id: 'msg_' + Date.now(),
    chat_id: chat.id,
    sender_id: chat.supporter_id,
    sender_name: chat.supporter_name || '支援者',
    sender_is_verified: chat.supporter_is_verified,
    body: '【支援開始】支援者が出発・移動を開始しました。',
    created_at: new Date().toISOString(),
  })

  setStorage('chats', chats)
  return { success: true, chat }
}

export function confirmSupportCompletion(chatId: string, role: UserRole): { success: boolean; chat?: ChatSession; error?: string } {
  const chats = getChatSessions()
  const chat = chats.find(c => c.id === chatId)
  if (!chat) return { success: false, error: 'チャットが見つかりません' }

  if (chat.status === 'completed') {
    return { success: true, chat }
  }

  const now = new Date().toISOString()
  if (role === 'victim') {
    chat.victim_completed_at = now
  } else {
    chat.supporter_completed_at = now
  }

  if (chat.victim_completed_at && chat.supporter_completed_at) {
    chat.status = 'completed'
    chat.completed_at = now

    const posts = getPosts()
    const post = posts.find(p => p.id === chat.post_id)
    if (post) {
      post.status = '完了'
      setStorage('posts', posts)
    }

    chat.messages.push({
      id: 'msg_' + Date.now(),
      chat_id: chat.id,
      sender_id: 'system',
      sender_name: 'システム',
      body: '【取引完了】お互いの支援完了が確認されました。取引を終了します。',
      created_at: now,
    })
  } else {
    chat.messages.push({
      id: 'msg_' + Date.now(),
      chat_id: chat.id,
      sender_id: role === 'victim' ? chat.victim_id : chat.supporter_id,
      sender_name: role === 'victim' ? (chat.victim_name || '被災者') : (chat.supporter_name || '支援者'),
      sender_is_verified: role === 'victim' ? chat.victim_is_verified : chat.supporter_is_verified,
      body: `【完了確認】支援完了を確認しました。相手の確認を待っています。`,
      created_at: now,
    })
  }

  setStorage('chats', chats)
  return { success: true, chat }
}

export function sendChatMessage(chatId: string, senderId: string, senderName: string, body: string): { success: boolean; chat?: ChatSession; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'アカウント凍結中のためチャット送信はご利用いただけません。' }
  }

  const chats = getChatSessions()
  const chat = chats.find(c => c.id === chatId)
  if (!chat) return { success: false, error: 'チャットが見つかりません' }

  if (chat.status === 'completed') {
    return { success: false, error: '取引が完了しているため送信できません' }
  }

  const newMessage: ChatMessage = {
    id: 'msg_' + Date.now(),
    chat_id: chatId,
    sender_id: senderId,
    sender_name: senderName,
    sender_is_verified: !!user.is_verified,
    body: body.trim(),
    created_at: new Date().toISOString(),
  }

  chat.messages.push(newMessage)
  setStorage('chats', chats)

  return { success: true, chat }
}
