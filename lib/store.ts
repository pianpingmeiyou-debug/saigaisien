import { parseLocation, calculateDistanceKm, findCity } from './cities'
import {
  UserProfile,
  PostItem,
  DisasterLevelItem,
  MatchItem,
  ChatSession,
  ChatMessage,
  UserRole,
  PostCategory,
  UrgencyLevel,
  PostType,
} from './types'

const STORAGE_KEY_PREFIX = 'asunowa_'

// 初期レベル設定（例: 米子市 Lv1, 鳥取市 Lv2, 境港市 Lv3）
const INITIAL_DISASTER_LEVELS: DisasterLevelItem[] = [
  { prefecture: '鳥取県', city: '米子市', level: 1, updated_at: new Date().toISOString() },
  { prefecture: '鳥取県', city: '鳥取市', level: 2, updated_at: new Date().toISOString() },
  { prefecture: '鳥取県', city: '境港市', level: 3, updated_at: new Date().toISOString() },
  { prefecture: '東京都', city: '港区', level: 3, updated_at: new Date().toISOString() },
  { prefecture: '東京都', city: '渋谷区', level: 2, updated_at: new Date().toISOString() },
]

// 初期ユーザー
const INITIAL_USER: UserProfile = {
  id: 'user_current',
  name: '田中 太郎',
  role: 'victim', // 'victim' or 'supporter'
  disaster_prefecture: '鳥取県',
  disaster_city: '米子市',
}

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
  },
]

// 初期チャット
const INITIAL_CHATS: ChatSession[] = [
  {
    id: 'chat_demo_1',
    match_id: 'match_demo_1',
    post_id: 'post_demo_1',
    post_title: '保存食・カンパン 10箱のお渡し',
    victim_id: 'user_current',
    supporter_id: 'user_supporter_99',
    status: 'supporting',
    support_started_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    messages: [
      {
        id: 'msg_1',
        chat_id: 'chat_demo_1',
        sender_id: 'user_supporter_99',
        sender_name: '支援者 (山田)',
        body: 'はじめまして。保存食10箱をお持ちします。避難所入口で15時頃いかがでしょうか？',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'msg_2',
        chat_id: 'chat_demo_1',
        sender_id: 'user_current',
        sender_name: 'あなた (被災者)',
        body: '大変助かります！15時に避難所入口でお待ちしております。',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: 'msg_3',
        chat_id: 'chat_demo_1',
        sender_id: 'user_supporter_99',
        sender_name: '支援者 (山田)',
        body: 'ただいま車で移動開始いたしました。「支援を開始する」を押しました。',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
  },
]

// Helper for LocalStorage safely in Next.js
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

// Data API Services

export function getUserProfile(): UserProfile {
  return getStorage<UserProfile>('user', INITIAL_USER)
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile()
  const updated = { ...current, ...profile }
  setStorage('user', updated)
  return updated
}

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

/**
 * 市区町村の災害レベルを取得する（未設定地域は必ず Lv0）
 */
export function getCityDisasterLevel(pref: string, city: string): number {
  const levels = getDisasterLevels()
  const found = levels.find(l => l.prefecture === pref && l.city === city)
  return found ? found.level : 0
}

/**
 * フル住所から災害レベルを取得
 */
export function getLocationDisasterLevel(locationStr: string): number {
  const parsed = parseLocation(locationStr)
  return getCityDisasterLevel(parsed.prefecture, parsed.city)
}

export function getPosts(): PostItem[] {
  return getStorage<PostItem[]>('posts', INITIAL_POSTS)
}

/**
 * ソート優先順位:
 * ① 地域の近さ（ユーザーの災害発生地域中心座標と投稿の受け取り場所中心座標の距離 km）
 * ② 緊急度（高 > 中 > 低）
 * ③ 投稿日時（新しい順）
 */
export function getSortedFilteredPosts(userPref: string, userCity: string, userRole: UserRole): PostItem[] {
  const posts = getPosts()
  const userCityInfo = findCity(userPref, userCity) ?? { lat: 35.4281, lng: 133.3308 }

  // 被災者には【提供(offer)】のみ、支援者には【依頼(request)】のみを表示
  const targetType = userRole === 'victim' ? 'offer' : 'request'
  const filtered = posts.filter(p => p.type === targetType && p.status === '募集中')

  const urgencyScore = { 高: 3, 中: 2, 低: 1 }

  return [...filtered].sort((a, b) => {
    const locA = parseLocation(a.received_location)
    const locB = parseLocation(b.received_location)

    const distA = calculateDistanceKm(userCityInfo.lat, userCityInfo.lng, locA.lat, locA.lng)
    const distB = calculateDistanceKm(userCityInfo.lat, userCityInfo.lng, locB.lat, locB.lng)

    // ① 地域の近さ (昇順)
    if (distA !== distB) {
      return distA - distB
    }

    // ② 緊急度 (降順)
    const scoreA = urgencyScore[a.urgency] ?? 0
    const scoreB = urgencyScore[b.urgency] ?? 0
    if (scoreA !== scoreB) {
      return scoreB - scoreA
    }

    // ③ 投稿日時 (降順)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function addPost(newPostData: {
  title: string
  category: PostCategory
  description: string
  received_location: string
  urgency: UrgencyLevel
  tags?: string[]
}): { success: boolean; post?: PostItem; error?: string } {
  const user = getUserProfile()
  const parsed = parseLocation(newPostData.received_location)
  const currentLevel = getCityDisasterLevel(parsed.prefecture, parsed.city)

  // 11.3 受け取り場所がLv3の場合は投稿不可
  if (currentLevel >= 3) {
    return {
      success: false,
      error: 'この機能はレベル2以下の時のみ使用できます。安全な状態になるまでお待ち下さい。',
    }
  }

  const postType: PostType = user.role === 'victim' ? 'request' : 'offer'

  const created: PostItem = {
    id: 'post_' + Date.now(),
    user_id: user.id,
    user_name: user.name,
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
  }

  const posts = getPosts()
  const updated = [created, ...posts]
  setStorage('posts', updated)

  return { success: true, post: created }
}

export function getChatSessions(): ChatSession[] {
  let chats = getStorage<ChatSession[]>('chats', INITIAL_CHATS)

  // 15.3項・20.2項: 片方だけ確認して7日間経過した場合の自動完了チェック
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()
  let hasChanges = false

  chats = chats.map(c => {
    if (c.status === 'supporting') {
      const vTime = c.victim_completed_at ? new Date(c.victim_completed_at).getTime() : 0
      const sTime = c.supporter_completed_at ? new Date(c.supporter_completed_at).getTime() : 0

      // 両者確認で完了
      if (vTime > 0 && sTime > 0) {
        hasChanges = true
        return { ...c, status: 'completed', completed_at: new Date().toISOString() }
      }

      // 片方のみ確認で7日経過時に自動完了
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

/**
 * 応募 -> マッチ成立 (1依頼につき支援者1人) -> チャット生成
 */
export function applyAndCreateMatch(postId: string): { success: boolean; chat?: ChatSession; error?: string } {
  const user = getUserProfile()
  const posts = getPosts()
  const post = posts.find(p => p.id === postId)

  if (!post) {
    return { success: false, error: '該当の投稿が見つかりませんでした' }
  }

  if (post.status !== '募集中') {
    return { success: false, error: 'この投稿は既にマッチングが成立しているか完了しています' }
  }

  // 受け取り場所の災害レベルチェック
  const level = getCityDisasterLevel(post.received_prefecture, post.received_city)
  if (level >= 3) {
    return {
      success: false,
      error: 'この機能はレベル2以下の時のみ利用できます。安全な状態になるまでお待ち下さい。',
    }
  }

  // 被災者投稿の場合は応募者が支援者、支援者投稿の場合は応募者が被災者
  let victimId = user.id
  let supporterId = user.id

  if (post.type === 'request') {
    victimId = post.user_id
    supporterId = user.id
  } else {
    victimId = user.id
    supporterId = post.user_id
  }

  // 投稿ステータス更新
  post.status = 'マッチ済み'
  setStorage('posts', posts)

  // 新規チャットセッション作成
  const newChat: ChatSession = {
    id: 'chat_' + Date.now(),
    match_id: 'match_' + Date.now(),
    post_id: post.id,
    post_title: post.title,
    victim_id: victimId,
    supporter_id: supporterId,
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

/**
 * 支援を開始する (配達・移動開始)
 */
export function startSupport(chatId: string): { success: boolean; chat?: ChatSession; error?: string } {
  const chats = getChatSessions()
  const chat = chats.find(c => c.id === chatId)
  if (!chat) return { success: false, error: 'チャットが見つかりません' }

  // 対象投稿の受け取り場所の最新災害レベルを確認
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
    sender_name: '支援者',
    body: '【支援開始】支援者が出達・移動を開始しました。',
    created_at: new Date().toISOString(),
  })

  setStorage('chats', chats)
  return { success: true, chat }
}

/**
 * 支援完了確認を押す (被災者 or 支援者)
 */
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

  // 両者確認で完了
  if (chat.victim_completed_at && chat.supporter_completed_at) {
    chat.status = 'completed'
    chat.completed_at = now

    // 投稿も完了にする
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
      sender_name: role === 'victim' ? '被災者' : '支援者',
      body: `【完了確認】${role === 'victim' ? '被災者' : '支援者'}が支援完了を確認しました。相手の確認を待っています。`,
      created_at: now,
    })
  }

  setStorage('chats', chats)
  return { success: true, chat }
}

export function sendChatMessage(chatId: string, senderId: string, senderName: string, body: string): { success: boolean; chat?: ChatSession; error?: string } {
  const chats = getChatSessions()
  const chat = chats.find(c => c.id === chatId)
  if (!chat) return { success: false, error: 'チャットが見つかりません' }

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
