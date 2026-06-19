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

// 진행 중인 라운드 ID (앱 종료/재접속 시 이어하기용)
const ACTIVE_ROUND_KEY = 'buddytime_active_round'

export function setActiveRound(roundId) {
  localStorage.setItem(ACTIVE_ROUND_KEY, roundId)
}

export function getActiveRound() {
  return localStorage.getItem(ACTIVE_ROUND_KEY) || null
}

export function clearActiveRound() {
  localStorage.removeItem(ACTIVE_ROUND_KEY)
}

// 진행 중인 라운드 전체 데이터 로컬 백업
// 골프장은 신호가 약해서 Firebase 저장이 실패/지연될 수 있음 → 로컬에 항상 최신 상태를 남겨서
// 앱이 강제 종료돼도 다음에 열 때 이어할 수 있게 함 (서버 동기화는 되는대로 재시도)
const ROUND_BACKUP_KEY = 'buddytime_round_backup'

export function saveRoundBackup(round) {
  try {
    localStorage.setItem(ROUND_BACKUP_KEY, JSON.stringify(round))
  } catch {}
}

export function getRoundBackup(roundId) {
  try {
    const data = JSON.parse(localStorage.getItem(ROUND_BACKUP_KEY))
    if (data && (!roundId || data.id === roundId)) return data
    return null
  } catch {
    return null
  }
}

export function clearRoundBackup() {
  localStorage.removeItem(ROUND_BACKUP_KEY)
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
