import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, onValue, update, set } from 'firebase/database'
import { getProfile, saveRoundToHistory, clearActiveRound, saveRoundBackup, getRoundBackup, clearRoundBackup } from '../utils/auth'
import { getScoreLabel } from '../data/courses'
import Celebration from '../components/Celebration'

function roomTotalDiff(round) {
  let strokes = 0, par = 0
  Object.entries(round?.scores || {}).forEach(([i, s]) => {
    if (s.strokes > 0) { strokes += s.strokes; par += round.holePars?.[i] ?? 4 }
  })
  if (strokes === 0) return null
  return { strokes, diff: strokes - par }
}

function formatDiff(d) {
  if (d === null) return '·'
  if (d === 0) return 'E'
  return d > 0 ? `+${d}` : `${d}`
}

function MiniScorecard({ round }) {
  const totalHoles = round.totalHoles || 18
  return (
    <div className="space-y-1.5">
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
                  <span className="text-gray-500 text-[10px]">{i+1}</span>
                  <span className="font-bold text-xs" style={{ color }}>{formatDiff(d)}</span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function LiveScore() {
  const { roundId } = useParams()
  const navigate = useNavigate()
  const profile = getProfile()
  // 로컬 백업이 있으면 그걸로 즉시 화면을 띄움 (오프라인이어도 바로 이어할 수 있게)
  const [round, setRound] = useState(() => getRoundBackup(roundId))
  const [loadTimedOut, setLoadTimedOut] = useState(false)
  const [currentHole, setCurrentHole] = useState(0)
  const [holeInitialized, setHoleInitialized] = useState(false)
  const [celebration, setCelebration] = useState(null)
  const [note, setNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [room, setRoom] = useState(null)
  const [roomPlayerRounds, setRoomPlayerRounds] = useState({})
  const prevScoresRef = { current: {} }

  // 이어하기 진입 시, 입력된 마지막 홀 다음(미입력 홀)으로 자동 이동 (한 번만)
  useEffect(() => {
    if (holeInitialized || !round) return
    const scoredHoles = Object.entries(round.scores || {})
      .filter(([, s]) => (s.strokes || 0) > 0)
      .map(([i]) => parseInt(i))
    const nextHole = scoredHoles.length > 0
      ? Math.min((round.totalHoles || 18) - 1, Math.max(...scoredHoles) + 1)
      : 0
    setCurrentHole(nextHole)
    setHoleInitialized(true)
  }, [round, holeInitialized])

  useEffect(() => {
    return onValue(ref(db, `rounds/${roundId}`), snap => {
      if (!snap.exists()) {
        // 서버에 없음 — 로컬 백업이 있으면 그걸로 계속하고 서버에 복구 시도
        const backup = getRoundBackup(roundId)
        if (backup) {
          setRound(backup)
          setNote(backup.note || '')
          set(ref(db, `rounds/${roundId}`), backup).catch(() => {})
        } else {
          clearActiveRound()
          navigate('/')
        }
        return
      }
      const data = snap.val()

      // 버디/이글 감지
      if (data.scores) {
        Object.entries(data.scores).forEach(([holeIdx, s]) => {
          const key = `hole_${holeIdx}`
          const par = data.holePars?.[parseInt(holeIdx)] ?? 4
          const diff = (s.strokes || 0) - par
          if (!prevScoresRef.current[key] && s.strokes > 0 && diff <= -1) {
            setCelebration({ diff, label: diff <= -2 ? '이글🦅' : '버디🐦' })
            setTimeout(() => setCelebration(null), 2500)
          }
          prevScoresRef.current[key] = s.strokes
        })
      }
      setRound(data)
      saveRoundBackup(data)
      setNote(data.note || '')
    })
  }, [roundId])

  // 같은 방(roomCode)이면 방 정보 구독 — 함께 라운드 중인 사람들 표시용
  useEffect(() => {
    if (!round?.roomCode) return
    return onValue(ref(db, `rooms/${round.roomCode}`), snap => {
      setRoom(snap.exists() ? snap.val() : null)
    })
  }, [round?.roomCode])

  const roomPlayersKey = room?.players ? Object.entries(room.players).map(([n, id]) => `${n}:${id}`).join(',') : ''

  useEffect(() => {
    if (!room?.players) return
    const unsubs = Object.entries(room.players).map(([name, rid]) =>
      onValue(ref(db, `rounds/${rid}`), snap => {
        if (snap.exists()) setRoomPlayerRounds(prev => ({ ...prev, [name]: snap.val() }))
      })
    )
    return () => unsubs.forEach(u => u())
  }, [roomPlayersKey])

  useEffect(() => {
    if (round) return
    const t = setTimeout(() => setLoadTimedOut(true), 6000)
    return () => clearTimeout(t)
  }, [round])

  if (!round) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0D1B3E]">
      {loadTimedOut ? (
        <div className="text-center px-6">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-white font-bold mb-1">신호가 약해서 불러오지 못했어요</p>
          <p className="text-gray-400 text-sm mb-5">Wi-Fi나 데이터 연결을 확인하고 다시 시도해주세요</p>
          <button onClick={() => window.location.reload()} className="bg-[#4A9FE0] text-white font-bold px-6 py-3 rounded-xl mr-2">다시 시도</button>
          <button onClick={() => navigate('/')} className="bg-[#162449] text-gray-300 font-bold px-6 py-3 rounded-xl">홈으로</button>
        </div>
      ) : (
        <div className="text-4xl animate-spin">⛳</div>
      )}
    </div>
  )

  // 내 라운드인지 확인
  if (round.playerName !== profile?.name) {
    navigate(`/watch/${roundId}`)
    return null
  }

  const par = round.holePars?.[currentHole] ?? 4
  // 타수 입력은 0이 아닌 파(par)부터 시작 — 골프에서 자연스러운 시작점
  const score = round.scores?.[currentHole] || { strokes: par, putts: 0 }
  const diff = score.strokes > 0 ? score.strokes - par : null
  const label = diff !== null ? getScoreLabel(diff) : null
  const holesPlayed = Object.values(round.scores || {}).filter(s => s.strokes > 0).length

  // 총계
  let totalStrokes = 0, totalPar = 0
  Object.entries(round.scores || {}).forEach(([i, s]) => {
    if (s.strokes > 0) { totalStrokes += s.strokes; totalPar += round.holePars?.[i] ?? 4 }
  })
  const totalDiff = totalStrokes > 0 ? totalStrokes - totalPar : null

  function setScore(field, delta) {
    const cur = score[field] || 0
    const min = field === 'strokes' ? 1 : 0
    const newVal = Math.max(min, cur + delta)

    // 먼저 화면/로컬 백업을 즉시 갱신 (신호가 약해도 입력이 끊기지 않게)
    const updated = {
      ...round,
      scores: { ...round.scores, [currentHole]: { ...score, [field]: newVal } },
      currentHole,
    }
    setRound(updated)
    saveRoundBackup(updated)

    const fbUpdates = {
              [`rounds/${roundId}/scores/${currentHole}/${field}`]: newVal,
              [`rounds/${roundId}/currentHole`]: currentHole,
    }
          if (field === 'putts' && !round.scores?.[currentHole]?.strokes) {
                    fbUpdates[`rounds/${roundId}/scores/${currentHole}/strokes`] = par
          }
          update(ref(db), fbUpdates).catch(() => {
      // 서버 전송 실패해도 로컬엔 남아있음 — 다음 입력/재접속 때 재시도됨
    })
  }

  function finishRound() {
    if (!confirm('라운드를 종료하고 저장하시겠습니까?')) return
    const now = Date.now()

    // 버디/이글 수 계산
    let birdies = 0, eagles = 0
    Object.entries(round.scores || {}).forEach(([i, s]) => {
      const d = (s.strokes || 0) - (round.holePars?.[i] ?? 4)
      if (d === -1) birdies++
      if (d <= -2) eagles++
    })

    // 로컬 기록 저장은 서버 연결과 무관하게 항상 먼저 처리 (신호 약한 곳에서도 기록이 사라지지 않게)
    saveRoundToHistory({ ...round, isLive: false, finishedAt: now, birdies, eagles, totalStrokes, totalPar, note })
    clearActiveRound()
    clearRoundBackup()
    navigate('/rounds')

    update(ref(db, `rounds/${roundId}`), {
      isLive: false,
      finishedAt: now,
      note,
      birdies,
      eagles,
      totalStrokes,
      totalPar,
    }).catch(() => {
      // 서버 반영이 늦어져도 로컬 기록은 이미 저장됨
    })
  }

  function shareLink() {
    const url = round.roomCode
      ? `${window.location.origin}/room/${round.roomCode}`
      : `${window.location.origin}/watch/${roundId}`
    const msg = round.roomCode
      ? `⛳ ${profile.name}님의 ${round.courseName} 라운드 같이 하기!\n선수로 참여하거나 구경하러 오세요 👉\n${url}`
      : `⛳ ${profile.name}님이 ${round.courseName} 라운드 중!\n실시간 구경하기 👉\n${url}`
    if (navigator.share) navigator.share({ text: msg })
    else { navigator.clipboard?.writeText(msg); alert('링크가 복사되었습니다!\n카카오로 친구들에게 보내세요 😊') }
  }

  // 리액션 집계
  const reactionCounts = {}
  if (round.reactions) {
    Object.values(round.reactions).forEach(emojiMap => {
      Object.entries(emojiMap || {}).forEach(([emoji, names]) => {
        reactionCounts[emoji] = (reactionCounts[emoji] || 0) + Object.keys(names || {}).length
      })
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      {/* 헤더 */}
      <div className="bg-[#162449] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-bold">LIVE</span>
              <span className="text-gray-400 text-xs">· {round.courseName}</span>
            </div>
            <p className="text-white font-bold text-sm">{holesPlayed}/{round.totalHoles}홀 완료</p>
          </div>
          <div className="flex gap-2">
            <button onClick={shareLink}
              className="bg-[#E8B84B] text-[#0D1B3E] text-xs font-bold px-3 py-1.5 rounded-lg">
              📤 공유
            </button>
            <button onClick={finishRound}
              className="bg-red-900/40 text-red-400 text-xs px-3 py-1.5 rounded-lg">
              종료
            </button>
          </div>
        </div>
      </div>

      {/* 합계 바 */}
      {totalDiff !== null && (
        <div className="bg-[#0D1B3E] px-4 py-2 flex items-center justify-between border-b border-[#162449]">
          <span className="text-gray-400 text-xs">현재 합계</span>
          <span className={`font-black text-lg ${
            totalDiff < 0 ? 'text-[#E8B84B]' : totalDiff === 0 ? 'text-white' : 'text-red-400'
          }`}>
            {totalDiff === 0 ? 'EVEN' : totalDiff > 0 ? `+${totalDiff}` : totalDiff}
          </span>
          <span className="text-gray-400 text-xs">{totalStrokes}타</span>
        </div>
      )}

      {/* 홀 네비게이션 */}
      <div className="px-4 py-3 bg-[#162449]/40">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
            disabled={currentHole === 0}
            className="w-10 h-10 rounded-xl bg-[#162449] text-white text-2xl flex items-center justify-center disabled:opacity-30">‹</button>
          <div className="text-center">
            <p className="text-white font-black text-3xl">{currentHole + 1}번 홀</p>
            <p className="text-[#4A9FE0] font-bold">Par {par}</p>
          </div>
          <button onClick={() => setCurrentHole(Math.min(round.totalHoles - 1, currentHole + 1))}
            disabled={currentHole === round.totalHoles - 1}
            className="w-10 h-10 rounded-xl bg-[#162449] text-white text-2xl flex items-center justify-center disabled:opacity-30">›</button>
        </div>

        {/* 홀 도트 */}
        <div className="flex gap-1 justify-center flex-wrap">
          {Array.from({ length: round.totalHoles }, (_, i) => {
            const done = (round.scores?.[i]?.strokes || 0) > 0
            return (
              <button key={i} onClick={() => setCurrentHole(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all
                  ${i === currentHole ? 'bg-[#4A9FE0] text-white scale-110' :
                    done ? 'bg-[#4A9FE0]/30 text-[#4A9FE0]' : 'bg-[#162449] text-gray-500'}`}>
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* 전체 스코어카드 */}
      <div className="px-4 pt-3">
        <div className="bg-[#162449] rounded-2xl p-4">
          <p className="text-white font-bold text-sm mb-3">전체 스코어카드</p>
          <div className="space-y-2">
            {[0, 9].map(start => {
              const holesInRow = Math.min(9, round.totalHoles - start)
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
                      <button key={i} onClick={() => setCurrentHole(i)}
                        className={`flex flex-col items-center rounded-lg py-1 transition-all
                          ${i === currentHole ? 'bg-[#4A9FE0]/30 ring-1 ring-[#4A9FE0]' : ''}`}>
                        <span className="text-gray-500 text-xs">{i+1}</span>
                        <span className="font-bold text-sm" style={{ color }}>
                          {formatDiff(d)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 스코어 입력 */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {/* 타수 */}
        <div className="bg-[#162449] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-300 text-sm font-bold">총 타수</p>
            {label && score.strokes > 0 && (
              <span className="text-sm font-black px-3 py-1 rounded-full"
                style={{ color: label.color, backgroundColor: label.color + '22' }}>
                {label.emoji} {label.label}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button onClick={() => setScore('strokes', -1)}
              className="w-14 h-14 rounded-2xl bg-[#0D1B3E] text-white font-black text-2xl flex items-center justify-center active:scale-90">−</button>
            <span className="font-black text-6xl" style={{ color: label?.color || 'white' }}>
              {score.strokes || '—'}
            </span>
            <button onClick={() => setScore('strokes', 1)}
              className="w-14 h-14 rounded-2xl bg-[#4A9FE0] text-white font-black text-2xl flex items-center justify-center active:scale-90">+</button>
          </div>
        </div>

        {/* 퍼팅 */}
        <div className="bg-[#162449] rounded-2xl p-4">
          <p className="text-[#60A5FA] text-sm font-bold mb-2">🔵 퍼팅 수</p>
          <div className="flex items-center justify-between">
            <button onClick={() => setScore('putts', -1)}
              className="w-14 h-14 rounded-2xl bg-[#0D1B3E] text-white font-black text-2xl flex items-center justify-center active:scale-90">−</button>
            <span className="text-[#60A5FA] font-black text-6xl">
              {score.putts || '—'}
            </span>
            <button onClick={() => setScore('putts', 1)}
              className="w-14 h-14 rounded-2xl bg-blue-700 text-white font-black text-2xl flex items-center justify-center active:scale-90">+</button>
          </div>
        </div>

        {/* 리액션 (친구들이 보낸 것) */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="bg-[#162449] rounded-xl px-4 py-3">
            <p className="text-gray-400 text-xs mb-2">💬 친구들의 반응</p>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span key={emoji} className="bg-[#0D1B3E] rounded-full px-3 py-1.5 text-sm">
                  {emoji} <span className="text-white font-bold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 한 줄 메모 */}
        {showNoteInput ? (
          <div className="bg-[#162449] rounded-xl p-3">
            <input
              type="text"
              placeholder='오늘 라운드 한 마디 (예: "드라이버 최고")'
              maxLength={50}
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => {
                const updated = { ...round, note }
                setRound(updated)
                saveRoundBackup(updated)
                update(ref(db, `rounds/${roundId}`), { note }).catch(() => {})
              }}
              className="w-full bg-[#0D1B3E] text-white rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
        ) : (
          <button onClick={() => setShowNoteInput(true)}
            className="w-full border border-dashed border-gray-600 text-gray-500 py-2.5 rounded-xl text-sm">
            ✏️ 오늘 라운드 한 마디 남기기
          </button>
        )}
      </div>

      {/* 함께 라운드 중인 사람들 스코어카드 (방 참여 시) */}
      {room && Object.keys(room.players || {}).filter(n => n !== profile?.name).length > 0 && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-gray-400 text-xs font-bold px-1">👥 함께 라운드 중</p>
          {Object.keys(room.players).filter(n => n !== profile?.name).map(name => {
            const r = roomPlayerRounds[name]
            if (!r) return (
              <div key={name} className="bg-[#162449] rounded-2xl p-3">
                <p className="text-white text-sm font-bold">{name}</p>
                <p className="text-gray-500 text-xs mt-1">불러오는 중...</p>
              </div>
            )
            const td = roomTotalDiff(r)
            return (
              <div key={name} className="bg-[#162449] rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-xs"
                      style={{ backgroundColor: r.playerColor }}>{name[0]}</div>
                    <span className="text-white text-sm font-bold">{name}{name === room.hostName ? ' (방장)' : ''}</span>
                  </div>
                  {td && (
                    <span className={`font-black text-sm ${
                      td.diff < 0 ? 'text-[#E8B84B]' : td.diff === 0 ? 'text-white' : 'text-red-400'
                    }`}>{td.diff === 0 ? 'E' : td.diff > 0 ? `+${td.diff}` : td.diff}</span>
                  )}
                </div>
                <MiniScorecard round={r} />
              </div>
            )
          })}
        </div>
      )}

      {/* 다음 홀 */}
      {currentHole < round.totalHoles - 1 && (
        <div className="px-4 pb-4">
          <button onClick={() => setCurrentHole(currentHole + 1)}
            className="w-full bg-[#162449] text-[#4A9FE0] font-bold py-3 rounded-xl">
            다음 홀 ({currentHole + 2}번) →
          </button>
        </div>
      )}

      {celebration && <Celebration data={celebration} />}
    </div>
  )
}
