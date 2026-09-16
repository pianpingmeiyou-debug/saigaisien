'use client'
/** このファイルの役割と主要な画面動作を、実装の近くにコメントで説明しています。 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, LocateFixed, MapPin, RotateCcw, Search, Trash2, X, Flag, Camera, Eye } from 'lucide-react'
import { getMapPins, deleteMapPin, MapPinItem } from '@/lib/store'
import ReportModal from '@/components/report-modal'

const pinColors: Record<MapPinItem['type'], string> = {
  避難所: '#2563eb',
  指定物資置き場: '#16a34a',
  求援: '#f59e0b',
  通行注意: '#dc2626',
  道路通行不能: '#dc2626',
  土砂崩れ: '#dc2626',
  倒壊: '#dc2626',
  通行止め: '#dc2626',
  浸水: '#dc2626',
}

function icon(type: MapPinItem['type']) {
  return L.divIcon({
    className: 'custom-pin',
    html: `<span style="background:${pinColors[type] || '#dc2626'}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>`,
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

function MapControls({ onNotice }: { onNotice: (message: string) => void }) {
  const map = useMap()
  return (
    <div className="map-controls" aria-label="地図操作">
      <button
        type="button"
        aria-label="現在地へ移動"
        onClick={() => {
          map.locate({ setView: true, maxZoom: 13 })
          onNotice('現在地を確認しています')
        }}
      >
        <LocateFixed size={17} />
      </button>
      <button type="button" aria-label="地図を初期位置に戻す" onClick={() => map.setView([35.68, 139.69], 5)}>
        <RotateCcw size={17} />
      </button>
    </div>
  )
}

function ClickCapture({ onPick }: { onPick: (point: { lat: number; lng: number }) => void }) {
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
  const [pins, setPins] = useState<MapPinItem[]>([])
  const [selected, setSelected] = useState<MapPinItem | null>(null)
  const [reportTarget, setReportTarget] = useState<MapPinItem | null>(null)
  const [confirmingPoint, setConfirmingPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'すべて' | MapPinItem['type']>('すべて')

  const refreshPins = () => {
    const loaded = getMapPins().filter(p => p.status !== 'hidden' && p.status !== 'deleted')
    setPins(loaded)
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

  const pick = (point: { lat: number; lng: number }) => {
    setConfirmingPoint(point)
    onNotice('設置位置を確認してください')
  }

  return (
    <div className="map-page" style={{ position: 'relative', width: '100%' }}>
      {/* ツールバー */}
      <div className="map-toolbar" style={{ marginBottom: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div className="search-input" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="地名・施設名・投稿内容・投稿者を検索"
          />
        </div>
        <div className="map-filters" aria-label="ピンの絞り込み">
          <button className={filter === 'すべて' ? 'active' : ''} onClick={() => setFilter('すべて')}>
            すべて
          </button>
          <button className={filter === '避難所' ? 'active' : ''} onClick={() => setFilter('避難所')}>
            避難所
          </button>
          <button className={filter === '指定物資置き場' ? 'active' : ''} onClick={() => setFilter('指定物資置き場')}>
            物資置き場
          </button>
          <button className={filter === '通行注意' ? 'active' : ''} onClick={() => setFilter('通行注意')}>
            交通・被害
          </button>
        </div>
      </div>

      {/* 地図キャンバス */}
      <div className="map-canvas real-map" style={{ height: '540px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
        <MapContainer center={[35.4281, 133.3308]} zoom={11} scrollWheelZoom className="leaflet-map">
          <MapSizeFix />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapControls onNotice={onNotice} />
          <ClickCapture onPick={pick} />

          {confirmingPoint && (
            <Marker position={[confirmingPoint.lat, confirmingPoint.lng]} icon={icon('通行注意')}>
              <Popup>この位置にピンを設置しますか？</Popup>
            </Marker>
          )}

          {visiblePins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={icon(pin.type)}
              eventHandlers={{ click: () => setSelected(pin) }}
            >
              <Popup>
                <b>{pin.title}</b>
                <br />
                {pin.type} {pin.verified ? '（自治体確認済み）' : ''}
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* ピン設置確認ダイアログ */}
        {confirmingPoint && (
          <div className="pin-confirm" role="dialog" aria-label="ピン設置の確認">
            <span className="preview-icon">
              <MapPin size={18} />
            </span>
            <div>
              <b>この位置にピンを設置しますか？</b>
              <span>選択地点：緯度 {confirmingPoint.lat.toFixed(4)} / 経度 {confirmingPoint.lng.toFixed(4)}</span>
            </div>
            <div className="pin-confirm-actions">
              <button type="button" className="secondary-button" onClick={() => setConfirmingPoint(null)}>
                キャンセル
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const point = confirmingPoint
                  setConfirmingPoint(null)
                  router.push(
                    `/map-pin/new?lat=${point.lat}&lng=${point.lng}&type=${encodeURIComponent('通行注意')}`
                  )
                }}
              >
                はい、情報を入力する
              </button>
            </div>
          </div>
        )}

        {/* 凡例 */}
        <div className="map-legend">
          <b>地図表示</b>
          <span>
            <i className="legend-dot blue" />
            避難所
          </span>
          <span>
            <i className="legend-dot green" />
            物資置き場
          </span>
          <span>
            <i className="legend-dot red" />
            交通・危険
          </span>
        </div>

        <div className="map-caution">
          <MapPin size={16} />
          地図上の任意の地点をクリックして、危険箇所や避難情報を投稿できます。
        </div>
      </div>

      {/* ピン詳細カード */}
      {selected && (
        <div
          className="pin-detail"
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: '#ffffff',
            padding: '20px',
            borderRadius: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            border: '1px solid #cbd5e1',
            maxWidth: '380px',
            width: '90%',
            zIndex: 600,
          }}
        >
          <button className="modal-close" onClick={() => setSelected(null)} aria-label="閉じる">
            <X size={17} />
          </button>
          <span className="pin-type" style={{ color: pinColors[selected.type], fontWeight: 700, fontSize: '13px' }}>
            ● {selected.type}
          </span>
          <h3 style={{ margin: '8px 0 6px', fontSize: '17px', color: '#0f172a' }}>{selected.title}</h3>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
            {selected.content}
          </p>

          {/* 添付画像表示 (写真アップロード修正・表示) */}
          {selected.photo && (
            <div style={{ margin: '10px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <img
                src={selected.photo}
                alt={selected.title}
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  // 画像読み込みエラー時のフォールバック
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
            投稿者：<b>{selected.author}</b> {selected.verified ? '（自治体確認済み）' : ''}
          </div>

          <div className="pin-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <button
              type="button"
              className="text-button"
              style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => setReportTarget(selected)}
            >
              <Flag size={14} /> このピンを通報
            </button>

            {role === '管理者' && (
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  if (window.confirm('このピンを削除しますか？')) {
                    deleteMapPin(String(selected.id))
                    setSelected(null)
                    refreshPins()
                    onNotice('管理者権限でピンを削除しました')
                  }
                }}
              >
                <Trash2 size={14} /> ピンを削除
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
