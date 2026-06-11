// 로컬 프로필 관리 (서버 인증 없음, 이름+PIN 방식)
const KEY = 'buddytime_profile'

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function saveProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearProfile() {
  localStorage.removeItem(KEY)
}

export function isLoggedIn() {
  return !!getProfile()
}

// 라운드 히스토리 (로컬 백업)
const HISTORY_KEY = 'buddytime_history_v2'

export function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

export function saveRoundToHistory(round) {
  const history = getLocalHistory()
  const existing = history.findIndex(r => r.id === round.id)
  if (existing >= 0) {
    history[existing] = round
  } else {
    history.unshift(round)
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
}

// 8자리 고유 ID 생성
export function generateId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// 그룹 코드 생성 (6자리)
export function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
