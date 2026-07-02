// 로컬 프로필 관리 (서버 인증 없음, 이메일+PIN 방식)
import { db } from '../firebase'
import { ref, get, set as fbSet } from 'firebase/database'

const KEY = 'buddytime_profile'

// 이메일을 RTDB 키로 쓸 수 있게 변환 (. # $ [ ] / 는 경로에 못 씀)
export function emailKey(email) {
  return email.trim().toLowerCase().replace(/[.#$\[\]\/]/g, '_')
}

const LAST_EMAIL_KEY = 'buddytime_last_email'

export function getRememberedEmail() {
  return localStorage.getItem(LAST_EMAIL_KEY) || ''
}

export function setRememberedEmail(email) {
  localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase())
}

// 이메일로 계정 조회 (가입 여부 확인)
export async function findAccount(email) {
  const snap = await get(ref(db, `users/${emailKey(email)}`))
  return snap.exists() ? snap.val() : null
}

// 신규 가입: 이메일 키로 Firebase에 계정 생성
export async function registerAccount({ email, pin, name, color }) {
  const account = {
    email: email.trim().toLowerCase(),
    pin,
    name: name.trim(),
    color,
    groups: [],
    createdAt: Date.now(),
  }
  await fbSet(ref(db, `users/${emailKey(email)}`), account)
  setRememberedEmail(email)
  saveProfile(account)
  return account
}

// 로그인: 이메일+PIN 확인 후 로컬 프로필 갱신 (기록은 이메일 기준으로 누적)
export async function loginAccount(email, pin) {
  const cached = getProfile()
  if (cached && cached.email === email.trim().toLowerCase()) {
    return { ok: true, account: cached }
  }
  const account = await Promise.race([
    findAccount(email),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
  ])
  if (!account) return { ok: false, reason: 'not_found' }
  saveProfile(account)
  return { ok: true, account }
}

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

// 세션 확인 여부 (앱을 완전히 닫았다 열면 초기화됨 — sessionStorage)
const SESSION_CONFIRM_KEY = 'buddytime_session_confirmed'

export function isSessionConfirmed() {
  try { return sessionStorage.getItem(SESSION_CONFIRM_KEY) === '1' } catch { return false }
}

export function setSessionConfirmed() {
  try { sessionStorage.setItem(SESSION_CONFIRM_KEY, '1') } catch {}
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

// 로그인 후 원래 가려던 페이지로 돌려보내기 (방 링크로 들어왔는데 로그인이 안 된 경우 등)
const REDIRECT_KEY = 'buddytime_redirect_after_login'

export function setRedirectAfterLogin(path) {
  localStorage.setItem(REDIRECT_KEY, path)
}

export function getRedirectAfterLogin() {
  return localStorage.getItem(REDIRECT_KEY) || null
}

export function clearRedirectAfterLogin() {
  localStorage.removeItem(REDIRECT_KEY)
}

// 방(룸) 코드 생성 (6자리) — 같이 라운드하는 사람들이 모이는 방
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
