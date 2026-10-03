'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle, LocateFixed, MapPin, RotateCcw, Search, Trash2, X, Flag, Camera, Eye,
  CheckCircle2, XCircle, Plus, Upload, MessageSquare, Users, ShieldCheck, RefreshCw
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

function MapControls({
  onNotice,
  centerPos
}: {
  onNotice: (message: string) => void
  centerPos: [number, number]
}) {
  const map = useMap()

  return (
    <div className="map-controls" aria-label="地図操作">
      <button
        type="button"
        aria-label="現在地へ移動"
        onClick={() => {
          if (!navigator.geolocation) {
            onNotice('お使いの端末ではGPS位置情報がサポートされていません')
            return
          }

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              map.setView([pos.coords.latitude, pos.coords.longitude], 14)
              onNotice('現在地に移動しました')
            },
            () => {
              onNotice('現在地情報の取得に失敗しました')
            }
          )
        }}
      >
        <LocateFixed size={17} />
      </button>

      <button
        type="button"
        aria-label="活動地域を中心に戻す"
        title="活動地域を中心に表示"
        onClick={() => {
          map.setView(centerPos, 12)
          onNotice('活動地域を中心に再表示しました')
        }}
      >
        <RotateCcw size={17} />
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

export default function DisasterMap({
  onNotice,
  role,
}: {
  onNotice: (message: string) => void
  role: '被災者' | '支援者' | '管理者'
}) {
  const router = useRouter()
  const user = getUserProfile()

  // 活動地域（基準地域）を中心座標として計算
  const defaultCenter = useMemo<[number, number]>(() => {
    if (user.disaster_prefecture && user.disaster_city) {
      const cityData = findCity(user.disaster_prefecture, user.disaster_city)
      if (cityData) return [cityData.lat, cityData.lng]
    }

    return [35.4281, 133.3308] // Default 米子市
  }, [user.disaster_prefecture, user.disaster_city])

  const [pins, setPins] = useState<MapPinItem[]>([])
  const [selected, setSelected] = useState<MapPinItem | null>(null)
  const [reportTarget, setReportTarget] = useState<MapPinItem | null>(null)
  const [confirmingPoint, setConfirmingPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'すべて' | MapPinItem['type']>('すべて')

  // 「正しい/異なる」追加補足モーダル
  const [votingType, setVotingType] = useState<'correct' | 'different' | null>(null)
  const [voteComment, setVoteComment] = useState('')
  const [votePhoto, setVotePhoto] = useState<string | null>(null)

  // 避難所情報投稿フォーム
  const [showShelterForm, setShowShelterForm] = useState(false)
  const [shelterPeople, setShelterPeople] = useState('')
  const [shelterGender, setShelterGender] = useState('')
  const [shelterFacility, setShelterFacility] = useState('')

  // 同じ場所への複数投稿フォーム
  const [showSubPostForm, setShowSubPostForm] = useState(false)
  const [subPostContent, setSubPostContent] = useState('')

  // 新規ピン投稿簡易フォーム (地図タップ時)
  const [newPinType, setNewPinType] = useState<MapPinItem['type']>('通行注意')
  const [newPinTitle, setNewPinTitle] = useState('')
  const [newPinContent, setNewPinContent] = useState('')

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

  // 7-1 ピン投稿時 GPS 距離判定 (15km以内)
  const handlePickPoint = (point: { lat: number; lng: number }) => {
    if (!navigator.geolocation) {
      onNotice('GPS位置情報が取得できないため、ピンを投稿できません')
      return
    }

    setConfirmingPoint(point)
  }

  const handleCreatePinSubmit = () => {
    if (!confirmingPoint) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude

        const distKm = calculateDistanceKm(
          userLat,
          userLng,
          confirmingPoint.lat,
          confirmingPoint.lng
        )

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
          userLat,
          userLng,
        })

        if (res.success) {
          onNotice(`${newPinType}のピンをマップに作成しました`)
          setConfirmingPoint(null)
          setNewPinTitle('')
          setNewPinContent('')
          refreshPins()
        } else {
          onNotice(res.error || 'ピンの作成に失敗しました')
        }
      },
      (err) => {
        onNotice(
          '位置情報が離れているため、ピンを立てられません（GPSを取得できません）'
        )
      },
      { timeout: 5000 }
    )
  }

  // 9. 「正しい〇」「異なる✕」投票処理
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
              ? '「正しい〇」の確認を報告しました'
              : '「異なる✕」の確認を報告しました'
          )
          setVotingType(null)
          setVoteComment('')
          setVotePhoto(null)
          refreshPins()
        } else {
          onNotice(res.error || '評価を投票できませんでした')
        }
      },
      (err) => {
        onNotice(
          '位置情報が離れているため、確認・投票を行えません（GPS情報を取得できません）'
        )
      },
      { timeout: 5000 }
    )
  }

  // 12-2 避難所情報投稿処理 (2km以内)
  const handleShelterReportSubmit = () => {
    if (!selected) return

    if (
      !shelterPeople.trim() &&
      !shelterGender.trim() &&
      !shelterFacility.trim()
    ) {
      onNotice('少なくともいずれかの項目を入力してください')
      return
    }

    if (!navigator.geolocation) {
      onNotice('GPS位置情報を取得できません（2km以内が必要です）')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude

        const res = addShelterReport(
          selected.id,
          shelterPeople,
          shelterGender,
          shelterFacility,
          userLat,
          userLng
        )

        if (res.success) {
          onNotice('避難所情報を投稿しました')
          setShowShelterForm(false)
          setShelterPeople('')
          setShelterGender('')
          setShelterFacility('')
          refreshPins()
        } else {
          onNotice(res.error || '避難所情報を投稿できませんでした')
        }
      },
      () => {
        onNotice('避難所から離れているため情報投稿できません（GPSを取得できません）')
      },
      { timeout: 5000 }
    )
  }

  // 10. 同じ場所への複数投稿追加処理
  const handleSubPostSubmit = () => {
    if (!selected || !subPostContent.trim()) return

    const res = addSubPostToPin(selected.id, subPostContent)

    if (res.success) {
      onNotice('地点へ情報を追加しました')
      setShowSubPostForm(false)
      setSubPostContent('')
      refreshPins()
    } else {
      onNotice(res.error || '投稿できませんでした')
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (evt) => {
      setVotePhoto(evt.target?.result as string)
    }

    reader.readAsDataURL(file)
  }

  return (
    <div
      className="map-page"
      style={{ position: 'relative', width: '100%' }}
    >
      {/* ツールバー */}
      <div
        className="map-toolbar"
        style={{
          marginBottom: '12px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div
          className="search-input"
          style={{ flex: 1, minWidth: '220px' }}
        >
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="施設名・投稿内容・井戸・自販機等を検索"
          />
        </div>

        <div
          className="map-filters"
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
          aria-label="ピンの絞り込み"
        >
          <button
            className={filter === 'すべて' ? 'active' : ''}
            onClick={() => setFilter('すべて')}
          >
            すべて
          </button>

          <button
            className={filter === '避難所' ? 'active' : ''}
            onClick={() => setFilter('避難所')}
          >
            避難所
          </button>

          <button
            className={filter === '井戸' ? 'active' : ''}
            onClick={() => setFilter('井戸')}
          >
            井戸
          </button>

          <button
            className={filter === '自販機' ? 'active' : ''}
            onClick={() => setFilter('自販機')}
          >
            自販機
          </button>

          <button
            className={filter === '指定物資置き場' ? 'active' : ''}
            onClick={() => setFilter('指定物資置き場')}
          >
            物資置き場
          </button>

          <button
            className={filter === '通行注意' ? 'active' : ''}
            onClick={() => setFilter('通行注意')}
          >
            交通・被害
          </button>
        </div>

        <button
          type="button"
          className="secondary-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            padding: '6px 12px'
          }}
          onClick={() => {
            refreshPins()
            onNotice('地図情報を最新にリロードしました')
          }}
        >
          <RefreshCw size={14} /> リロード
        </button>
      </div>

      {/* 地図キャンバス */}
      <div
        className="map-canvas real-map"
        style={{
          height: '540px',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid #cbd5e1'
        }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom
          className="leaflet-map"
        >
          <MapSizeFix />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapControls
            onNotice={onNotice}
            centerPos={defaultCenter}
          />

          <ClickCapture onPick={handlePickPoint} />

          {confirmingPoint && (
            <Marker
              position={[
                confirmingPoint.lat,
                confirmingPoint.lng
              ]}
              icon={icon(newPinType)}
            >
              <Popup>この位置にピンを設置（選択中）</Popup>
            </Marker>
          )}

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
                  <span
                    style={{
                      color: pinColors[pin.type],
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    ● {pin.type}
                  </span>

                  <h4
                    style={{
                      margin: '4px 0 2px',
                      fontSize: '14px'
                    }}
                  >
                    {pin.title}
                  </h4>

                  {isWithin12Hours(pin.created_at) && (
                    <span
                      style={{
                        color: '#16a34a',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                    >
                      🟢 12時間以内
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* 6-1 ピン設置モーダル/ダイアログ */}
        {confirmingPoint && (
          <div
            className="pin-confirm"
            role="dialog"
            aria-label="ピンを投稿"
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              padding: '24px 28px',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              zIndex: 700,
              width: 'calc(100% - 24px)',
              maxWidth: '620px',
              boxSizing: 'border-box',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '2px solid #0284c7',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '10px'
              }}
            >
              <strong
                style={{
                  fontSize: '18px',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MapPin
                  size={22}
                  style={{ color: '#0284c7' }}
                />
                ピンを投稿
              </strong>

              <button
                onClick={() => setConfirmingPoint(null)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* ★ 入力欄を必ず1列で表示 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                width: '100%',
                gap: '14px',
                marginBottom: '20px'
              }}
            >
              {/* ピンの種類 */}
              <div style={{ width: '100%' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '6px',
                    color: '#334155'
                  }}
                >
                  ピンの種類（カテゴリ）
                </label>

                <select
                  value={newPinType}
                  onChange={(e) =>
                    setNewPinType(
                      e.target.value as MapPinItem['type']
                    )
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                >
                  <option value="通行注意">
                    通行注意 (危険)
                  </option>
                  <option value="井戸">
                    井戸 (生活用水)
                  </option>
                  <option value="自販機">
                    自販機 (災害給水)
                  </option>
                  <option value="避難所">
                    避難所
                  </option>
                  <option value="指定物資置き場">
                    指定物資置き場
                  </option>
                  <option value="求援">
                    求援
                  </option>
                  <option value="道路通行不能">
                    道路通行不能
                  </option>
                  <option value="土砂崩れ">
                    土砂崩れ
                  </option>
                  <option value="浸水">
                    浸水
                  </option>
                </select>
              </div>

              {/* 名前 / タイトル */}
              <div style={{ width: '100%' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#334155',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  名前 / タイトル（任意）
                </label>

                <input
                  type="text"
                  placeholder="例：加茂川近くの井戸 / ○○自販機"
                  value={newPinTitle}
                  onChange={(e) =>
                    setNewPinTitle(e.target.value)
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* 内容 / 詳細 */}
              <div style={{ width: '100%' }}>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#334155',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  内容 / 詳細（任意）
                </label>

                <textarea
                  placeholder="詳細な状況や利用時の注意事項などを入力してください"
                  value={newPinContent}
                  onChange={(e) =>
                    setNewPinContent(e.target.value)
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* ボタン */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                paddingTop: '10px',
                borderTop: '1px solid #f1f5f9'
              }}
            >
              <button
                type="button"
                className="secondary-button"
                style={{
                  padding: '10px 18px',
                  fontSize: '14px'
                }}
                onClick={() => setConfirmingPoint(null)}
              >
                キャンセル
              </button>

              <button
                type="button"
                className="primary-button"
                style={{
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={handleCreatePinSubmit}
              >
                登録する
              </button>
            </div>
          </div>
        )}

        {/* 地図凡例 */}
        <div
          className="map-legend"
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            fontSize: '12px'
          }}
        >
          <b>凡例:</b>

          <span>
            <i
              className="legend-dot"
              style={{ background: pinColors['避難所'] }}
            />
            避難所
          </span>

          <span>
            <i
              className="legend-dot"
              style={{ background: pinColors['井戸'] }}
            />
            井戸
          </span>

          <span>
            <i
              className="legend-dot"
              style={{ background: pinColors['自販機'] }}
            />
            自販機
          </span>

          <span>
            <i
              className="legend-dot"
              style={{
                background: pinColors['指定物資置き場']
              }}
            />
            物資置き場
          </span>

          <span>
            <i
              className="legend-dot"
              style={{ background: pinColors['通行注意'] }}
            />
            危険・障害
          </span>
        </div>
      </div>

      {/* ピン詳細ダイアログ / カード */}
      {selected && (
        <div
          className="pin-detail"
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
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            border: '1px solid #cbd5e1',
            zIndex: 600,
          }}
        >
          <button
            className="modal-close"
            onClick={() => setSelected(null)}
            aria-label="閉じる"
          >
            <X size={18} />
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px'
            }}
          >
            <span
              className="pin-type"
              style={{
                color: pinColors[selected.type] || '#2563eb',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              ● {selected.type}
            </span>

            {/* 8. リアルタイム情報表示: 12時間以内 */}
            {isWithin12Hours(selected.created_at) && (
              <span
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}
              >
                🟢 12時間以内
              </span>
            )}
          </div>

          <h3
            style={{
              margin: '4px 0 8px',
              fontSize: '18px',
              color: '#0f172a'
            }}
          >
            {selected.title}
          </h3>

          {selected.content && (
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '14px',
                color: '#334155',
                lineHeight: 1.5,
                background: '#f8fafc',
                padding: '10px',
                borderRadius: '8px'
              }}
            >
              {selected.content}
            </p>
          )}

          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>
              投稿者：<b>{selected.author}</b>
            </span>

            {/* 3-1-4 認証マークのみ表示 */}
            {selected.author_is_verified && (
              <img
                src="/ninsyou.png"
                alt="認証済み"
                style={{
                  height: '16px',
                  width: 'auto'
                }}
                title="本人確認済みユーザー"
              />
            )}
          </div>

          {/* 9. 「正しい〇」「異なる✕」ボタンおよび件数表示 */}
          <div
            style={{
              background: '#f1f5f9',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '14px'
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#475569',
                marginBottom: '8px'
              }}
            >
              現地の情報確認（※投稿地点から2km以内のユーザーのみ投票可能）
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px'
              }}
            >
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
                正しい 〇 ({selected.correct_count || 0})
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
                異なる ✕ ({selected.different_count || 0})
              </button>
            </div>
          </div>

          {/* 9-2 投票時追加入力ダイアログ / フォーム */}
          {votingType && (
            <div
              style={{
                background: '#fff',
                border: '2px solid #3b82f6',
                padding: '14px',
                borderRadius: '10px',
                marginBottom: '14px'
              }}
            >
              <strong
                style={{
                  fontSize: '13px',
                  color: '#1e3a8a',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                「
                {votingType === 'correct'
                  ? '正しい〇'
                  : '異なる✕'}
                」の補足情報を追加
              </strong>

              <textarea
                placeholder="補足コメント（例：〇〇時に確認。水量は十分ありました）"
                value={voteComment}
                onChange={(e) => setVoteComment(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}
              />

              <div style={{ marginBottom: '10px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={16} />
                  写真・ファイルを添えて送信

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                  />
                </label>

                {votePhoto && (
                  <img
                    src={votePhoto}
                    alt="添付プレビュー"
                    style={{
                      height: '50px',
                      marginTop: '4px',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  className="secondary-button"
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px'
                  }}
                  onClick={() => setVotingType(null)}
                >
                  キャンセル
                </button>

                <button
                  className="primary-button"
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px'
                  }}
                  onClick={handleVoteSubmit}
                >
                  評価・補足を送信
                </button>
              </div>
            </div>
          )}

          {/* 過去の確認・補足情報の蓄積表示（最新が上） */}
          {selected.vote_details &&
            selected.vote_details.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <h4
                  style={{
                    fontSize: '12px',
                    color: '#475569',
                    margin: '0 0 6px'
                  }}
                >
                  確認・補足情報の履歴（最新順）
                </h4>

                <div
                  style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                >
                  {selected.vote_details.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        fontSize: '12px',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '6px',
                        marginBottom: '6px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#64748b'
                        }}
                      >
                        <span>
                          <b>{v.user_name}</b>{' '}
                          (
                          {v.vote_type === 'correct'
                            ? '〇正しい'
                            : '✕異なる'}
                          )
                        </span>

                        <small>
                          {new Date(
                            v.created_at
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                      </div>

                      {v.comment && (
                        <div
                          style={{
                            color: '#1e293b',
                            marginTop: '2px'
                          }}
                        >
                          {v.comment}
                        </div>
                      )}

                      {v.file_url && (
                        <img
                          src={v.file_url}
                          alt="写真"
                          style={{
                            maxHeight: '60px',
                            marginTop: '4px',
                            borderRadius: '4px'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 12-2 避難所への情報投稿機能 (避難所ピンのみ) */}
          {selected.type === '避難所' && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '12px',
                borderRadius: '10px',
                marginBottom: '14px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <strong
                  style={{
                    fontSize: '13px',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Users size={16} />
                  避難所の現地情報
                </strong>

                <button
                  className="text-button"
                  style={{
                    fontSize: '12px',
                    color: '#15803d',
                    fontWeight: 'bold'
                  }}
                  onClick={() =>
                    setShowShelterForm(!showShelterForm)
                  }
                >
                  {showShelterForm
                    ? '閉じる'
                    : '+ 現状を投稿する(2km以内)'}
                </button>
              </div>

              {showShelterForm && (
                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <input
                    type="text"
                    placeholder="避難所人数 (例: 約80名)"
                    value={shelterPeople}
                    onChange={(e) =>
                      setShelterPeople(e.target.value)
                    }
                    style={{
                      padding: '6px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1'
                    }}
                  />

                  <input
                    type="text"
                    placeholder="男女比・年齢層 (例: 男4:女6, 高齢者多数)"
                    value={shelterGender}
                    onChange={(e) =>
                      setShelterGender(e.target.value)
                    }
                    style={{
                      padding: '6px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1'
                    }}
                  />

                  <textarea
                    placeholder="設備の詳細 (例: 水道使用可、暖房完備、おむつ不足)"
                    value={shelterFacility}
                    onChange={(e) =>
                      setShelterFacility(e.target.value)
                    }
                    rows={2}
                    style={{
                      padding: '6px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1'
                    }}
                  />

                  <button
                    className="primary-button"
                    style={{
                      fontSize: '12px',
                      padding: '6px'
                    }}
                    onClick={handleShelterReportSubmit}
                  >
                    避難所情報を更新・保存
                  </button>
                </div>
              )}

              {/* 過去の避難所情報蓄積（最新順表示） */}
              {selected.shelter_reports &&
                selected.shelter_reports.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <small
                      style={{
                        color: '#15803d',
                        fontWeight: 'bold'
                      }}
                    >
                      報告履歴 (最新順):
                    </small>

                    <div
                      style={{
                        maxHeight: '120px',
                        overflowY: 'auto',
                        background: '#fff',
                        borderRadius: '6px',
                        padding: '6px',
                        marginTop: '4px',
                        border: '1px solid #dcfce7'
                      }}
                    >
                      {selected.shelter_reports.map((sr) => (
                        <div
                          key={sr.id}
                          style={{
                            fontSize: '12px',
                            borderBottom: '1px dashed #e2e8f0',
                            paddingBottom: '4px',
                            marginBottom: '4px'
                          }}
                        >
                          <div
                            style={{
                              color: '#475569',
                              fontSize: '11px'
                            }}
                          >
                            <b>{sr.user_name}</b>{' '}
                            (
                            {new Date(
                              sr.created_at
                            ).toLocaleString()}
                            )
                          </div>

                          {sr.people_count && (
                            <div>
                              人数: {sr.people_count}
                            </div>
                          )}

                          {sr.gender_ratio && (
                            <div>
                              男女比: {sr.gender_ratio}
                            </div>
                          )}

                          {sr.facility_details && (
                            <div>
                              設備: {sr.facility_details}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* 10. 同じ場所への複数投稿蓄積表示 */}
          {selected.sub_posts &&
            selected.sub_posts.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <strong
                  style={{
                    fontSize: '12px',
                    color: '#334155'
                  }}
                >
                  この場所に関する追加情報履歴（最新順）
                </strong>

                <div
                  style={{
                    maxHeight: '100px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    padding: '6px',
                    borderRadius: '6px',
                    marginTop: '4px'
                  }}
                >
                  {selected.sub_posts.map((sp) => (
                    <div
                      key={sp.id}
                      style={{
                        fontSize: '12px',
                        paddingBottom: '4px',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <span
                        style={{ color: '#64748b' }}
                      >
                        {sp.user_name}:{' '}
                      </span>
                      <span>{sp.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* ピン操作ボタン */}
          <div
            className="pin-actions"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '10px'
            }}
          >
            <button
              type="button"
              className="text-button"
              style={{
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={() => setReportTarget(selected)}
            >
              <Flag size={14} />
              このピンを通報
            </button>

            {role === '管理者' && (
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  if (
                    window.confirm(
                      'このピンを削除しますか？'
                    )
                  ) {
                    deleteMapPin(String(selected.id))
                    setSelected(null)
                    refreshPins()
                    onNotice(
                      '管理者権限でピンを削除しました'
                    )
                  }
                }}
              >
                <Trash2 size={14} />
                ピンを削除
              </button>
            )}
          </div>
        </div>
      )}

      {/* 通報モーダル */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType="map_pin"
          targetId={String(reportTarget.id)}
          targetTitle={reportTarget.title}
          targetAuthorName={reportTarget.author}
          onReportSuccess={() => {
            onNotice('ピンの通報を受け付けました')
            refreshPins()
          }}
        />
      )}
    </div>
  )
}