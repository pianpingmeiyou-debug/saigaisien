'use client'

import { useRouter } from 'next/navigation'
import { Map as MapIcon, MessageSquare, Plus, Search, UserRound } from 'lucide-react'

export type AppTab = '検索' | '投稿' | '地図' | 'チャット' | 'マイページ'

export default function BottomNav({
  active,
  locked = false,
}: {
  active: AppTab
  locked?: boolean
}) {
  const router = useRouter()

  const go = (tab: AppTab) => {
    if (locked) return
    if (tab === 'チャット') {
      router.push('/chat')
      return
    }
    if (tab === 'マイページ') {
      router.push('/account')
      return
    }
    router.push(`/?tab=${encodeURIComponent(tab)}`)
  }

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2px',
          width: '100%',
          padding: '8px 6px',
          boxSizing: 'border-box',
          overflowX: 'auto',
        }}
      >
        {(['検索', '投稿', '地図', 'チャット', 'マイページ'] as AppTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => go(t)}
            disabled={locked}
            style={{
              padding: '10px 8px',
              minHeight: '44px',
              minWidth: '56px',
              borderRadius: '8px',
              border: 'none',
              background: active === t ? '#e0f2fe' : 'transparent',
              color: active === t ? '#0284c7' : '#475569',
              fontWeight: active === t ? 700 : 500,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              cursor: locked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flexShrink: 0,
              opacity: locked ? 0.45 : 1,
            }}
          >
            {t === '検索' && <Search size={15} />}
            {t === '投稿' && <Plus size={15} />}
            {t === '地図' && <MapIcon size={15} />}
            {t === 'チャット' && <MessageSquare size={15} />}
            {t === 'マイページ' && <UserRound size={15} />}
            <span>{t}</span>
          </button>
        ))}
      </nav>
    </footer>
  )
}
