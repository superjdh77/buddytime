import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, onValue } from 'firebase/database'

function totalDiffOf(round) {
  let strokes = 0, par = 0
  Object.entries(round?.scores || {}).forEach(([i, s]) => {
    if (s.strokes > 0) { strokes += s.strokes; par += round.holePars?.[i] ?? 4 }
  })
  if (strokes === 0) return null
  return { strokes, diff: strokes - par }
}

function Scorecard({ round }) {
  const totalHoles = round.totalHoles || 18
  return (
    <div className="space-y-2">
      {[0, 9].map(start => {
        const holesInRow = Math.min(9, totalHoles - start)
        if (holesInRow <= 0) return null
        return (
          <div key={start} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${holesInRow}, minmax(0, 1fr))` }}>
            {Array.from({ length: holesInRow }, (_, j) => {
              const i = start + j
              const s = round.scores?.[i]
              const p = round.holePars?.[i] ?? 4
              const d = s?.strokes > 0 ? s.strokes - p : null
              const color = d === null ? '#374151' :
                d <= -2 ? '#E8B84B' : d === -1 ? '#10B981' :
                d === 0 ? '#fff' : d === 1 ? '#F97316' : '#EF4444'
              return (
                <div key={i} className="flex flex-col items-center rounded-lg py-1">
                  <span className="text-gray-500 text-xs">{i+1}</span>
                  <span className="font-bold text-sm" style={{ color }}>
                    {s?.strokes || '·'}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function WatchRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(undefined)
  const [playerRounds, setPlayerRounds] = useState({})

  useEffect(() => {
    return onValue(ref(db, `rooms/${code}`), snap => {
      setRoom(snap.exists() ? snap.val() : null)
    })
  }, [code])

  const playersKey = room?.players ? Object.entries(room.players).map(([n, id]) => `${n}:${id}`).join(',') : ''

  useEffect(() => {
    if (!room?.players) return
    const unsubs = Object.entries(room.players).map(([name, roundId]) =>
      onValue(ref(db, `rounds/${roundId}`), snap => {
        if (snap.exists()) {
          setPlayerRounds(prev => ({ ...prev, [name]: snap.val() }))
        }
      })
    )
    return () => unsubs.forEach(u => u())
  }, [playersKey])

  if (room === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D1B3E]">
        <div className="text-4xl animate-spin">⛳</div>
      </div>
    )
  }

  if (room === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D1B3E] px-6 text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-white font-bold mb-2">방을 찾을 수 없습니다</p>
        <button onClick={() => navigate('/')} className="text-[#4A9FE0] text-sm underline mt-3">홈으로</button>
      </div>
    )
  }

  const playerNames = Object.keys(room.players || {})
  const galleryNames = Object.keys(room.gallery || {})

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      {/* 헤더 */}
      <div className="bg-[#162449] px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          {room.isLive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <p className="text-white font-bold text-sm">{room.hostName}님의 라운드</p>
          {room.isLive ? <span className="text-red-400 text-xs font-bold">LIVE</span> : <span className="text-gray-500 text-xs">종료됨</span>}
        </div>
        <p className="text-gray-400 text-xs">{room.courseName} · {room.totalHoles}홀 · 선수 {playerNames.length}명</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* 갤러리 명단 */}
        {galleryNames.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-500 text-xs">👀 구경 중:</span>
            {galleryNames.map(name => (
              <span key={name} className="text-gray-500 text-xs">{name}</span>
            ))}
          </div>
        )}

        {/* 선수별 스코어카드 */}
        {playerNames.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-10">아직 참여한 선수가 없습니다</p>
        )}
        {playerNames.map(name => {
          const round = playerRounds[name]
          if (!round) return (
            <div key={name} className="bg-[#162449] rounded-2xl p-4">
              <p className="text-white font-bold text-sm">{name}</p>
              <p className="text-gray-500 text-xs mt-2">불러오는 중...</p>
            </div>
          )
          const td = totalDiffOf(round)
          const holesPlayed = Object.values(round.scores || {}).filter(s => s.strokes > 0).length
          return (
            <div key={name} className="bg-[#162449] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
                    style={{ backgroundColor: round.playerColor }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{name}{name === room.hostName ? ' (방장)' : ''}</p>
                    <p className="text-gray-500 text-xs">{holesPlayed}/{round.totalHoles}홀</p>
                  </div>
                </div>
                {td && (
                  <p className={`font-black text-lg ${
                    td.diff < 0 ? 'text-[#E8B84B]' : td.diff === 0 ? 'text-white' : 'text-red-400'
                  }`}>
                    {td.diff === 0 ? 'E' : td.diff > 0 ? `+${td.diff}` : td.diff}
                  </p>
                )}
              </div>
              <Scorecard round={round} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
