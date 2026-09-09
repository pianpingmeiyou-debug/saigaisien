'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import { FormEvent, Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Camera, MapPin, Send } from 'lucide-react'

const categories = ['避難所', '道路通行不能', '通行注意', '土砂崩れ', '倒壊', '通行止め', '浸水', '求援', '指定物資置き場']
type PinForm = { type: string; title: string; content: string; photo: string }

function NewMapPinPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const coordinates = useMemo(() => ({ lat: params.get('lat') ?? '', lng: params.get('lng') ?? '' }), [params])
  const [form, setForm] = useState<PinForm>({ type: params.get('type') ?? '通行注意', title: '', content: '', photo: '' })
  const [error, setError] = useState('')
  const update = (key: keyof PinForm, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('タイトルと投稿内容を入力してください')
      return
    }
    // BEGIN DEMO ACCESS: デモCookieをAPIへ明示的に渡し、未ログインのデモ利用者でもピン投稿できるようにします。公開時はこのコメントからENDまで削除します。
    // デモ画面から送信された投稿であることをサーバーへ伝えます。公開時はこの識別子とサーバー側のデモ処理を削除します。
    void fetch('/api/map-pins', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-demo-access': 'true' }, body: JSON.stringify({ pin_type: form.type, title: form.title.trim(), description: form.content.trim(), latitude: Number(coordinates.lat), longitude: Number(coordinates.lng) }) }).then(async (response) => { if (!response.ok) { const result = await response.json().catch(() => ({})); setError(result.error ?? 'ピンを投稿できませんでした'); return } router.push('/') }).catch(() => setError('通信に失敗しました。内容を確認して再度お試しください'))
  }

  return (
    <main className="pin-entry-page">
      <header className="pin-entry-header">
        <button type="button" className="icon-button" aria-label="地図に戻る" onClick={() => router.back()}><ArrowLeft size={20} /></button>
        <div><p className="eyebrow">地図投稿</p><h1>ピン情報を入力</h1></div>
      </header>
      <section className="pin-entry-card" aria-labelledby="pin-entry-title">
        <div className="pin-location-summary"><span className="pin-location-icon"><MapPin size={19} /></span><div><b id="pin-entry-title">設置位置を確認しました</b><span>緯度 {coordinates.lat || '未取得'} / 経度 {coordinates.lng || '未取得'}</span></div></div>
        <p className="pin-entry-help">地図上で選んだ位置の情報を入力してください。内容は地域の安全確認に利用されます。</p>
        <form onSubmit={submit} className="pin-entry-form">
          <label>カテゴリー<select value={form.type} onChange={(event) => update('type', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>タイトル<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="例：道路が崩れて通れません" autoFocus /></label>
          <label>投稿内容<textarea value={form.content} onChange={(event) => update('content', event.target.value)} placeholder="現地の状況を入力してください" rows={6} /></label>
          <label className="photo-upload"><Camera size={17} />写真を添付（デモ）<input type="file" accept="image/*" onChange={(event) => update('photo', event.target.files?.[0]?.name ?? '')} /></label>
          {form.photo && <span className="file-name">選択中：{form.photo}</span>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button full"><Send size={17} />この内容でピンを投稿する</button>
        </form>
      </section>
    </main>
  )
}

export default function NewMapPinPage() {
  return <Suspense fallback={<main className="pin-entry-page"><p>入力画面を読み込んでいます...</p></main>}><NewMapPinPageContent /></Suspense>
}
