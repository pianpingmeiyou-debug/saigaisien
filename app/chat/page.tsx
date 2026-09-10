'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, MessageCircle, HeartHandshake, Send, Check, ShieldCheck,
  AlertTriangle, LockKeyhole, Clock3, ChevronRight, UserRound, Package, MapPin
} from 'lucide-react'
import {
  getUserProfile, getChatSessions, getChatSessionById, startSupport,
  confirmSupportCompletion, sendChatMessage, getLocationDisasterLevel, getPosts
} from '@/lib/store'
import { ChatSession, UserRole } from '@/lib/types'

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeChatIdParam = searchParams.get('id')

  const [user, setUser] = useState(getUserProfile())
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null)

  useEffect(() => {
    const currentSessions = getChatSessions()
    setSessions(currentSessions)

    if (activeChatIdParam) {
      const found = currentSessions.find(s => s.id === activeChatIdParam)
      if (found) setActiveSession(found)
    } else if (currentSessions.length > 0) {
      setActiveSession(currentSessions[0])
    }
  }, [activeChatIdParam])

  const refreshSession = (chatId: string) => {
    const updatedSessions = getChatSessions()
    setSessions(updatedSessions)
    const updated = updatedSessions.find(s => s.id === chatId)
    if (updated) setActiveSession(updated)
  }

  const handleStartSupport = () => {
    if (!activeSession) return
    const res = startSupport(activeSession.id)
    if (res.success) {
      setNotice('支援を開始しました（配達・移動開始）')
      refreshSession(activeSession.id)
    } else if (res.error) {
      setErrorModalMsg(res.error)
    }
  }

  const handleConfirmCompletion = () => {
    if (!activeSession) return
    const userRole: UserRole = activeSession.victim_id === user.id ? 'victim' : 'supporter'
    const res = confirmSupportCompletion(activeSession.id, userRole)
    if (res.success) {
      setNotice('支援完了確認を行いました')
      refreshSession(activeSession.id)
    } else if (res.error) {
      setErrorModalMsg(res.error)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSession || !inputMessage.trim()) return

    const res = sendChatMessage(
      activeSession.id,
      user.id,
      activeSession.victim_id === user.id ? '被災者' : '支援者',
      inputMessage
    )

    if (res.success) {
      setInputMessage('')
      refreshSession(activeSession.id)
    } else if (res.error) {
      setNotice(res.error)
    }
  }

  // 対象投稿の最新災害レベル
  const activePost = activeSession ? getPosts().find(p => p.id === activeSession.post_id) : null
  const postDisasterLevel = activePost ? getLocationDisasterLevel(activePost.received_location) : 0

  const isUserSupporter = activeSession ? activeSession.supporter_id === user.id : false
  const isUserVictim = activeSession ? activeSession.victim_id === user.id : false

  return (
    <main className="standalone-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      <header className="standalone-header">
        <Link href="/" className="icon-button" aria-label="ホームへ戻る">
          <ArrowLeft size={20} />
        </Link>
        <div className="brand">
          <span className="brand-mark">
            <MessageCircle size={21} />
          </span>
          <span>
            <strong>明日の環 チャット</strong>
            <small>個人間取引・支援チャット</small>
          </span>
        </div>
      </header>

      <section className="standalone-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', minHeight: '600px' }}>
          
          {/* 左カラム: チャット一覧 */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={18} color="#0284c7" />
              メッセージ一覧 ({sessions.length})
            </h2>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                <Package size={32} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '14px', margin: 0 }}>チャット履歴はまだありません</p>
                <small>マッチングが成立するとここに表示されます</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sessions.map(s => {
                  const isActive = activeSession?.id === s.id
                  const isFinished = s.status === 'completed'

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSession(s)}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '8px',
                        border: isActive ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isActive ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isFinished ? '#e2e8f0' : s.status === 'supporting' ? '#dcfce7' : '#fef3c7',
                            color: isFinished ? '#475569' : s.status === 'supporting' ? '#166534' : '#92400e',
                          }}
                        >
                          {isFinished ? '【取引完了】' : s.status === 'supporting' ? '【支援中】' : '【支援前】'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.post_title}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 右カラム: チャットメイン画面 */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeSession ? (
              <>
                {/* ヘッダー情報・ステータスバー */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: '#0f172a' }}>
                        {activeSession.post_title}
                      </h2>
                      {activePost && (
                        <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <MapPin size={14} /> 受け取り場所: {activePost.received_location}
                          {postDisasterLevel >= 3 && (
                            <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: '6px' }}>(災害レベル3 危険地域)</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontWeight: 700,
                          fontSize: '13px',
                          background: activeSession.status === 'completed' ? '#94a3b8' : activeSession.status === 'supporting' ? '#22c55e' : '#f59e0b',
                          color: '#ffffff',
                        }}
                      >
                        {activeSession.status === 'completed' ? '【取引完了】' : activeSession.status === 'supporting' ? '【支援中】' : '【支援前】'}
                      </span>
                    </div>
                  </div>

                  {/* ステータス別の操作エリア */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                    {activeSession.status === 'before_support' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          状態：マッチング成立（支援者の移動開始待ち）
                        </span>
                        {isUserSupporter ? (
                          <button
                            type="button"
                            onClick={handleStartSupport}
                            disabled={postDisasterLevel >= 3}
                            style={{
                              background: postDisasterLevel >= 3 ? '#94a3b8' : '#0284c7',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '13px',
                              cursor: postDisasterLevel >= 3 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {postDisasterLevel >= 3 && <LockKeyhole size={14} />}
                            [支援を開始する（配達・移動開始）]
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                            ※支援者が「支援を開始する」を押すと【支援中】に移行します
                          </span>
                        )}
                      </div>
                    )}

                    {activeSession.status === 'supporting' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>
                            【支援中】
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            物資の受け渡しが完了したら双方で完了確認を行ってください
                          </span>
                        </div>

                        {/* 完了確認ボタン (両者に表示) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isUserVictim && activeSession.victim_completed_at ? (
                            <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>✓ あなたは完了確認済み</span>
                          ) : isUserSupporter && activeSession.supporter_completed_at ? (
                            <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>✓ あなたは完了確認済み</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleConfirmCompletion}
                              style={{
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Check size={16} /> [支援完了確認]
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {activeSession.status === 'completed' && (
                      <div style={{ textAlign: 'center', padding: '6px', fontWeight: 700, color: '#475569' }}>
                        【取引完了】この支援・物資取引は無事に完了しました。チャットは終了しました。
                      </div>
                    )}
                  </div>
                </div>

                {/* メッセージ一覧 */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
                  {activeSession.messages.map(m => {
                    const isMe = m.sender_id === user.id
                    const isSystem = m.sender_id === 'system'

                    if (isSystem) {
                      return (
                        <div key={m.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                          <span style={{ fontSize: '12px', background: '#e2e8f0', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontWeight: 500 }}>
                            {m.body}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                          {m.sender_name}
                        </span>
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: isMe ? '#0284c7' : '#ffffff',
                            color: isMe ? '#ffffff' : '#0f172a',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            border: isMe ? 'none' : '1px solid #cbd5e1',
                            fontSize: '14px',
                            lineHeight: 1.5,
                          }}
                        >
                          {m.body}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 入力フォーム */}
                {activeSession.status !== 'completed' ? (
                  <form onSubmit={handleSendMessage} style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      placeholder="メッセージを入力してください..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Send size={16} /> 送信
                    </button>
                  </form>
                ) : (
                  <div style={{ padding: '12px', background: '#f1f5f9', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    取引が完了したため、新規メッセージは送信できません。
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                左側のリストからチャットを選択してください
              </div>
            )}
          </div>
        </div>
      </section>

      {/* エラー / 利用制限モーダル */}
      {errorModalMsg && (
        <div className="modal-backdrop" onClick={() => setErrorModalMsg(null)}>
          <div className="modal locked-state" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
            <LockKeyhole size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '12px' }}>機能利用制限</h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              {errorModalMsg}
            </p>
            <button
              className="primary-button full"
              onClick={() => setErrorModalMsg(null)}
              style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: 600 }}
            >
              確認しました
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div className="toast">
          <Check size={17} /> {notice}
        </div>
      )}
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>チャット画面を読み込んでいます...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
