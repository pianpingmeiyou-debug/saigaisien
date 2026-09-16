export interface CityInfo {
  prefecture: string
  city: string
  lat: number
  lng: number
}

// 47都道府県主要市区町村データ
export const CITIES_DATA: CityInfo[] = [
  // 北海道・東北
  { prefecture: '北海道', city: '札幌市', lat: 43.0618, lng: 141.3545 },
  { prefecture: '北海道', city: '函館市', lat: 41.7687, lng: 140.7288 },
  { prefecture: '北海道', city: '旭川市', lat: 43.7706, lng: 142.3649 },
  { prefecture: '青森県', city: '青森市', lat: 40.8244, lng: 140.74 },
  { prefecture: '青森県', city: '八戸市', lat: 40.5123, lng: 141.4884 },
  { prefecture: '岩手県', city: '盛岡市', lat: 39.7036, lng: 141.1527 },
  { prefecture: '岩手県', city: '釜石市', lat: 39.276, lng: 141.8872 },
  { prefecture: '宮城県', city: '仙台市', lat: 38.2682, lng: 140.8694 },
  { prefecture: '宮城県', city: '石巻市', lat: 38.4344, lng: 141.303 },
  { prefecture: '秋田県', city: '秋田市', lat: 39.7186, lng: 140.1024 },
  { prefecture: '山形県', city: '山形市', lat: 38.2404, lng: 140.3633 },
  { prefecture: '福島県', city: '福島市', lat: 37.75, lng: 140.4678 },
  { prefecture: '福島県', city: 'いわき市', lat: 37.0505, lng: 140.8877 },
  { prefecture: '福島県', city: '郡山市', lat: 37.4005, lng: 140.3597 },

  // 関東
  { prefecture: '茨城県', city: '水戸市', lat: 36.3418, lng: 140.4468 },
  { prefecture: '茨城県', city: 'つくば市', lat: 36.0835, lng: 140.0766 },
  { prefecture: '栃木県', city: '宇都宮市', lat: 36.5658, lng: 139.8836 },
  { prefecture: '群馬県', city: '前橋市', lat: 36.3911, lng: 139.0608 },
  { prefecture: '群馬県', city: '高崎市', lat: 36.3225, lng: 139.0131 },
  { prefecture: '埼玉県', city: 'さいたま市', lat: 35.8617, lng: 139.6455 },
  { prefecture: '埼玉県', city: '川越市', lat: 35.9251, lng: 139.4858 },
  { prefecture: '千葉県', city: '千葉市', lat: 35.6074, lng: 140.1065 },
  { prefecture: '千葉県', city: '船橋市', lat: 35.6947, lng: 139.9826 },
  { prefecture: '東京都', city: '千代田区', lat: 35.694, lng: 139.7536 },
  { prefecture: '東京都', city: '中央区', lat: 35.6707, lng: 139.7716 },
  { prefecture: '東京都', city: '港区', lat: 35.6581, lng: 139.7515 },
  { prefecture: '東京都', city: '新宿区', lat: 35.6938, lng: 139.7034 },
  { prefecture: '東京都', city: '渋谷区', lat: 35.664, lng: 139.6982 },
  { prefecture: '東京都', city: '世田谷区', lat: 35.6466, lng: 139.6532 },
  { prefecture: '東京都', city: '八王子市', lat: 35.6554, lng: 139.3239 },
  { prefecture: '神奈川県', city: '横浜市', lat: 35.4437, lng: 139.638 },
  { prefecture: '神奈川県', city: '川崎市', lat: 35.5309, lng: 139.7029 },
  { prefecture: '神奈川県', city: '相模原市', lat: 35.5714, lng: 139.3732 },

  // 中部・北陸
  { prefecture: '新潟県', city: '新潟市', lat: 37.9026, lng: 139.0232 },
  { prefecture: '新潟県', city: '長岡市', lat: 37.4475, lng: 138.8513 },
  { prefecture: '富山県', city: '富山市', lat: 36.6953, lng: 137.2113 },
  { prefecture: '石川県', city: '金沢市', lat: 36.5613, lng: 136.6562 },
  { prefecture: '石川県', city: '輪島市', lat: 37.39, lng: 136.9064 },
  { prefecture: '石川県', city: '珠洲市', lat: 37.4386, lng: 137.2604 },
  { prefecture: '石川県', city: '能登町', lat: 37.3075, lng: 137.1478 },
  { prefecture: '石川県', city: '七尾市', lat: 37.0426, lng: 136.9664 },
  { prefecture: '福井県', city: '福井市', lat: 36.0652, lng: 136.2216 },
  { prefecture: '山梨県', city: '甲府市', lat: 35.6639, lng: 138.5684 },
  { prefecture: '長野県', city: '長野市', lat: 36.6513, lng: 138.181 },
  { prefecture: '長野県', city: '松本市', lat: 36.2381, lng: 137.972 },
  { prefecture: '岐阜県', city: '岐阜市', lat: 35.4233, lng: 136.7607 },
  { prefecture: '静岡県', city: '静岡市', lat: 34.9756, lng: 138.3828 },
  { prefecture: '静岡県', city: '浜松市', lat: 34.7108, lng: 137.7261 },
  { prefecture: '愛知県', city: '名古屋市', lat: 35.1815, lng: 136.9066 },
  { prefecture: '愛知県', city: '豊橋市', lat: 34.7692, lng: 137.3915 },
  { prefecture: '三重県', city: '津市', lat: 34.7303, lng: 136.5086 },
  { prefecture: '三重県', city: '四日市市', lat: 34.9652, lng: 136.6247 },

  // 近畿
  { prefecture: '滋賀県', city: '大津市', lat: 35.0045, lng: 135.8686 },
  { prefecture: '京都府', city: '京都市', lat: 35.0116, lng: 135.7681 },
  { prefecture: '大阪府', city: '大阪市', lat: 34.6937, lng: 135.5023 },
  { prefecture: '大阪府', city: '堺市', lat: 34.5733, lng: 135.483 },
  { prefecture: '兵庫県', city: '神戸市', lat: 34.6901, lng: 135.1955 },
  { prefecture: '兵庫県', city: '姫路市', lat: 34.8153, lng: 134.6853 },
  { prefecture: '奈良県', city: '奈良市', lat: 34.6851, lng: 135.8048 },
  { prefecture: '和歌山県', city: '和歌山市', lat: 34.226, lng: 135.1675 },

  // 中国・四国
  { prefecture: '鳥取県', city: '米子市', lat: 35.4281, lng: 133.3308 },
  { prefecture: '鳥取県', city: '鳥取市', lat: 35.5011, lng: 134.2351 },
  { prefecture: '鳥取県', city: '境港市', lat: 35.5401, lng: 133.2327 },
  { prefecture: '鳥取県', city: '倉吉市', lat: 35.4319, lng: 133.8247 },
  { prefecture: '島根県', city: '松江市', lat: 35.4723, lng: 133.0505 },
  { prefecture: '島根県', city: '出雲市', lat: 35.3669, lng: 132.7554 },
  { prefecture: '岡山県', city: '岡山市', lat: 34.6618, lng: 133.935 },
  { prefecture: '岡山県', city: '倉敷市', lat: 34.585, lng: 133.7722 },
  { prefecture: '広島県', city: '広島市', lat: 34.3853, lng: 132.4553 },
  { prefecture: '広島県', city: '福山市', lat: 34.4859, lng: 133.3627 },
  { prefecture: '山口県', city: '山口市', lat: 34.1858, lng: 131.4705 },
  { prefecture: '山口県', city: '下関市', lat: 33.9578, lng: 130.9415 },
  { prefecture: '徳島県', city: '徳島市', lat: 34.0658, lng: 134.5593 },
  { prefecture: '香川県', city: '高松市', lat: 34.3401, lng: 134.0433 },
  { prefecture: '愛媛県', city: '松山市', lat: 33.8416, lng: 132.7661 },
  { prefecture: '高知県', city: '高知市', lat: 33.5597, lng: 133.5311 },

  // 九州・沖縄
  { prefecture: '福岡県', city: '福岡市', lat: 33.5904, lng: 130.4017 },
  { prefecture: '福岡県', city: '北九州市', lat: 33.8835, lng: 130.8752 },
  { prefecture: '佐賀県', city: '佐賀市', lat: 33.2494, lng: 130.2988 },
  { prefecture: '長崎県', city: '長崎市', lat: 32.7448, lng: 129.8737 },
  { prefecture: '長崎県', city: '佐世保市', lat: 33.1799, lng: 129.7151 },
  { prefecture: '熊本県', city: '熊本市', lat: 32.7898, lng: 130.7417 },
  { prefecture: '熊本県', city: '益城町', lat: 32.7916, lng: 130.8199 },
  { prefecture: '熊本県', city: '八代市', lat: 32.5064, lng: 130.6019 },
  { prefecture: '大分県', city: '大分市', lat: 33.2382, lng: 131.6126 },
  { prefecture: '宮崎県', city: '宮崎市', lat: 31.9111, lng: 131.4239 },
  { prefecture: '鹿児島県', city: '鹿児島市', lat: 31.5602, lng: 130.5581 },
  { prefecture: '沖縄県', city: '那覇市', lat: 26.2124, lng: 127.6809 },
]

export const PREFECTURES: string[] = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

export function getCitiesByPrefecture(pref: string): CityInfo[] {
  const matched = CITIES_DATA.filter(c => c.prefecture === pref)
  if (matched.length > 0) return matched
  return [{ prefecture: pref, city: `${pref}中心部`, lat: 35.6895, lng: 139.6917 }]
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

  for (const pref of PREFECTURES) {
    if (locationStr.includes(pref)) {
      const cities = getCitiesByPrefecture(pref)
      return cities[0]
    }
  }

  return { prefecture: '鳥取県', city: '米子市', lat: 35.4281, lng: 133.3308 }
}
