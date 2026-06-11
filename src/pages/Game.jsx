import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, onValue, update } from 'firebase/database'
import { getScoreLabel } from '../data/courses'
import ScoreTab from '../components/ScoreTab'
import LeaderboardTab from '../components/LeaderboardTab'
import ResultsTab from '../components/ResultsTab'
import Celebration from '../components/Celebration'

export default function Game() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [activeTab, setActiveTab] = useState('score')
  const [currentHole, setCurrentHole] = useState(0)
  const [celebration, setCelebration] = useState(null)
  const prevScoresRef = useRef({})

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomCode}`)
    const unsub = onValue(roomRef, snap => {
      if (!snap.exists()) { navigate('/'); return }
      const data = snap.val()
      setGame(data)

      // 버디/이글 감지
      if (data.scores) {
        Object.entries(data.scores).forEach(([pid, holes]) => {
          Object.entries(holes).forEach(([holeIdx, score]) => {
            const key = `${pid}_${holeIdx}`
            const prev = prevScoresRef.current[key]
            const par = data.holePars?.[parseInt(holeIdx)] ?? 4
            const diff = score.strokes - par
            if (prev === undefined && score.strokes > 0 && diff <= -1) {
              const player = data.players?.find(p => p.id === pid)
              setCelebration({ player, diff, label: diff <= -2 ? '이글' : '버디' })
              setTimeout(() => setCelebration(null), 3000)
            }
            prevScoresRef.current[key] = score.strokes
          })
        })
      }
    })
    return () => unsub()
  }, [roomCode])

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0D1B3E]">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⛳</div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  async function updateScore(playerId, holeIdx, field, value) {
    const path = `rooms/${roomCode}/scores/${playerId}/${holeIdx}/${field}`
    await update(ref(db), { [path]: value })
  }

  async function finishGame() {
    if (!confirm('라운드를 종료하시겠습니까?')) return
    await update(ref(db, `rooms/${roomCode}`), { status: 'finished' })
    // 로컬 히스토리 저장
    const history = JSON.parse(localStorage.getItem('buddytime_history') || '[]')
    history.unshift({
      roomCode,
      courseName: game.courseName,
      date: new Date().toLocaleDateString('ko-KR'),
      players: game.players,
      scores: game.scores,
      holePars: game.holePars,
      totalHoles: game.totalHoles,
    })
    localStorage.setItem('buddytime_history', JSON.stringify(history.slice(0, 10)))
    setActiveTab('results')
  }

  const tabs = [
    { id: 'score', label: '스코어', icon: '🏌️' },
    { id: 'board', label: '순위', icon: '🏆' },
    { id: 'results', label: '결과', icon: '📊' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      {/* 상단 헤더 */}
      <div className="bg-[#162449] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">{game.courseName}</p>
          <p className="text-[#4A9FE0] text-xs">{game.totalHoles}홀 · 방코드: <span className="font-mono font-bold">{roomCode}</span></p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => {
              const msg = `버디타임 골프 스코어 공유\n방 코드: ${roomCode}\nhttps://buddytime.vercel.app`
              if (navigator.share) navigator.share({ text: msg })
              else { navigator.clipboard?.writeText(msg); alert('방 코드가 복사되었습니다!') }
            }}
            className="text-xs bg-[#4A9FE0]/20 text-[#4A9FE0] px-3 py-1.5 rounded-lg"
          >
            공유
          </button>
          {game.status !== 'finished' && (
            <button onClick={finishGame} className="text-xs bg-red-900/40 text-red-400 px-3 py-1.5 rounded-lg">
              종료
            </button>
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'score' && (
          <ScoreTab
            game={game}
            currentHole={currentHole}
            setCurrentHole={setCurrentHole}
            updateScore={updateScore}
          />
        )}
        {activeTab === 'board' && <LeaderboardTab game={game} />}
        {activeTab === 'results' && <ResultsTab game={game} roomCode={roomCode} />}
      </div>

      {/* 하단 탭바 */}
      <div className="bg-[#162449] flex border-t border-[#0D1B3E]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-all
              ${activeTab === tab.id ? 'text-[#4A9FE0]' : 'text-gray-500'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 축하 애니메이션 */}
      {celebration && <Celebration data={celebration} />}
    </div>
  )
}
