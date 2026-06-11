// 간이 핸디캡 계산 (최근 10라운드 기준, USGA 방식 단순화)
export function calcHandicap(rounds) {
  if (!rounds || rounds.length === 0) return null

  // 18홀 완료된 라운드만
  const full = rounds
    .filter(r => r.totalHoles === 18 && r.totalStrokes > 0)
    .slice(0, 20)  // 최근 20라운드

  if (full.length < 3) return null

  // 각 라운드의 핸디캡 인덱스 (스코어 - 코스 파)
  const diffs = full.map(r => r.totalStrokes - r.totalPar)

  // 라운드 수에 따라 사용할 최저 스코어 수
  const count = Math.min(full.length, 20)
  const useCount = count >= 20 ? 8 : count >= 15 ? 6 : count >= 10 ? 4 : count >= 6 ? 3 : 1

  const sorted = [...diffs].sort((a, b) => a - b)
  const best = sorted.slice(0, useCount)
  const avg = best.reduce((a, b) => a + b, 0) / useCount

  return Math.max(0, Math.round(avg * 10) / 10)
}

// 퍼팅 수준 평가
export function puttLevel(totalPutts, holes) {
  if (holes < 9) return null
  const per18 = (totalPutts / holes) * 18
  if (per18 <= 29) return { label: 'PGA 투어급', emoji: '🏆', color: '#E8B84B' }
  if (per18 <= 32) return { label: '싱글 수준', emoji: '⭐', color: '#4A9FE0' }
  if (per18 <= 36) return { label: '아마추어 평균', emoji: '👍', color: '#10B981' }
  return { label: '연습 필요', emoji: '💪', color: '#9CA3AF' }
}

// 스코어 통계 요약
export function calcStats(rounds) {
  if (!rounds.length) return null
  const fullRounds = rounds.filter(r => r.totalStrokes > 0)
  if (!fullRounds.length) return null

  const scores = fullRounds.map(r => r.totalStrokes - r.totalPar)
  const best = Math.min(...scores)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const totalBirdies = fullRounds.reduce((a, r) => a + (r.birdies || 0), 0)
  const totalEagles = fullRounds.reduce((a, r) => a + (r.eagles || 0), 0)
  const totalRounds = fullRounds.length

  return { best, avg: Math.round(avg * 10) / 10, totalBirdies, totalEagles, totalRounds }
}
