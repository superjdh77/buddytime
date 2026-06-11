import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, onValue, update, serverTimestamp } from 'firebase/database'
import { getProfile } from '../utils/auth'
import { getScoreLabel } from '../data/courses'

const EMOJIS = ['👏','🔥','😱','🎉','💪','🦅']

export default function WatchLive() {
  const { roundId } = useParams()
  const navigate = useNavigate()
  const profile = getProfile()
  const [round, setRound] = useState(null)
  const [viewHole, setViewHole] = useState(null)
  const [lastReaction, setLastReaction] = useState(null)

  useEffect(() => {
    return onValue(ref(db, `rounds/${roundId}`), snap => {
      if (!snap.exists()) return
      const data = snap.val()
      setRound(data)
      // 처음 로드시 현재 홀로 이동
      if (viewHole === null) setViewHole(data.currentHole || 0)
    })
  }, [roundId])

  if (!round) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0D1B3E]">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-spin">⛳</div>
        <p className="text-gray-400 text-sm">로딩 중...</p>
      </div>
    </div>
  )

  const hole = viewHole ?? round.currentHole ?? 0
  const par = round.holePars?.[hole] ?? 4
  const score = round.scores?.[hole] || { strokes: 0, putts: 0 }
  const diff = score.strokes > 0 ? score.strokes - par : null
  const label = diff !== null ? getScoreLabel(diff) : null

  // 합계
  let totalStrokes = 0, totalPar = 0
  Object.entries(round.scores || {}).forEach(([i, s]) => {
    if (s.strokes > 0) { totalStrokes += s.strokes; totalPar += round.holePars?.[i] ?? 4 }
  })
  const totalDiff = totalStrokes > 0 ? totalStrokes - totalPar : null
  const holesPlayed = Object.values(round.scores || {}).filter(s => s.strokes > 0).length

  async function sendReaction(emoji) {
    if (!profile) {
      alert('반응을 보내려면 로그인이 필요합니다!')
      return
    }
    const reactor = profile.name
    await update(ref(db, `rounds/${roundId}/reactions/${hole}/${emoji}`), { [reactor]: true })
    setLastReaction(emoji)
    setTimeout(() => setLastReaction(null), 1500)
  }

  // 리액션 집계 (이 홀)
  const holeReactions = round.reactions?.[hole] || {}
  const reactionCounts = {}
  Object.entries(holeReactions).forEach(([emoji, names]) => {
    reactionCounts[emoji] = Object.keys(names || {}).length
  })

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      {/* 헤더 */}
      <div className="bg-[#162449] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black"
            style={{ backgroundColor: round.playerColor }}>
            {round.playerName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              {round.isLive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              <p className="text-white font-bold text-sm">{round.playerName}</p>
              {round.isLive ? (
                <span className="text-red-400 text-xs font-bold">LIVE</span>
              ) : (
                <span className="text-gray-500 text-xs">종료됨</span>
              )}
            </div>
            <p className="text-gray-400 text-xs">{round.courseName} · {holesPlayed}/{round.totalHoles}홀</p>
          </div>
          {totalDiff !== null && (
            <div className="text-right">
              <p className={`font-black text-xl ${
                totalDiff < 0 ? 'text-[#E8B84B]' : totalDiff === 0 ? 'text-white' : 'text-red-400'
              }`}>
                {totalDiff === 0 ? 'E' : totalDiff > 0 ? `+${totalDiff}` : totalDiff}
              </p>
              <p className="text-gray-400 text-xs">{totalStrokes}타</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* 홀 네비게이션 */}
        <div className="bg-[#162449] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setViewHole(Math.max(0, hole - 1))}
              disabled={hole === 0}
              className="w-9 h-9 rounded-xl bg-[#0D1B3E] text-white text-xl flex items-center justify-center disabled:opacity-30">‹</button>
            <div className="text-center">
              <p className="text-white font-black text-2xl">{hole + 1}번 홀</p>
              <p className="text-[#4A9FE0] text-sm font-bold">Par {par}</p>
              {round.isLive && hole === round.currentHole && (
                <p className="text-red-400 text-xs">← 지금 플레이 중</p>
              )}
            </div>
            <button onClick={() => setViewHole(Math.min(round.totalHoles - 1, hole + 1))}
              disabled={hole === round.totalHoles - 1}
              className="w-9 h-9 rounded-xl bg-[#0D1B3E] text-white text-xl flex items-center justify-center disabled:opacity-30">›</button>
          </div>

          {/* 홀 도트 */}
          <div className="flex gap-1 justify-center flex-wrap">
            {Array.from({ length: round.totalHoles }, (_, i) => {
              const done = (round.scores?.[i]?.strokes || 0) > 0
              const isCurrent = i === round.currentHole && round.isLive
              return (
                <button key={i} onClick={() => setViewHole(i)}
                  className={`w-5 h-5 rounded-full text-xs transition-all
                    ${i === hole ? 'ring-2 ring-white scale-110' : ''}
                    ${isCurrent ? 'bg-red-500 text-white' :
                      done ? 'bg-[#4A9FE0] text-white' : 'bg-[#0D1B3E] text-gray-600'}`}>
                </button>
              )
            })}
          </div>
        </div>

        {/* 이 홀 스코어 */}
        <div className="bg-[#162449] rounded-2xl p-5 text-center">
          {score.strokes > 0 ? (
            <>
              <p className="font-black text-7xl mb-2" style={{ color: label?.color || 'white' }}>
                {score.strokes}
              </p>
              {label && (
                <p className="font-black text-xl mb-1" style={{ color: label.color }}>
                  {label.emoji} {label.label}
                </p>
              )}
              <p className="text-[#60A5FA] text-sm">🔵 퍼팅 {score.putts || 0}개</p>
            </>
          ) : (
            <p className="text-gray-500 text-xl py-4">아직 스코어 없음</p>
          )}
        </div>

        {/* 전체 스코어카드 */}
        <div className="bg-[#162449] rounded-2xl p-4">
          <p className="text-white font-bold text-sm mb-3">전체 스코어</p>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {Array.from({ length: round.totalHoles }, (_, i) => {
                const s = round.scores?.[i]
                const p = round.holePars?.[i] ?? 4
                const d = s?.strokes > 0 ? s.strokes - p : null
                const color = d === null ? '#374151' :
                  d <= -2 ? '#E8B84B' : d === -1 ? '#10B981' :
                  d === 0 ? '#fff' : d === 1 ? '#F97316' : '#EF4444'
                return (
                  <button key={i} onClick={() => setViewHole(i)}
                    className={`flex flex-col items-center rounded-lg px-1.5 py-1 min-w-[28px] transition-all
                      ${i === hole ? 'bg-[#4A9FE0]/30 ring-1 ring-[#4A9FE0]' : ''}`}>
                    <span className="text-gray-500 text-xs">{i+1}</span>
                    <span className="font-bold text-sm" style={{ color }}>
                      {s?.strokes || '·'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 리액션 보내기 */}
        <div className="bg-[#162449] rounded-2xl p-4">
          <p className="text-gray-400 text-xs mb-3">응원 반응 보내기 👇</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {EMOJIS.map(emoji => {
              const cnt = reactionCounts[emoji] || 0
              return (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className={`flex flex-col items-center bg-[#0D1B3E] rounded-xl px-3 py-2 transition-all active:scale-90
                    ${lastReaction === emoji ? 'ring-2 ring-[#4A9FE0] scale-110' : ''}`}>
                  <span className="text-2xl">{emoji}</span>
                  {cnt > 0 && <span className="text-[#4A9FE0] text-xs font-bold">{cnt}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 메모 */}
        {round.note && (
          <div className="bg-[#162449] rounded-xl px-4 py-3">
            <p className="text-[#E8B84B] text-sm">"{round.note}"</p>
            <p className="text-gray-500 text-xs mt-0.5">— {round.playerName}</p>
          </div>
        )}

        {/* 현재 홀로 이동 */}
        {round.isLive && hole !== round.currentHole && (
          <button onClick={() => setViewHole(round.currentHole)}
            className="w-full bg-red-900/30 text-red-400 font-bold py-3 rounded-xl text-sm border border-red-900/50">
            🔴 현재 플레이 중인 홀로 이동 ({round.currentHole + 1}번)
          </button>
        )}

        {/* 내 라운드 시작 안내 */}
        {!getProfile() && (
          <div className="text-center pb-4">
            <p className="text-gray-500 text-xs mb-2">나도 라운드 기록을 남기고 싶다면?</p>
            <button onClick={() => navigate('/onboarding')}
              className="text-[#4A9FE0] text-sm underline">
              버디타임 시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
