'use client'

import React, { useState } from 'react'
import { Flag, X, Check, AlertTriangle } from 'lucide-react'
import { REPORT_REASONS, ReportReason, ReportTargetType } from '@/lib/types'
import { createReport } from '@/lib/store'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: string
  targetTitle?: string
  targetAuthorName?: string
  onReportSuccess?: () => void
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetAuthorName,
  onReportSuccess,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('不適切な内容')
  const [detail, setDetail] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isOpen) return null

  const targetTypeName =
    targetType === 'post' ? '投稿' : targetType === 'map_pin' ? '地図ピン' : 'チャットユーザー'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const res = createReport({
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      target_author_name: targetAuthorName,
      reason,
      detail: reason === 'その他' ? detail : undefined,
    })

    if (!res.success) {
      setErrorMessage(res.error || '通報を送信できませんでした')
      return
    }

    setSuccessMessage('通報を受け付けました。ご協力ありがとうございます。')
    setTimeout(() => {
      setSuccessMessage('')
      setIsConfirming(false)
      onClose()
      if (onReportSuccess) onReportSuccess()
    }, 1800)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '460px',
          width: '92%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <button className="modal-close" onClick={onClose} aria-label="閉じる">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Flag size={20} color="#e11d48" />
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700, color: '#1e293b' }}>
            {targetTypeName}を通報する
          </h2>
        </div>

        {targetTitle && (
          <div
            style={{
              padding: '10px 12px',
              background: '#f1f5f9',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#334155',
              marginBottom: '16px',
            }}
          >
            <b>対象：</b> {targetTitle}
            {targetAuthorName && <span style={{ marginLeft: '8px', color: '#64748b' }}>（投稿者: {targetAuthorName}）</span>}
          </div>
        )}

        {successMessage ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: '#dcfce7',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px',
                color: '#16a34a',
              }}
            >
              <Check size={24} />
            </div>
            <p style={{ fontWeight: 600, color: '#166534', margin: 0 }}>{successMessage}</p>
          </div>
        ) : !isConfirming ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setIsConfirming(true)
            }}
          >
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
              明日の環のコミュニティガイドラインに違反していると思われる理由を選択してください。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: reason === r ? '2px solid #e11d48' : '1px solid #e2e8f0',
                    background: reason === r ? '#fff1f2' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: reason === r ? 600 : 400,
                    color: reason === r ? '#be123c' : '#334155',
                  }}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>

            {reason === 'その他' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  詳細な理由（任意）
                </label>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="具体的な内容を入力してください"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
              </div>
            )}

            {errorMessage && (
              <p style={{ color: '#e11d48', fontSize: '12px', marginBottom: '12px' }}>{errorMessage}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                style={{
                  background: '#e11d48',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                確認へ進む
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
                <AlertTriangle size={16} />
                以下の内容で通報を送信します
              </div>
              <p style={{ fontSize: '13px', margin: '4px 0', color: '#4c0519' }}>
                <b>通報理由：</b> {reason}
              </p>
              {detail && (
                <p style={{ fontSize: '12px', margin: '4px 0', color: '#881337' }}>
                  <b>詳細：</b> {detail}
                </p>
              )}
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              ※送信された通報は管理者により確認され、規約違反が認められた場合は適切な措置（削除・凍結等）が取られます。
            </p>

            {errorMessage && (
              <p style={{ color: '#e11d48', fontSize: '12px', margin: 0 }}>{errorMessage}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsConfirming(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  background: '#e11d48',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                通報する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
