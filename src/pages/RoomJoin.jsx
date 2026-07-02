import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, onValue, set, update } from 'firebase/database'
import { getProfile, generateId, setActiveRound, saveRoundBackup, getRoundBackup, getActiveRound, setRedirectAfterLogin, isSessionConfirmed } from '../utils/auth'

export default function RoomJoin() {
  const { code } = useParams()
  const navigate = useNavigate()
  const profile = getProfile()
  const [room, setRoom] = useState(undefined) // undefined: 로딩중, null: 없음
  const [joining, setJoining] = useState(false)
  const [forceChoice, setForceChoice] = useState(false)
  const [loadTimedOut, setLoadTimedOut] = useState(false)

  useEffect(() => {
    return onValue(ref(db, `rooms/${code}`), snap => {
      setRoom(snap.exists() ? snap.val() : null)
    })
  }, [code])

  // 5초 타임아웃 — 신호 약한 골프장에서 무한 스피너 방지
  useEffect(() => {
    if (room !== undefined) return
    const t = setTimeout(() => setLoadTimedOut(true), 5000)
    return () => clearTimeout(t)
  }, [room])

  if (!profile || !isSessionConfirmed()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0D1B3E] px-6 text-center">
        <p className="text-5xl mb-4">⛳</p>
        <p className="text-white font-bold mb-2">먼저 로그인이 필요해요</p>
        <p className="text-gray-400 text-sm mb-6">로그인 후 이 방으로 다시 데려다드릴게요</p>
        <button
          onClick={() => { setRedirectAfterLogin(`/room/${code}`); navigate('/onboarding') }}
          className="w-full max-w-xs bg-[#4A9FE0] text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
        >
          로그인 / 시작하기
        </button>
      </div>
    )
  }

  if (room === undefined) {
    if (loadTimedOut) {
      const activeId = getActiveRound()
      const backup = activeId ? getRoundBackup(activeId) : null
      if (backup && backup.roomCode === code && backup.isLive) {
        navigate(`/live/${activeId}`, { replace: true })
        return null
      }
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0D1B3E]">
          <div className="text-center px-6">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-white font-bold mb-1">신호가 약해서 불러오지 못했어요</p>
            <p className="text-gray-400 text-sm mb-5">Wi-Fi나 데이터 연결을 확인하고 다시 시도해주세요</p>
            <button onClick={() => window.location.reload()} className="bg-[#4A9FE0] text-white font-bold px-6 py-3 rounded-xl mr-2">다시 시도</button>
            <button onClick={() => navigate('/')} className="bg-[#162449] text-gray-300 font-bold px-6 py-3 rounded-xl">홈으로</button>
          </div>
        </div>
      )
    }
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
        <p className="text-gray-400 text-sm mb-6">코드를 다시 확인해주세요: {code}</p>
        <button onClick={() => navigate('/')} className="text-[#4A9FE0] text-sm underline">홈으로</button>
      </div>
    )
  }

  const players = Object.keys(room.players || {})
  const gallery = Object.keys(room.gallery || {})
  const alreadyPlaying = room.players?.[profile.name]
  const alreadyWatching = room.gallery?.[profile.name]

  async function joinAsPlayer() {
    if (joining) return
    setJoining(true)

    // 이미 이 방에 선수로 들어와 있으면 그 라운드로 바로 이동
    if (alreadyPlaying) {
      navigate(`/live/${alreadyPlaying}`)
      return
    }

    const roundId = generateId()
    const now = Date.now()
    const today = new Date()
    const roundData = {
      id: roundId,
      playerName: profile.name,
      playerColor: profile.color,
      groupCode: profile.groups?.[0] || null,
      roomCode: code,
      isHost: false,
      courseName: room.courseName,
      totalHoles: room.totalHoles,
      holePars: room.holePars,
      scores: {},
      currentHole: 0,
      isLive: true,
      note: '',
      date: today.toLocaleDateString('ko-KR'),
      dateKey: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`,
      month: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`,
      year: String(today.getFullYear()),
      startedAt: now,
      finishedAt: null,
      reactions: {},
    }

    setActiveRound(roundId)
    saveRoundBackup(roundData)
    navigate(`/live/${roundId}`)

    set(ref(db, `rounds/${roundId}`), roundData).catch(() => {})
    update(ref(db, `rooms/${code}/players`), { [profile.name]: roundId }).catch(() => {})
  }

  async function joinAsGallery() {
    if (joining) return
    setJoining(true)
    await update(ref(db, `rooms/${code}/gallery`), { [profile.name]: true }).catch(() => {})
    navigate(`/watchroom/${code}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-6 justify-center">
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">⛳</p>
        <p className="text-[#E8B84B] font-black text-2xl mb-1">{room.hostName}님의 라운드</p>
        <p className="text-gray-300">{room.courseName} · {room.totalHoles}홀</p>
      </div>

      <div className="bg-[#162449] rounded-2xl p-4 mb-6">
        <p className="text-gray-400 text-xs mb-2">참여 중 ({players.length}명)</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {players.map(name => (
            <span key={name} className="bg-[#0D1B3E] text-white text-xs font-bold px-3 py-1.5 rounded-full">
              🏌️ {name}{name === room.hostName ? ' (방장)' : ''}
            </span>
          ))}
        </div>
        {gallery.length > 0 && (
          <>
            <p className="text-gray-400 text-xs mb-2">구경 중</p>
            <div className="flex gap-1.5 flex-wrap">
              {gallery.map(name => (
                <span key={name} className="text-gray-500 text-xs">👀 {name}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
{alreadyPlaying && !forceChoice ? (
      <>
      <button
        onClick={() => navigate(`/live/${alreadyPlaying}`)}
        className="w-full bg-[#4A9FE0] text-white font-black py-5 rounded-2xl text-lg shadow-lg transition-all active:scale-95"
          >
                🏌️ 이어하기
      </button>  
        <button
          onClick={() => setForceChoice(true)}
          className="w-full text-gray-400 text-sm underline py-2"
        >
          선수 / 갤러리 다시 선택
        </button>
      </>
    ) : (
      <>
        <button
          onClick={joinAsPlayer}
          disabled={joining}
          className="w-full bg-[#4A9FE0] text-white font-black py-5 rounded-2xl text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          🏌️ 선수로 참여 {alreadyPlaying ? '(이어하기)' : ''}
        </button>
        <button
          onClick={joinAsGallery}
          disabled={joining}
          className="w-full bg-[#162449] text-gray-300 font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
        >
          👀 갤러리로 구경 {alreadyWatching ? '(이어보기)' : ''}
        </button>
      </>
    )}
      </div>
    </div>
  )
}
