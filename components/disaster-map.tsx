'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle, LocateFixed, MapPin, RotateCcw, Search, Trash2, X, Flag, Camera, Eye,
  CheckCircle2, XCircle, Plus, Upload, MessageSquare, Users, ShieldCheck, RefreshCw,
  HelpCircle, ChevronLeft, ChevronRight, Navigation, Crosshair
} from 'lucide-react'
import {
  getMapPins, deleteMapPin, MapPinItem, votePin, addShelterReport, addSubPostToPin,
  addMapPin, getUserProfile, isWithin12Hours
} from '@/lib/store'
import { calculateDistanceKm, findCity } from '@/lib/cities'
import ReportModal from '@/components/report-modal'

const pinColors: Record<MapPinItem['type'], string> = {
  避難所: '#10b981', // green
  井戸: '#06b6d4', // cyan
  自販機: '#f97316', // orange
  指定物資置き場: '#3b82f6', // blue
  求援: '#ef4444', // red
  通行注意: '#eab308', // yellow
  道路通行不能: '#dc2626',
  土砂崩れ: '#b45309',
  倒壊: '#991b1b',
  通行止め: '#dc2626',
  浸水: '#0284c7',
}

function icon(type: MapPinItem['type']) {
  const color = pinColors[type] || '#dc2626'
  return L.divIcon({
    className: 'custom-pin',
    html: `<span style="background:${color}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  })
}

// 13. 現在地用アイコンマーカー
const currentLocationIcon = L.divIcon({
  className: 'current-location-pin',
  html: `<div style="position:relative; width:24px; height:24px;">
    <div style="position:absolute; width:24px; height:24px; background:rgba(2, 132, 199, 0.3); border-radius:50%; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute; top:4px; left:4px; width:16px; height:16px; background:#0284c7; border:3px solid #ffffff; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function MapSizeFix() {
  const map = useMap()
  useEffect(() => {
    const refresh = () => map.invalidateSize({ animate: false })
    refresh()
    const timer = window.setTimeout(refresh, 250)
    window.addEventListener('resize', refresh)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', refresh)
    }
  }, [map])
  return null
}

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [map, center, zoom])
  return null
}

// 14. 右上ボタン用コントロール（大きいタップ領域で押しやすい）
function MapControls({
  onNotice,
  centerPos
}: {
  onNotice: (message: string) => void
  centerPos: [number, number]
}) {
  const map = useMap()

  return (
    <div
      className="map-controls"
      aria-label="地図操作"
      style={{
        position: 'absolute',
        top: '14px',
        right: '14px',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* 14-1: 位置情報ボタン */}
      <button
        type="button"
        aria-label="現在地へ移動"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#0284c7',
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (!navigator.geolocation) {
            onNotice('お使いの端末ではGPS位置情報がサポートされていません')
            return
          }

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              map.setView([pos.coords.latitude, pos.coords.longitude], 15)
              onNotice('現在地に移動しました')
            },
            () => {
              onNotice('現在地情報の取得に失敗しました')
            }
          )
        }}
      >
        <LocateFixed size={24} />
      </button>

      {/* 14-2: 更新・中央リセットボタン */}
      <button
        type="button"
        aria-label="地図を更新"
        title="ピン・表示を再読み込み"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#334155',
        }}
        onClick={(e) => {
          e.stopPropagation()
          map.setView(centerPos, map.getZoom())
          onNotice('地図のピンを再読み込みしました')
        }}
      >
        <RefreshCw size={22} />
      </button>
    </div>
  )
}

function ClickCapture({
  onPick
}: {
  onPick: (point: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng)
    },
  })

  return null
}

// 11-3 スライド画像リスト (後から追加・変更可能な構成)
const SLIDES = [
  {
    image: '/map1.png',
    title: '1 / 5',
    text: '市民の皆さんが道路状況を確認・共有するためのマップです'
  },
  {
    image: '/map2.png',
    title: '2 / 5',
    text: '普段と様子が違う道路や、洪水場所の写真を撮ってください。\n※危険が伴う場合は、身の安全の確保を優先してください'
  },
  {
    image: '/map3.png',
    title: '3 / 5',
    text: '自販機や、井戸、避難所にもピンを立てることができます。'
  },
  {
    image: '/map4.png',
    title: '4 / 5',
    text: 'すでに地図上にあるピンにも、「事実〇」「誤り×」ボタンで投票ができます。\n※投稿地点から半径2km以内のユーザのみ'
  },
  {
    image: '/map5.png',
    title: '5 / 5',
    text: '位置情報をONにして、ピン共有を始めましょう！\n（ONにしないと投稿ができません）'
  }
]

export default function DisasterMap({
  onNotice,
  role,
}: {
  onNotice: (message: string) => void
  role: '被災者' | '支援者' | '管理者'
}) {
  const router = useRouter()
  const user = getUserProfile()

  // 活動地域（基準地域）代表地点を中心座標として計算
  const defaultCenter = useMemo<[number, number]>(() => {
    if (user.disaster_prefecture && user.disaster_city) {
      const cityData = findCity(user.disaster_prefecture, user.disaster_city)
      if (cityData) return [cityData.lat, cityData.lng]
    }
    return [35.4281, 133.3308] // 米子市
  }, [user.disaster_prefecture, user.disaster_city])

  const [pins, setPins] = useState<MapPinItem[]>([])
  const [selected, setSelected] = useState<MapPinItem | null>(null)
  const [reportTarget, setReportTarget] = useState<MapPinItem | null>(null)
  const [confirmingPoint, setConfirmingPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'すべて' | MapPinItem['type']>('すべて')

  // 13. 現在地座標状態
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // 15. 地図モード ('submission' = 投稿モード, 'view' = 状況確認モード)
  const [mapMode, setMapMode] = useState<'submission' | 'view'>('view')
  const [mapZoom, setMapZoom] = useState(12)

  // 11. 操作方法スライドモーダル
  const [showHowToModal, setShowHowToModal] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  // 12. 操作方法終了後の位置情報案内
  const [showGpsNotice, setShowGpsNotice] = useState(false)
  const [hasGrantedGps, setHasGrantedGps] = useState(false)

  // 「事実〇/誤り×」投票モーダル
  const [votingType, setVotingType] = useState<'correct' | 'different' | null>(null)
  const [voteComment, setVoteComment] = useState('')
  const [votePhoto, setVotePhoto] = useState<string | null>(null)

  // 避難所情報投稿フォーム
  const [showShelterForm, setShowShelterForm] = useState(false)
  const [shelterPeople, setShelterPeople] = useState('')
  const [shelterGender, setShelterGender] = useState('')
  const [shelterFacility, setShelterFacility] = useState('')

  // 16. 新規ピン投稿フォーム
  const [newPinType, setNewPinType] = useState<MapPinItem['type']>('通行注意')
  const [newPinTitle, setNewPinTitle] = useState('')
  const [newPinContent, setNewPinContent] = useState('')
  const [newPinPhoto, setNewPinPhoto] = useState<string | null>(null)

  const refreshPins = () => {
    const loaded = getMapPins().filter(
      p => p.status !== 'hidden' && p.status !== 'deleted'
    )
    setPins(loaded)
    if (selected) {
      const freshSelected = loaded.find(p => p.id === selected.id)
      if (freshSelected) setSelected(freshSelected)
    }
  }

  useEffect(() => {
    refreshPins()

    // 13. 初期現在地取得
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
          setHasGrantedGps(true)
        },
        () => {
          setHasGrantedGps(false)
        }
      )
    }
  }, [])

  const visiblePins = useMemo(
    () =>
      pins.filter(
        (pin) =>
          (!query || `${pin.title}${pin.content}${pin.type}${pin.author}`.includes(query)) &&
          (filter === 'すべて' || pin.type === filter)
      ),
    [pins, query, filter]
  )

  // 15-1, 15-2 モード切り替え (version2.md 4-1-1: 投稿モードは活動地域中心＆最大倍率18)
  const [targetCenter, setTargetCenter] = useState<[number, number]>(defaultCenter)

  const handleSwitchMode = (mode: 'submission' | 'view') => {
    setMapMode(mode)
    if (mode === 'submission') {
      setTargetCenter(defaultCenter)
      setMapZoom(18) // 最大倍率
      onNotice(`投稿モードに切替えました（活動地域 [${user.disaster_city || '登録地域'}] の中心を最大倍率で表示）`)
    } else {
      setMapZoom(12) // 通常倍率維持
      onNotice('状況確認モードに切替えました')
    }
  }

  // ピン選択タップハンドラ
  const handlePickPoint = (point: { lat: number; lng: number }) => {
    if (!navigator.geolocation) {
      onNotice('GPS位置情報が取得できないため、ピンを投稿できません')
      return
    }
    setConfirmingPoint(point)
  }

  // 16. 写真選択ハンドラ（Max 2MB）
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isVote: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      onNotice('画像サイズは最大2MBまでです')
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const result = evt.target?.result as string
      if (isVote) {
        setVotePhoto(result)
      } else {
        setNewPinPhoto(result)
      }
    }
    reader.readAsDataURL(file)
  }

  // 16. ピン作成登録ハンドラ
  const handleCreatePinSubmit = () => {
    if (!confirmingPoint) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude

        const distKm = calculateDistanceKm(userLat, userLng, confirmingPoint.lat, confirmingPoint.lng)
        if (distKm > 15) {
          onNotice('位置情報が離れているため、ピンを立てられません')
          setConfirmingPoint(null)
          return
        }

        const res = addMapPin({
          type: newPinType,
          title: newPinTitle.trim() || undefined,
          content: newPinContent.trim() || undefined,
          lat: confirmingPoint.lat,
          lng: confirmingPoint.lng,
          photo: newPinPhoto || undefined,
          userLat,
          userLng,
        })

        if (res.success) {
          onNotice(`${newPinType}のピンを作成しました`)
          setConfirmingPoint(null)
          setNewPinTitle('')
          setNewPinContent('')
          setNewPinPhoto(null)
          refreshPins()
        } else {
          onNotice(res.error || 'ピンの作成に失敗しました')
        }
      },
      () => {
        onNotice('位置情報が離れているため、ピンを立てられません（GPSを取得できません）')
      },
      { timeout: 5000 }
    )
  }

  // 17, 18. 「事実〇」「誤り×」投票ハンドラ (2km以内)
  const handleVoteSubmit = () => {
    if (!selected || !votingType) return

    if (!navigator.geolocation) {
      onNotice('GPS位置情報を取得できません（2km以内が必要です）')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude

        const res = votePin(
          selected.id,
          votingType,
          voteComment,
          votePhoto || undefined,
          userLat,
          userLng
        )

        if (res.success) {
          onNotice(
            votingType === 'correct'
              ? '「事実〇」の情報を報告しました'
              : '「誤り×」の情報を報告しました'
          )
          setVotingType(null)
          setVoteComment('')
          setVotePhoto(null)
          refreshPins()
        } else {
          onNotice(res.error || '評価を投票できませんでした')
        }
      },
      () => {
        onNotice('投稿地点から半径2km以内のユーザーのみ投票できます（GPS情報を取得できません）')
      },
      { timeout: 5000 }
    )
  }

  // 11. 操作方法を閉じた後の処理 (仕様書 12)
  const handleCloseHowTo = () => {
    setShowHowToModal(false)
    if (!hasGrantedGps) {
      setShowGpsNotice(true)
    }
  }

  return (
    <div className="map-page" style={{ position: 'relative', width: '100%' }}>

      {/* 検索バー */}
      <div className="map-toolbar" style={{ marginBottom: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="施設名・投稿内容・井戸・自販機等を検索..."
          />
        </div>
      </div>

      {/* 15. モード切り替えボタン (検索欄の下、地図の上) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <button
          type="button"
          onClick={() => handleSwitchMode('submission')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: mapMode === 'submission' ? '2px solid #0284c7' : '1px solid #cbd5e1',
            background: mapMode === 'submission' ? '#e0f2fe' : '#ffffff',
            color: mapMode === 'submission' ? '#0284c7' : '#475569',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: mapMode === 'submission' ? '0 2px 6px rgba(2, 132, 199, 0.2)' : 'none',
          }}
        >
          <Crosshair size={16} />
          投稿モード
        </button>
        <button
          type="button"
          onClick={() => handleSwitchMode('view')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: mapMode === 'view' ? '2px solid #0284c7' : '1px solid #cbd5e1',
            background: mapMode === 'view' ? '#e0f2fe' : '#ffffff',
            color: mapMode === 'view' ? '#0284c7' : '#475569',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: mapMode === 'view' ? '0 2px 6px rgba(2, 132, 199, 0.2)' : 'none',
          }}
        >
          <Eye size={16} />
          状況確認モード
        </button>
      </div>

      {/* 地図キャンバス */}
      <div
        className="map-canvas real-map"
        style={{
          position: 'relative',
          height: '520px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={mapZoom}
          scrollWheelZoom
          className="leaflet-map"
          style={{ height: '100%', width: '100%' }}
        >
          <MapSizeFix />
          <MapViewController center={targetCenter} zoom={mapZoom} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 14. 地図右上コントロール */}
          <MapControls
            onNotice={onNotice}
            centerPos={defaultCenter}
          />

          <ClickCapture onPick={handlePickPoint} />

          {/* 13. 現在地アイコン */}
          {userLocation && (
            <Marker position={userLocation} icon={currentLocationIcon}>
              <Popup>現在地</Popup>
            </Marker>
          )}

          {/* 新規ピン仮設置 */}
          {confirmingPoint && (
            <Marker position={[confirmingPoint.lat, confirmingPoint.lng]} icon={icon(newPinType)}>
              <Popup>新規ピン作成中</Popup>
            </Marker>
          )}

          {/* 既存ピン */}
          {visiblePins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={icon(pin.type)}
              eventHandlers={{
                click: () => setSelected(pin)
              }}
            >
              <Popup>
                <div style={{ padding: '2px' }}>
                  <span style={{ color: pinColors[pin.type], fontWeight: 'bold', fontSize: '12px' }}>
                    ● {pin.type}
                  </span>
                  <h4 style={{ margin: '4px 0 2px', fontSize: '14px' }}>{pin.title}</h4>
                  {isWithin12Hours(pin.created_at) && (
                    <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>
                      🟢 12時間以内
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* 10-1: 地図の左下に固定表示する「操作方法」ボタン */}
        <button
          type="button"
          onClick={() => {
            setCurrentSlideIndex(0)
            setShowHowToModal(true)
          }}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 500,
            background: '#ffffff',
            color: '#0284c7',
            border: '2px solid #0284c7',
            borderRadius: '24px',
            padding: '10px 18px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <HelpCircle size={18} />
          操作方法
        </button>
      </div>

      {/* 16. ピン投稿画面 (縦方向のスクロール形式 1列レイアウト) */}
      {confirmingPoint && (
        <div
          role="dialog"
          aria-label="ピンを投稿"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 8000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <strong style={{ fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={22} color="#0284c7" />
                ピンを投稿
              </strong>
              <button
                type="button"
                onClick={() => setConfirmingPoint(null)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* 16-1: 縦1列スクロールレイアウト */}
            <form onSubmit={(e) => { e.preventDefault(); handleCreatePinSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: '#334155' }}>
                  ピンの種類（カテゴリ）
                </label>
                <select
                  value={newPinType}
                  onChange={(e) => setNewPinType(e.target.value as MapPinItem['type'])}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  <option value="通行注意">通行注意 (危険)</option>
                  <option value="井戸">井戸 (生活用水)</option>
                  <option value="自販機">自販機 (災害給水)</option>
                  <option value="避難所">避難所</option>
                  <option value="指定物資置き場">指定物資置き場</option>
                  <option value="求援">求援</option>
                  <option value="道路通行不能">道路通行不能</option>
                  <option value="土砂崩れ">土砂崩れ</option>
                  <option value="浸水">浸水</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  名前 / タイトル（任意）
                </label>
                <input
                  type="text"
                  placeholder="例：加茂川近くの井戸 / ○○自販機"
                  value={newPinTitle}
                  onChange={(e) => setNewPinTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  内容 / 詳細（任意）
                </label>
                <textarea
                  placeholder="詳細な状況や注意事項を入力してください"
                  value={newPinContent}
                  onChange={(e) => setNewPinContent(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              {/* 16-3: 写真アップロード (最大2MB) */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  写真アップロード (最大2MB, 1枚)
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#0284c7',
                    fontWeight: 'bold',
                  }}
                >
                  <Camera size={18} />
                  {newPinPhoto ? '写真を変更する' : '写真を選択 / 撮影'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e, false)}
                    style={{ display: 'none' }}
                  />
                </label>
                {newPinPhoto && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <img src={newPinPhoto} alt="プレビュー" style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="secondary-button" style={{ padding: '10px 18px' }} onClick={() => setConfirmingPoint(null)}>
                  キャンセル
                </button>
                <button type="submit" className="primary-button" style={{ padding: '10px 22px', fontWeight: 'bold' }}>
                  登録する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ピン詳細表示カード */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            left: '16px',
            maxWidth: '440px',
            maxHeight: '85vh',
            overflowY: 'auto',
            margin: '0 auto',
            background: '#ffffff',
            padding: '18px',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            border: '1px solid #cbd5e1',
            zIndex: 600,
          }}
        >
          <button className="modal-close" onClick={() => setSelected(null)} aria-label="閉じる">
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: pinColors[selected.type] || '#2563eb', fontWeight: 700, fontSize: '13px' }}>
              ● {selected.type}
            </span>
            {isWithin12Hours(selected.created_at) && (
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px' }}>
                🟢 12時間以内
              </span>
            )}
          </div>

          <h3 style={{ margin: '4px 0 8px', fontSize: '18px', color: '#0f172a' }}>{selected.title}</h3>

          {selected.content && (
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
              {selected.content}
            </p>
          )}

          {/* 17, 18. 「事実〇」「誤り×」投票機能 */}
          <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
              現地の情報確認（※半径2km以内のユーザーのみ投票可能）
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #16a34a',
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setVotingType('correct')}
              >
                <CheckCircle2 size={16} />
                事実〇 ({selected.correct_count || 0})
              </button>

              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #dc2626',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setVotingType('different')}
              >
                <XCircle size={16} />
                誤り× ({selected.different_count || 0})
              </button>
            </div>
          </div>

          {/* 投票ダイアログ */}
          {votingType && (
            <div style={{ background: '#fff', border: '2px solid #3b82f6', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
              <strong style={{ fontSize: '13px', color: '#1e3a8a', display: 'block', marginBottom: '8px' }}>
                「{votingType === 'correct' ? '事実〇' : '誤り×'}」の補足情報を追加
              </strong>
              <textarea
                placeholder="補足コメントを入力してください"
                value={voteComment}
                onChange={(e) => setVoteComment(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button className="secondary-button" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setVotingType(null)}>
                  キャンセル
                </button>
                <button className="primary-button" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={handleVoteSubmit}>
                  送信する
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 11. 操作方法説明画面モーダル (外側クリックでは閉じない) */}
      {showHowToModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* 11-1: ページ数表示 (例: 1 / 5) */}
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7', marginBottom: '12px' }}>
              {SLIDES[currentSlideIndex].title}
            </div>

            {/* 11-3: 画像表示 (map1.png ~ map5.png) */}
            <div style={{ width: '100%', height: '220px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', overflow: 'hidden' }}>
              <img
                src={SLIDES[currentSlideIndex].image}
                alt={`操作方法 ${currentSlideIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* 11-4: スライド本文テキスト */}
            <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.6, minHeight: '60px', whiteSpace: 'pre-line', marginBottom: '20px' }}>
              {SLIDES[currentSlideIndex].text}
            </p>

            {/* 11-2: ナビゲーションボタン */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
              {/* 1ページ目の時は戻るボタン無効 */}
              <button
                type="button"
                className="secondary-button"
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex(prev => prev - 1)}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  opacity: currentSlideIndex === 0 ? 0.3 : 1,
                  cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={16} /> 戻る
              </button>

              {/* 最後のページの時は「閉じる」ボタン */}
              {currentSlideIndex === SLIDES.length - 1 ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleCloseHowTo}
                  style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 'bold', justifyContent: 'center' }}
                >
                  閉じる
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                  style={{ flex: 1, padding: '10px', fontSize: '14px', justifyContent: 'center' }}
                >
                  次へ <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 12. 操作方法終了後の位置情報案内ダイアログ */}
      {showGpsNotice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 9100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '380px',
              width: '100%',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Navigation size={32} color="#0284c7" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', margin: '0 0 8px', color: '#0f172a' }}>位置情報の共有</h3>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              位置情報を許可すると、現在地付近の道路や被害ピンの投稿・確認ができます。
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                onClick={() => setShowGpsNotice(false)}
              >
                許可しない
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 'bold' }}
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(() => {
                      onNotice('位置情報の共有を許可しました')
                    })
                  }
                  setShowGpsNotice(false)
                }}
              >
                許可する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}