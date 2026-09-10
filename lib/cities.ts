export interface CityInfo {
  prefecture: string
  city: string
  lat: number
  lng: number
}

// 主要な市区町村と中心座標のデータ
export const CITIES_DATA: CityInfo[] = [
  // 鳥取県
  { prefecture: '鳥取県', city: '米子市', lat: 35.4281, lng: 133.3308 },
  { prefecture: '鳥取県', city: '鳥取市', lat: 35.5011, lng: 134.2351 },
  { prefecture: '鳥取県', city: '境港市', lat: 35.5401, lng: 133.2327 },
  { prefecture: '鳥取県', city: '倉吉市', lat: 35.4319, lng: 133.8247 },

  // 東京都
  { prefecture: '東京都', city: '港区', lat: 35.6581, lng: 139.7515 },
  { prefecture: '東京都', city: '渋谷区', lat: 35.664, lng: 139.6982 },
  { prefecture: '東京都', city: '新宿区', lat: 35.6938, lng: 139.7034 },
  { prefecture: '東京都', city: '千代田区', lat: 35.694, lng: 139.7536 },
  { prefecture: '東京都', city: '中央区', lat: 35.6707, lng: 139.7716 },

  // 石川県
  { prefecture: '石川県', city: '輪島市', lat: 37.39, lng: 136.9064 },
  { prefecture: '石川県', city: '珠洲市', lat: 37.4386, lng: 137.2604 },
  { prefecture: '石川県', city: '能登町', lat: 37.3075, lng: 137.1478 },
  { prefecture: '石川県', city: '金沢市', lat: 36.5613, lng: 136.6562 },
  { prefecture: '石川県', city: '七尾市', lat: 37.0426, lng: 136.9664 },

  // 熊本県
  { prefecture: '熊本県', city: '熊本市', lat: 32.7898, lng: 130.7417 },
  { prefecture: '熊本県', city: '益城町', lat: 32.7916, lng: 130.8199 },
  { prefecture: '熊本県', city: '八代市', lat: 32.5064, lng: 130.6019 },

  // 大阪府
  { prefecture: '大阪府', city: '大阪市', lat: 34.6937, lng: 135.5023 },
  { prefecture: '大阪府', city: '堺市', lat: 34.5733, lng: 135.483 },
]

export const PREFECTURES = Array.from(new Set(CITIES_DATA.map(c => c.prefecture)))

export function getCitiesByPrefecture(pref: string): CityInfo[] {
  return CITIES_DATA.filter(c => c.prefecture === pref)
}

export function findCity(pref: string, city: string): CityInfo | undefined {
  return CITIES_DATA.find(c => c.prefecture === pref && c.city === city)
}

/**
 * 2地点の経度・緯度から距離(km)を計算する（Haversine formula）
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球の半径(km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

/**
 * フル住所文字列（例: "鳥取県米子市河井町" や "鳥取県米子市" など）から都道府県と市区町村を抽出・マッチングする
 */
export function parseLocation(locationStr: string): { prefecture: string; city: string; lat: number; lng: number } {
  if (!locationStr) return { prefecture: '鳥取県', city: '米子市', lat: 35.4281, lng: 133.3308 }

  for (const item of CITIES_DATA) {
    if (locationStr.includes(item.prefecture) && locationStr.includes(item.city)) {
      return item
    }
    if (locationStr.includes(item.city)) {
      return item
    }
  }

  // デフォルト
  return { prefecture: '鳥取県', city: '米子市', lat: 35.4281, lng: 133.3308 }
}
