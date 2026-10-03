'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile, saveUserProfile } from '@/lib/store'
import { PREFECTURES, getCitiesByPrefecture } from '@/lib/cities'
import { UserRole } from '@/lib/types'
import { ArrowLeft, Check } from 'lucide-react'

export default function DeclarationPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('victim')
  const [selectedPref, setSelectedPref] = useState('鳥取県')
  const [selectedCity, setSelectedCity] = useState('米子市')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const profile = getUserProfile()
    setRole(profile.user_role || 'victim')
    setSelectedPref(profile.disaster_prefecture)
    setSelectedCity(profile.disaster_city)
  }, [])

  function submit(event: FormEvent) {
    event.preventDefault()
    saveUserProfile({
      user_role: role,
      disaster_prefecture: selectedPref,
      disaster_city: selectedCity,
    })

    setMessage('登録地域と役割を保存しました。')
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }

  const availableCities = getCitiesByPrefecture(selectedPref)

  return (
    <main className="auth-page">
      <section className="auth-card declaration-card">
        <Link href="/" className="text-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> アプリトップへ戻る
        </Link>
        <p className="eyebrow">明日の環</p>
        <h1>現在の状況・地域設定</h1>
        <p className="auth-lead">
          登録地域と現在の役割（被災者・支援者・共助）を設定してください。
        </p>

        <form className="auth-form" onSubmit={submit}>
          <fieldset>
            <legend style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>あなたの立場（役割）</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                style={{
                  padding: '10px 4px',
                  borderRadius: '8px',
                  border: role === 'victim' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: role === 'victim' ? '#f0f9ff' : '#ffffff',
                  color: role === 'victim' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => setRole('victim')}
              >
                被災者
              </button>
              <button
                type="button"
                style={{
                  padding: '10px 4px',
                  borderRadius: '8px',
                  border: role === 'supporter' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: role === 'supporter' ? '#f0f9ff' : '#ffffff',
                  color: role === 'supporter' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => setRole('supporter')}
              >
                支援者
              </button>
              <button
                type="button"
                style={{
                  padding: '10px 4px',
                  borderRadius: '8px',
                  border: role === 'both' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: role === 'both' ? '#f0f9ff' : '#ffffff',
                  color: role === 'both' ? '#0284c7' : '#334155',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                onClick={() => setRole('both')}
              >
                共助 (双方)
              </button>
            </div>
          </fieldset>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              登録地域（都道府県・市区町村）
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <select
                value={selectedPref}
                onChange={(e) => {
                  const pref = e.target.value
                  setSelectedPref(pref)
                  const cities = getCitiesByPrefecture(pref)
                  if (cities.length > 0) setSelectedCity(cities[0].city)
                }}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              >
                {availableCities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="primary-button full" type="submit" style={{ marginTop: '12px' }}>
            設定を保存する
          </button>
          {message && (
            <p className="form-note" role="status" style={{ textAlign: 'center' }}>
              <Check size={16} /> {message}
            </p>
          )}
        </form>
      </section>
    </main>
  )
}
