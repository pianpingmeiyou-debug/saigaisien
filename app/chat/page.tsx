'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, MessageCircle, Send, Check, ShieldCheck,
  AlertTriangle, LockKeyhole, Clock3, ChevronRight, ChevronLeft, UserRound, Package, MapPin, Flag, Search, Plus
} from 'lucide-react'
import {
  getUserProfile, getChatSessions, getChatSessionById, startSupport,
  confirmSupportCompletion, sendChatMessage, getLocationDisasterLevel, getPosts
} from '@/lib/store'
import { ChatSession, UserRole } from '@/lib/types'
import ReportModal from '@/components/report-modal'

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
  const [reportTargetUser, setReportTargetUser] = useState<{ id: string; name: string } | null>(null)

  const [isMobileListOpen, setIsMobileListOpen] = useState(false)

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

    if (user.account_status === 'frozen') {
      setErrorModalMsg('ご利用のアカウントは凍結されているため、チャット機能はご利用いただけません。')
      return
    }

    const res = sendChatMessage(
      activeSession.id,
      user.id,
      user.name || 'ユーザー',
      inputMessage
    )

    if (res.success) {
      setInputMessage('')
      refreshSession(activeSession.id)
    } else if (res.error) {
      setErrorModalMsg(res.error)
    }
  }

  const activePost = activeSession ? getPosts().find(p => p.id === activeSession.post_id) : null
  const postDisasterLevel = activePost ? getLocationDisasterLevel(activePost.received_location) : 0

  const isUserSupporter = activeSession ? activeSession.supporter_id === user.id : false
  const isUserVictim = activeSession ? activeSession.victim_id === user.id : false

  const partnerId = activeSession
    ? activeSession.victim_id === user.id
      ? activeSession.supporter_id
      : activeSession.victim_id
    : ''
  const partnerName = activeSession
    ? activeSession.victim_id === user.id
      ? activeSession.supporter_name || '支援者'
      : activeSession.victim_name || '被災者'
    : ''
  const partnerIsVerified = activeSession
    ? activeSession.victim_id === user.id
      ? activeSession.supporter_is_verified
      : activeSession.victim_is_verified
    : false

  return (
    <main className="standalone-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="standalone-header">
        <Link href="/" className="icon-button" aria-label="アプリトップへ戻る">
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

      {user.account_status === 'frozen' && (
        <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '12px 20px', fontSize: '13px', textAlign: 'center' }}>
          <b>アカウント凍結中：</b> メッセージの閲覧は可能ですが、新規メッセージの送信はできません。
        </div>
      )}

      <section className="standalone-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        
        <div className="mobile-chat-toggle md:hidden" style={{ marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setIsMobileListOpen(!isMobileListOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              color: '#0284c7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={18} />
              <span>{isMobileListOpen ? '＜ チャットに戻る' : `＞ メッセージ一覧を開く (${sessions.length})`}</span>
            </div>
            {isMobileListOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <div className="chat-container-layout">
          
          {/* 左カラム */}
          <div
            className={`chat-sidebar-panel ${isMobileListOpen ? 'mobile-visible' : 'mobile-hidden'}`}
            style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}
          >
            <h2 style={{ fontSize: '16px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={18} color="#0284c7" />
              メッセージ一覧 ({sessions.length})
            </h2>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                <Package size={32} style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '14px', margin: 0 }}>チャット履歴はまだありません</p>
                <small>支援・依頼のマッチングが成立するとここに表示されます</small>
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
                      onClick={() => {
                        setActiveSession(s)
                        setIsMobileListOpen(false)
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '12px',
                        borderRadius: '8px',
                        border: isActive ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isActive ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: '100%',
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

          {/* 右カラム */}
          <div
            className={`chat-main-panel ${!isMobileListOpen ? 'mobile-visible' : 'mobile-hidden'}`}
            style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '520px' }}
          >
            {activeSession ? (
              <>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h2 style={{ fontSize: '17px', margin: 0, fontWeight: 700, color: '#0f172a' }}>
                        {activeSession.post_title}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {/* 6. 相手ユーザー名横に認証マーク表示 */}
                        <span style={{ fontSize: '12px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          お相手：<b>{partnerName}</b>
                          {partnerIsVerified && (
                            <img src="/ninsyou.png" alt="認証マーク" style={{ height: '16px', width: 'auto' }} title="本人確認済み認証マーク" />
                          )}
                        </span>
                        {activePost && (
                          <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} /> 受け取り場所: {activePost.received_location}
                            {postDisasterLevel >= 3 && (
                              <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: '4px' }}>(災害Lv.3停止中)</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="text-button"
                        style={{ color: '#e11d48', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        onClick={() => setReportTargetUser({ id: partnerId, name: partnerName })}
                      >
                        <Flag size={14} /> 相手を通報
                      </button>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontWeight: 700,
                          fontSize: '12px',
                          background: activeSession.status === 'completed' ? '#94a3b8' : activeSession.status === 'supporting' ? '#22c55e' : '#f59e0b',
                          color: '#ffffff',
                        }}
                      >
                        {activeSession.status === 'completed' ? '【取引完了】' : activeSession.status === 'supporting' ? '【支援中】' : '【支援前】'}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginTop: '10px' }}>
                    {activeSession.status === 'before_support' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          状態：マッチング成立（支援者の移動・配達開始待ち）
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>
                            【支援中】
                          </span>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                            物資の受け渡しが完了したら、双方が「支援完了確認」を押すことで取引が完了します。
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(isUserVictim && activeSession.victim_completed_at) || (isUserSupporter && activeSession.supporter_completed_at) ? (
                            <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={16} /> 完了確認済み（相手の確認待ち）
                            </span>
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
                              <ShieldCheck size={15} /> 支援完了を確認する
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {activeSession.status === 'completed' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '13px', fontWeight: 600 }}>
                        <ShieldCheck size={18} />
                        この取引は正常に完了しました。ありがとうございました。
                      </div>
                    )}
                  </div>
                </div>

                {/* メッセージリスト (認証マーク表示) */}
                <div
                  style={{
                    flex: 1,
                    padding: '20px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: '#f8fafc',
                    maxHeight: '420px',
                  }}
                >
                  {activeSession.messages.map(m => {
                    const isMe = m.sender_id === user.id

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {/* 6. 名前横に認証マーク */}
                        <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {isMe ? `${user.name} (自分)` : m.sender_name}
                          {(isMe ? user.is_verified : m.sender_is_verified) && (
                            <img src="/ninsyou.png" alt="認証" style={{ height: '14px', width: 'auto' }} />
                          )}
                        </span>
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
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

                {/* メッセージ入力フォーム */}
                <form
                  onSubmit={handleSendMessage}
                  style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder={activeSession.status === 'completed' ? 'この取引は完了しています' : 'メッセージを入力...'}
                    disabled={activeSession.status === 'completed' || user.account_status === 'frozen'}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={activeSession.status === 'completed' || user.account_status === 'frozen'}
                    style={{ borderRadius: '20px', padding: '10px 18px' }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', padding: '60px', color: '#94a3b8' }}>
                選択されたチャットはありません
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 通報モーダル */}
      {reportTargetUser && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTargetUser(null)}
          targetType="chat_user"
          targetId={reportTargetUser.id}
          targetAuthorName={reportTargetUser.name}
          onReportSuccess={() => {
            setNotice('ユーザー通報を受け付けました')
          }}
        />
      )}
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>チャットを読み込み中...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
