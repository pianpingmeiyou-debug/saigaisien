'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, LocateFixed, MapPin, RotateCcw, Search, ShieldCheck, Trash2, X } from 'lucide-react'

export type DisasterPin = {
  id: string | number
  type: '避難所' | '道路通行不能' | '通行注意' | '土砂崩れ' | '倒壊' | '通行止め' | '浸水' | '求援' | '指定物資置き場'
  title: string
  author: string
  content: string
  lat: number
  lng: number
  photo?: string
  verified?: boolean
}

const initialPins: DisasterPin[] = [
  { id: 1, type: '避難所', title: '輪島市立体育館', author: '自治体確認済み', content: '確認済み避難所。現在受け入れ可能です。', lat: 37.39, lng: 136.90, verified: true },
  { id: 2, type: '指定物資置き場', title: '輪島市 支援物資置き場', author: '輪島市', content: '支援物資の受け取り場所です。', lat: 37.395, lng: 136.91, verified: true },
  { id: 3, type: '通行注意', title: '県道249号', author: '佐藤 花子', content: '片側通行。大型車は注意してください。', lat: 37.375, lng: 136.93 },
  { id: 4, type: '浸水', title: '珠洲市役所周辺', author: '山田 健', content: '道路冠水の報告があります。', lat: 37.44, lng: 137.26 },
  { id: 5, type: '避難所', title: '東京都内避難所', author: '自治体確認済み', content: '全国の災害情報を掲載できます。', lat: 35.68, lng: 139.69, verified: true },
]

const pinColors: Record<DisasterPin['type'], string> = {
  避難所: '#2563eb', 指定物資置き場: '#16a34a', 求援: '#f59e0b', 通行注意: '#dc2626', 道路通行不能: '#dc2626', 土砂崩れ: '#dc2626', 倒壊: '#dc2626', 通行止め: '#dc2626', 浸水: '#dc2626',
}

function icon(type: DisasterPin['type']) {
  return L.divIcon({ className: 'custom-pin', html: `<span style="background:${pinColors[type]}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>`, iconSize: [34, 42], iconAnchor: [17, 42] })
}

// 地図コンテナの実寸が確定した後に再計算し、アップロード先の画面サイズでもタイルとピンを確実に表示します。
function MapSizeFix() {
  const map = useMap()
  useEffect(() => {
    const refresh = () => map.invalidateSize({ animate: false })
    refresh()
    const timer = window.setTimeout(refresh, 250)
    window.addEventListener('resize', refresh)
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', refresh) }
  }, [map])
  return null
}

function MapControls({ onNotice }: { onNotice: (message: string) => void }) {
  const map = useMap()
  return <div className="map-controls" aria-label="地図操作"><button type="button" aria-label="現在地へ移動" onClick={() => { map.locate({ setView: true, maxZoom: 13 }); onNotice('現在地を確認しています') }}><LocateFixed size={17}/></button><button type="button" aria-label="地図を初期位置に戻す" onClick={() => map.setView([35.68, 139.69], 5)}><RotateCcw size={17}/></button></div>
}

function ClickCapture({ onPick }: { onPick: (point: { lat: number; lng: number }) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng) } })
  return null
}

export default function DisasterMap({ onNotice, role }: { onNotice: (message: string) => void; role: '被災者' | '支援者' | '管理者' }) {
  const router = useRouter()
  const [pins, setPins] = useState(initialPins)
  const [selected, setSelected] = useState<DisasterPin | null>(null)

  // 公開ピンはサーバーAPIから取得し、通信失敗時だけ既存の初期表示へ戻します。
  // 権限判定や保存処理は必ずAPI側で行い、ブラウザの状態を信頼しません。
  useEffect(() => {
    let cancelled = false
    fetch('/api/map-pins')
      .then(async (response) => {
        if (!response.ok) return
        const payload = await response.json()
        const rows = Array.isArray(payload.data) ? payload.data : []
        const nextPins = rows.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? crypto.randomUUID()),
          type: (row.pin_type ?? row.type ?? '通行注意') as DisasterPin['type'],
          title: String(row.title ?? '地図ピン'),
          author: String(row.author ?? '投稿者'),
          content: String(row.description ?? row.content ?? ''),
          lat: Number(row.latitude ?? row.lat),
          lng: Number(row.longitude ?? row.lng),
          verified: Boolean(row.approved),
        })).filter((pin: DisasterPin) => Number.isFinite(pin.lat) && Number.isFinite(pin.lng))
        // APIの結果が空でも初期データを残さず、期限切れピンを地図から確実に除外します。
        if (!cancelled) setPins(nextPins)
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [])
  const [confirmingPoint, setConfirmingPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [waterWarning, setWaterWarning] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'すべて' | DisasterPin['type']>('すべて')
  const visiblePins = useMemo(() => pins.filter((pin) => (!query || `${pin.title}${pin.content}${pin.type}`.includes(query)) && (filter === 'すべて' || pin.type === filter)), [pins, query, filter])

  const pick = (point: { lat: number; lng: number }) => {
    // 全国の陸地で投稿位置を選択できます。海域の判定は行わず、地図表示の範囲を地域限定しません。
    setWaterWarning(false)
    setConfirmingPoint(point)
    onNotice('設置位置を確認してください')
  }

  return <div className="map-page">
    <div className="map-toolbar"><div className="search-input"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="地名・施設名・投稿内容を検索"/></div><div className="map-filters" aria-label="ピンの絞り込み"><button className={filter === 'すべて' ? 'active' : ''} onClick={() => setFilter('すべて')}>すべて</button><button className={filter === '避難所' ? 'active' : ''} onClick={() => setFilter('避難所')}>避難所</button><button className={filter === '指定物資置き場' ? 'active' : ''} onClick={() => setFilter('指定物資置き場')}>物資</button><button className={filter === '通行注意' ? 'active' : ''} onClick={() => setFilter('通行注意')}>交通</button></div></div>
    <div className="map-canvas real-map"><MapContainer center={[35.68, 139.69]} zoom={5} scrollWheelZoom className="leaflet-map"><MapSizeFix/><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MapControls onNotice={onNotice}/><ClickCapture onPick={pick}/>{confirmingPoint && <Marker position={[confirmingPoint.lat, confirmingPoint.lng]} icon={icon('通行注意')}><Popup>この位置にピンを設置しますか？</Popup></Marker>}{visiblePins.map((pin) => <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={icon(pin.type)} eventHandlers={{ click: () => setSelected(pin) }}><Popup><b>{pin.title}</b><br/>{pin.type}{pin.verified ? '・確認済み' : ''}</Popup></Marker>)}</MapContainer>{confirmingPoint && <div className="pin-confirm" role="dialog" aria-label="ピン設置の確認"><span className="preview-icon"><MapPin size={18}/></span><div><b>この位置にピンを設置しますか？</b><span>地図上のプレビュー位置を確認してください</span></div><div className="pin-confirm-actions"><button type="button" className="secondary-button" onClick={() => setConfirmingPoint(null)}>いいえ</button><button type="button" className="primary-button" onClick={() => { const point = confirmingPoint; setConfirmingPoint(null); router.push(`/map-pin/new?lat=${point.lat}&lng=${point.lng}&type=${encodeURIComponent('通行注意')}`) }}>はい、設置する</button></div></div>}<div className="map-legend"><b>地図表示</b><span><i className="legend-dot blue"/>避難所</span><span><i className="legend-dot green"/>指定物資置き場</span><span><i className="legend-dot red"/>交通情報</span></div><div className="map-caution"><MapPin size={16}/>全国の地図情報を表示しています。地図上の任意の場所を選択できます。</div>{waterWarning && <div className="water-warning" role="alert"><AlertTriangle size={18}/><div><b>ここにはピンを置くことはできません</b><span>交通道路・橋以外の水域は選択できません。陸地の位置を選んでください。</span></div><button type="button" aria-label="警告を閉じる" onClick={() => setWaterWarning(false)}><X size={16}/></button></div>}</div>
    {selected && <div className="pin-detail"><button className="modal-close" onClick={() => setSelected(null)}><X size={17}/></button><span className="pin-type" style={{ color: pinColors[selected.type] }}>{selected.type}</span><h3>{selected.title}</h3><p>{selected.content}</p><small>投稿者：{selected.author}{selected.verified ? '（確認済み）' : ''}</small><div className="pin-actions"><button className="text-button" onClick={() => onNotice('このピンを通報しました')}>このピンを通報</button>{role === '管理者' && <button className="danger-button" onClick={() => { if (window.confirm('このピンを削除しますか？')) { setPins((current) => current.filter((pin) => pin.id !== selected.id)); setSelected(null); onNotice('管理者権限でピンを削除しました') } }}><Trash2 size={15}/>ピンを削除</button>}</div></div>}
  </div>
}
