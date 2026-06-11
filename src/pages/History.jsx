import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('buddytime_history') || '[]')
    setHistory(saved)
  }, [])

  function clearHistory() {
    if (confirm('전체 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem('buddytime_history')
      setHistory([])
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      <div className="bg-[#162449] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 text-2xl">←</button>
        <h2 className="text-white font-bold text-lg flex-1">📋 라운드 히스토리</h2>
        {history.length > 0 && (
          <button onClick={clearHistory} className="text-red-400 text-xs">전체 삭제</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⛳</p>
            <p className="text-gray-400">아직 기록된 라운드가 없습니다</p>
            <button
              onClick={() => navigate('/setup')}
              className="mt-4 text-[#4A9FE0] text-sm underline"
            >
              첫 라운드 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((round, idx) => {
              // 집계
              const playerStats = (round.players || []).map(player => {
                let totalStrokes = 0, totalPar = 0, totalPutts = 0
                for (let i = 0; i < round.totalHoles; i++) {
                  const s = round.scores?.[player.id]?.[i]
                  if (s?.strokes > 0) {
                    totalStrokes += s.strokes
                    totalPar += round.holePars?.[i] ?? 4
                    totalPutts += s.putts ?? 0
                  }
                }
                return { ...player, totalStrokes, scoreDiff: totalStrokes - totalPar, totalPutts }
              })
              const sorted = [...playerStats].sort((a, b) => a.scoreDiff - b.scoreDiff)
              const best = sorted[0]
              const puttBest = [...playerStats].sort((a, b) => a.totalPutts - b.totalPutts)[0]

              return (
                <div
                  key={idx}
                  onClick={() => navigate(`/game/${round.roomCode}`)}
                  className="bg-[#162449] rounded-2xl p-4 cursor-pointer active:scale-99 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-bold">{round.courseName}</p>
                      <p className="text-gray-400 text-xs">{round.date} · {round.totalHoles}홀</p>
                    </div>
                    <span className="text-gray-500 text-xs font-mono">{round.roomCode}</span>
                  </div>

                  {/* 순위 */}
                  <div className="flex gap-2 flex-wrap">
                    {sorted.slice(0, 3).map((p, rank) => (
                      <div key={p.id} className="flex items-center gap-1 bg-[#0D1B3E] rounded-lg px-2 py-1">
                        <span className="text-xs">{['🥇','🥈','🥉'][rank]}</span>
                        <span className="text-white text-xs font-bold">{p.name}</span>
                        <span className={`text-xs font-bold ${
                          p.scoreDiff < 0 ? 'text-[#E8B84B]' :
                          p.scoreDiff === 0 ? 'text-gray-300' : 'text-red-400'
                        }`}>
                          {p.scoreDiff === 0 ? 'E' : p.scoreDiff > 0 ? `+${p.scoreDiff}` : p.scoreDiff}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>🔵 퍼팅왕: {puttBest?.name} ({puttBest?.totalPutts}개)</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
