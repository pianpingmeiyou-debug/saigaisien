'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import { FormEvent, Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Camera, MapPin, Send, X, AlertTriangle } from 'lucide-react'
import { addMapPin, getUserProfile } from '@/lib/store'

const categories = [
  '避難所',
  '道路通行不能',
  '通行注意',
  '土砂崩れ',
  '倒壊',
  '通行止め',
  '浸水',
  '求援',
  '指定物資置き場',
] as const

type PinCategory = typeof categories[number]

function NewMapPinPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const coordinates = useMemo(() => ({ lat: params.get('lat') ?? '', lng: params.get('lng') ?? '' }), [params])
  
  const [user] = useState(getUserProfile())
  const [type, setType] = useState<PinCategory>((params.get('type') as PinCategory) || '通行注意')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [photoFileName, setPhotoFileName] = useState('')
  const [error, setError] = useState('')

  // 2.5MB以下のPNG/JPG/JPEGのみ受け付ける
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 形式チェック
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('画像形式はPNG, JPG, JPEGのみ対応しています')
      return
    }

    // サイズチェック: 2.5MB以下 (2.5 * 1024 * 1024 bytes)
    const MAX_SIZE = 2.5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError('画像サイズは最大2.5MBまでです')
      return
    }

    setError('')
    setPhotoFileName(file.name)

    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      setPhotoDataUrl(uploadEvent.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhotoDataUrl('')
    setPhotoFileName('')
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (user.account_status === 'frozen') {
      setError('ご利用のアカウントは凍結されているため、ピンの設置はできません。')
      return
    }

    if (!title.trim() || !content.trim()) {
      setError('タイトルと投稿内容を入力してください')
      return
    }

    const lat = Number(coordinates.lat)
    const lng = Number(coordinates.lng)

    if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
      setError('緯度・経度が正しく取得できませんでした。地図から位置を選択してください。')
      return
    }

    const res = addMapPin({
      type,
      title: title.trim(),
      content: content.trim(),
      lat,
      lng,
      photo: photoDataUrl || undefined,
    })

    if (!res.success) {
      setError(res.error || 'ピンを投稿できませんでした')
      return
    }

    router.push('/')
  }

  return (
    <main className="pin-entry-page">
      <header className="pin-entry-header">
        <button type="button" className="icon-button" aria-label="地図に戻る" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">地図投稿</p>
          <h1>ピン情報を入力</h1>
        </div>
      </header>

      <section className="pin-entry-card" aria-labelledby="pin-entry-title">
        <div className="pin-location-summary">
          <span className="pin-location-icon">
            <MapPin size={19} />
          </span>
          <div>
            <b id="pin-entry-title">設置位置を確認しました</b>
            <span>
              緯度 {coordinates.lat ? Number(coordinates.lat).toFixed(4) : '未取得'} / 経度 {coordinates.lng ? Number(coordinates.lng).toFixed(4) : '未取得'}
            </span>
          </div>
        </div>

        <p className="pin-entry-help">
          投稿者名として「<b>{user.name}</b>」が表示されます。地図上で選んだ位置の被害情報や安全情報を入力してください。
        </p>

        <form onSubmit={submit} className="pin-entry-form">
          <label>
            カテゴリー
            <select value={type} onChange={(event) => setType(event.target.value as PinCategory)}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            タイトル
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例：道路が崩れて通れません、〇〇体育館が開設中"
              autoFocus
            />
          </label>

          <label>
            投稿内容
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="現地の状況、通れる幅、受け入れ体制などを入力してください"
              rows={5}
            />
          </label>

          {/* 画像アップロード */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              写真の添付（1枚 / 最大2.5MB / PNG・JPG・JPEG）
            </label>
            {!photoDataUrl ? (
              <label
                className="photo-upload"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: '#f8fafc',
                }}
              >
                <Camera size={20} color="#0284c7" />
                <span style={{ fontSize: '13px', color: '#334155' }}>写真を選択またはカメラで撮影</span>
                <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            ) : (
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '6px' }}>
                <img
                  src={photoDataUrl}
                  alt="プレビュー"
                  style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: '#e11d48',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="写真を削除"
                >
                  <X size={15} />
                </button>
                <small style={{ display: 'block', marginTop: '4px', color: '#64748b' }}>{photoFileName}</small>
              </div>
            )}
          </div>

          {error && (
            <p className="form-error" role="alert" style={{ color: '#e11d48', fontSize: '13px', margin: '4px 0' }}>
              {error}
            </p>
          )}

          <button type="submit" className="primary-button full" style={{ marginTop: '16px' }}>
            <Send size={17} /> この内容でピンを投稿する
          </button>
        </form>
      </section>
    </main>
  )
}

export default function NewMapPinPage() {
  return (
    <Suspense
      fallback={
        <main className="pin-entry-page">
          <p>入力画面を読み込んでいます...</p>
        </main>
      }
    >
      <NewMapPinPageContent />
    </Suspense>
  )
}
