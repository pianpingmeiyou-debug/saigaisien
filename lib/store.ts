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
}


const STORAGE_KEY_PREFIX = 'asunowa_'

// 全国市区町村の初期災害レベル (初期値 Lv0)
const INITIAL_DISASTER_LEVELS: DisasterLevelItem[] = CITIES_DATA.map(c => ({
  prefecture: c.prefecture,
  city: c.city,
  level: 0,
  updated_at: new Date().toISOString(),
}))

// デモ用の初期ユーザー
const INITIAL_USER: UserProfile = {
  id: 'user_demo_1',
  name: 'あすのわ太郎',
  role: 'user',
  user_role: 'victim', // victim, supporter, both
  disaster_prefecture: '鳥取県',
  disaster_city: '米子市',
  account_status: 'active',
  is_demo: true,
  linked_google: true,
  linked_line: false,
}

// 登録ユーザー一覧（管理者用）
const INITIAL_ALL_USERS: UserProfile[] = [
  INITIAL_USER,
  {
    id: 'user_supporter_1',
    name: '佐藤 健',
    role: 'user',
    user_role: 'supporter',
    disaster_prefecture: '鳥取県',
    disaster_city: '米子市',
    account_status: 'active',
    is_demo: false,
    email: 'sato@example.com',
    linked_google: true,
    linked_line: true,
  },
  {
    id: 'user_victim_1',
    name: '鈴木 花子',
    role: 'user',
    user_role: 'victim',
    disaster_prefecture: '鳥取県',
    disaster_city: '鳥取市',
    account_status: 'active',
    is_demo: false,
    email: 'suzuki@example.com',
    linked_google: true,
    linked_line: false,
  },
  {
    id: 'user_admin_master',
    name: '管理者 (明日の環運営)',
    role: 'admin',
    user_role: 'both',
    disaster_prefecture: '東京都',
    disaster_city: '千代田区',
    account_status: 'active',
    is_demo: false,
    email: 'admin@asunowa.jp',
    linked_google: true,
    linked_line: false,
  },
]

// 初期投稿データ
const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post_1',
    user_id: 'user_supporter_1',
    user_name: '佐藤 健',
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
    supporter_id: 'user_supporter_1',
    supporter_name: '佐藤 健',
    status: 'supporting',
    support_started_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    messages: [
      {
        id: 'msg_1',
        chat_id: 'chat_demo_1',
        sender_id: 'user_supporter_1',
        sender_name: '佐藤 健',
        body: 'はじめまして。保存食10箱をお持ちします。避難所入口で15時頃いかがでしょうか？',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'msg_2',
        chat_id: 'chat_demo_1',
        sender_id: 'user_demo_1',
        sender_name: 'あすのわ太郎',
        body: '大変助かります！15時に避難所入口でお待ちしております。',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: 'msg_3',
        chat_id: 'chat_demo_1',
        sender_id: 'user_supporter_1',
        sender_name: '佐藤 健',
        body: 'ただいま車で移動開始いたしました。「支援を開始する」を押しました。',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
  },
]

// 初期地図ピン
const INITIAL_MAP_PINS: MapPinItem[] = [
  {
    id: 'pin_1',
    type: '避難所',
    title: '輪島市立体育館',
    author: '自治体確認済み',
    content: '確認済み避難所。現在受け入れ可能です。',
    lat: 37.39,
    lng: 136.9,
    verified: true,
    report_count: 0,
    status: 'published',
  },
  {
    id: 'pin_2',
    type: '指定物資置き場',
    title: '輪島市 支援物資置き場',
    author: '輪島市',
    content: '支援物資の受け取り場所です。',
    lat: 37.395,
    lng: 136.91,
    verified: true,
    report_count: 0,
    status: 'published',
  },
  {
    id: 'pin_3',
    type: '通行注意',
    title: '県道249号',
    author: '佐藤 花子',
    content: '片側通行。大型車は注意してください。',
    lat: 37.375,
    lng: 136.93,
    report_count: 0,
    status: 'published',
  },
  {
    id: 'pin_4',
    type: '浸水',
    title: '米子市役所周辺',
    author: '山田 健',
    content: '道路冠水に注意してください。',
    lat: 35.4281,
    lng: 133.3308,
    report_count: 0,
    status: 'published',
  },
  {
    id: 'pin_5',
    type: '避難所',
    title: '米子市総合体育館',
    author: '米子市防災',
    content: '物資受け入れ・避難スペース開設中',
    lat: 35.435,
    lng: 133.34,
    verified: true,
    report_count: 0,
    status: 'published',
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

// ユーザー情報
export function getUserProfile(): UserProfile {
  return getStorage<UserProfile>('user', INITIAL_USER)
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile()
  const updated = { ...current, ...profile, updated_at: new Date().toISOString() }
  setStorage('user', updated)

  // 管理者用全ユーザーリストも同期
  const allUsers = getAllUsers()
  const idx = allUsers.findIndex(u => u.id === updated.id)
  if (idx >= 0) {
    allUsers[idx] = updated
  } else {
    allUsers.push(updated)
  }
  setStorage('all_users', allUsers)

  return updated
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

  // 自分の投稿か、または管理者のみ編集可能
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

  // 完全削除またはステータス変更
  posts.splice(idx, 1)
  setStorage('posts', posts)
  return { success: true }
}

export function getSortedFilteredPosts(userPref: string, userCity: string, userRole: UserRole): PostItem[] {
  const posts = getPosts()
  const userCityInfo = findCity(userPref, userCity) ?? { lat: 35.4281, lng: 133.3308 }

  // 共助 (both) の場合は依頼と提供の双方を閲覧・表示、victimは提供のみ、supporterは依頼のみ
  const filtered = posts.filter(p => {
    if (p.status === 'hidden' || p.status === 'deleted') return false
    if (userRole === 'victim') return p.type === 'offer'
    if (userRole === 'supporter') return p.type === 'request'
    return true // 'both'
  })

  const urgencyScore = { 高: 3, 中: 2, 低: 1 }

  return [...filtered].sort((a, b) => {
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
  title: string
  category: PostCategory
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

  // 投稿タイプ：共助は選択したtype、被災者はrequest、支援者はoffer
  let postType: PostType = newPostData.type || (user.user_role === 'victim' ? 'request' : 'offer')
  if (user.user_role === 'victim') postType = 'request'
  if (user.user_role === 'supporter') postType = 'offer'

  const created: PostItem = {
    id: 'post_' + Date.now(),
    user_id: user.id,
    user_name: user.name || '明日の環ユーザー',
    type: postType,
    category: newPostData.category,
    title: newPostData.title,
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

export function addMapPin(pinData: {
  type: MapPinItem['type']
  title: string
  content: string
  lat: number
  lng: number
  photo?: string
}): { success: boolean; pin?: MapPinItem; error?: string } {
  const user = getUserProfile()
  if (user.account_status === 'frozen') {
    return { success: false, error: 'ご利用のアカウントは凍結されているため、ピンの設置はできません。' }
  }

  const newPin: MapPinItem = {
    id: 'pin_' + Date.now(),
    user_id: user.id,
    author: user.name || '地域ユーザー',
    type: pinData.type,
    title: pinData.title,
    content: pinData.content,
    lat: pinData.lat,
    lng: pinData.lng,
    photo: pinData.photo,
    verified: user.role === 'admin',
    created_at: new Date().toISOString(),
    report_count: 0,
    status: 'published',
  }

  const pins = getMapPins()
  const updated = [newPin, ...pins]
  setStorage('map_pins', updated)
  return { success: true, pin: newPin }
}

export function deleteMapPin(pinId: string): { success: boolean; error?: string } {
  const pins = getMapPins()
  const updated = pins.filter(p => p.id !== pinId)
  setStorage('map_pins', updated)
  return { success: true }
}

// 通報システム (仕様書: 重複防止、選択肢、5件以上で一時非表示)
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

  // 同一ユーザーによる同一対象への重複通報チェック
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

  // 対象の通報カウントをインクリメントし、5件以上なら自動的に一時非表示 (hidden)
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
    // 対象データを完全削除
    if (rep.target_type === 'post') {
      deletePost(rep.target_id)
    } else if (rep.target_type === 'map_pin') {
      deleteMapPin(rep.target_id)
    }
  } else {
    // 却下：公開状態に戻す
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
  let supporterId = post.user_id
  let supporterName = post.user_name

  if (post.type === 'request') {
    victimId = post.user_id
    victimName = post.user_name
    supporterId = user.id
    supporterName = user.name
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
    supporter_id: supporterId,
    supporter_name: supporterName,
    status: 'before_support',
    created_at: new Date().toISOString(),
    messages: [
      {
        id: 'msg_' + Date.now(),
        chat_id: 'chat_' + Date.now(),
        sender_id: user.id,
        sender_name: user.name,
        body: `マッチングが成立しました！物資「${post.title}」について連絡を開始します。`,
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
    body: '【支援開始】支援者が出達・移動を開始しました。',
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
    body: body.trim(),
    created_at: new Date().toISOString(),
  }

  chat.messages.push(newMessage)
  setStorage('chats', chats)

  return { success: true, chat }
}
