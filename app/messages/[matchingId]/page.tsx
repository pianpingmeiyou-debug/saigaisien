'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MessagesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/chat')
  }, [router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      チャット画面へ移動しています...
    </div>
  )
}
