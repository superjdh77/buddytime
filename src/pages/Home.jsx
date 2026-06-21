import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database'
import { getProfile, getActiveRound, getRoundBackup } from '../utils/auth'

export default function Home() {
  const navigate = useNavigate()
  const profile = getProfile()
  const [liveRounds, setLiveRounds] = useState([])
  const [groupRounds, setGroupRounds] = useState([])

  useEffect(() => {
    // 현재 라이브 라운드 구독
    const liveRef = query(ref(db, 'rounds'), orderByChild('isLive'), equalTo(true))
    const unsub = onValue(liveRef, snap => {
      if (!snap.exists()) { setLiveRounds([]); return }
      const arr = Object.values(snap.val()).sort((a, b) => b.startedAt - a.startedAt)
      setLiveRounds(arr)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    // 최근 완료된 라운드 (내 그룹 or 전체)
    const groupCodes = profile?.groups || []
    if (groupCodes.length === 0) {
      // 그룹 없으면 최근 공개 라운드 표시
      const recentRef = query(ref(db, 'rounds'), orderByChild('finishedAt'))
      const unsub = onValue(recentRef, snap => {
        if (!snap.exists()) { setGroupRounds([]); return }
        const arr = Object.values(snap.val())
          .filter(r => !r.isLive && r.finishedAt)
          .sort((a, b) => b.finishedAt - a.finishedAt)
          .slice(0, 10)
        setGroupRounds(arr)
      })
      return () => unsub()
    }
  }, [])

  function formatTime(ts) {
    if (!ts) return ''
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '방금 전'
    if (mins < 60) return `${mins}분 전`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}시간 전`
    return new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  // 내가 진행 중인 라운드 (앱을 나갔다 들어와도 이어할 수 있도록)
  // 1차: Firebase에 isLive=true로 남아있는 내 라운드 (기기를 바꿔도 보임)
  // 2차: 골프장 신호가 약해 서버 동기화가 안 됐을 경우, 이 기기에 남은 로컬 백업으로 대체
  const myLiveRound = liveRounds.find(r => r.playerName === profile?.name) || (() => {
    const activeId = getActiveRound()
    if (!activeId) return null
    const backup = getRoundBackup(activeId)
    return backup && backup.isLive ? backup : null
  })()

  useEffect(() => { if (myLiveRound?.roomCode) navigate(`/room/${myLiveRound.roomCode}`, { replace: true }) }, [myLiveRound?.roomCode])

  function getScoreDiff(round) {
    if (!round.scores) return null
    let strokes = 0, par = 0
    Object.entries(round.scores).forEach(([i, s]) => {
      if (s.strokes > 0) { strokes += s.strokes; par += round.holePars?.[i] ?? 4 }
    })
    if (strokes === 0) return null
    const diff = strokes - par
    return { strokes, diff }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      {/* 헤더 */}
      <div className="bg-[#162449] px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black"
              style={{ backgroundColor: profile?.color }}>
              {profile?.name?.[0]}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{profile?.name}</p>
              <p className="text-gray-400 text-xs">안녕하세요! ⛳</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/group')} className="text-gray-400 text-xl">👥</button>
            <button onClick={() => navigate('/rounds')} className="text-gray-400 text-xl">📋</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* 진행 중인 내 라운드 이어하기 */}
        {myLiveRound ? (
          <button
            onClick={() => navigate(`/live/${myLiveRound.id}`)}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-black py-5 rounded-2xl text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            진행 중인 라운드 이어하기 ({myLiveRound.courseName})
          </button>
        ) : (
          <button
            onClick={() => navigate('/start')}
            className="w-full bg-gradient-to-r from-[#4A9FE0] to-[#2563EB] text-white font-black py-5 rounded-2xl text-lg shadow-lg transition-all active:scale-95"
          >
            ⛳ 라운드 시작 · 생중계
          </button>
        )}

        {/* 지금 라이브 */}
        {liveRounds.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-white font-bold text-sm">지금 라이브</h2>
            </div>
            <div className="space-y-2">
              {liveRounds.map(round => {
                const sd = getScoreDiff(round)
                const holesPlayed = round.scores ? Object.keys(round.scores).length : 0
                const isMine = round.playerName === profile?.name
                return (
                  <div
                    key={round.id}
                    onClick={() => navigate(isMine ? `/live/${round.id}` : `/watch/${round.id}`)}
                    className="bg-[#162449] rounded-2xl p-4 cursor-pointer active:scale-98 transition-all border border-red-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base"
                          style={{ backgroundColor: round.playerColor }}>
                          {round.playerName?.[0]}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#162449]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{round.playerName}</p>
                        <p className="text-gray-400 text-xs">{round.courseName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs">{holesPlayed}/{round.totalHoles}홀</p>
                        {sd && (
                          <p className={`font-black text-sm ${
                            sd.diff < 0 ? 'text-[#E8B84B]' :
                            sd.diff === 0 ? 'text-white' : 'text-red-400'
                          }`}>
                            {sd.diff === 0 ? 'E' : sd.diff > 0 ? `+${sd.diff}` : sd.diff}
                          </p>
                        )}
                      </div>
                      <div className="text-[#4A9FE0] text-xs font-bold ml-1">LIVE →</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 최근 라운드 피드 */}
        {groupRounds.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-sm mb-3">최근 라운드</h2>
            <div className="space-y-2">
              {groupRounds.map(round => {
                const sd = getScoreDiff(round)
                return (
                  <div
                    key={round.id}
                    onClick={() => navigate(`/watch/${round.id}`)}
                    className="bg-[#162449] rounded-2xl p-4 cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black"
                        style={{ backgroundColor: round.playerColor }}>
                        {round.playerName?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-sm">{round.playerName}</p>
                        <p className="text-gray-400 text-xs">{round.courseName} · {formatTime(round.finishedAt)}</p>
                      </div>
                      {sd && (
                        <p className={`font-black text-lg ${
                          sd.diff < 0 ? 'text-[#E8B84B]' :
                          sd.diff === 0 ? 'text-white' : 'text-red-400'
                        }`}>
                          {sd.diff === 0 ? 'E' : sd.diff > 0 ? `+${sd.diff}` : sd.diff}
                        </p>
                      )}
                    </div>
                    {round.note && (
                      <p className="text-gray-400 text-xs mt-2 ml-13 pl-1">"{round.note}"</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {liveRounds.length === 0 && groupRounds.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">⛳</p>
            <p className="text-gray-400 text-sm">아직 라운드 기록이 없습니다</p>
            <p className="text-gray-500 text-xs mt-1">위 버튼을 눌러 첫 라운드를 시작해 보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}
