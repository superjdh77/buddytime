import { getScoreLabel } from '../data/courses'

export default function ScoreTab({ game, currentHole, setCurrentHole, updateScore }) {
  const { players = [], holePars = [], totalHoles, scores = {}, status } = game
  const par = holePars[currentHole] ?? 4
  const isFinished = status === 'finished'

  function getScore(playerId, field) {
    return scores?.[playerId]?.[currentHole]?.[field] ?? 0
  }

  function changeScore(playerId, field, delta) {
    if (isFinished) return
    const cur = getScore(playerId, field)
    const minVal = field === 'strokes' ? 1 : 0
    const newVal = Math.max(minVal, cur + delta)
    updateScore(playerId, currentHole, field, newVal)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 홀 네비게이션 */}
      <div className="px-4 py-3 bg-[#162449]/60">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCurrentHole(Math.max(0, currentHole - 1))}
            disabled={currentHole === 0}
            className="w-10 h-10 rounded-xl bg-[#162449] text-white flex items-center justify-center disabled:opacity-30 text-xl"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-white font-black text-2xl">{currentHole + 1}번 홀</p>
            <p className="text-[#4A9FE0] text-sm font-bold">Par {par}</p>
          </div>
          <button
            onClick={() => setCurrentHole(Math.min(totalHoles - 1, currentHole + 1))}
            disabled={currentHole === totalHoles - 1}
            className="w-10 h-10 rounded-xl bg-[#162449] text-white flex items-center justify-center disabled:opacity-30 text-xl"
          >
            ›
          </button>
        </div>

        {/* 홀 도트 네비게이션 */}
        <div className="flex gap-1 justify-center flex-wrap max-w-xs mx-auto">
          {Array.from({ length: totalHoles }, (_, i) => {
            const allDone = players.every(p => (scores?.[p.id]?.[i]?.strokes ?? 0) > 0)
            return (
              <button
                key={i}
                onClick={() => setCurrentHole(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all
                  ${i === currentHole ? 'bg-[#4A9FE0] text-white scale-110' :
                    allDone ? 'bg-[#4A9FE0]/30 text-[#4A9FE0]' : 'bg-[#162449] text-gray-500'}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* 플레이어 스코어 입력 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {players.map(player => {
          const strokes = getScore(player.id, 'strokes')
          const putts = getScore(player.id, 'putts')
          const diff = strokes > 0 ? strokes - par : null
          const label = diff !== null ? getScoreLabel(diff) : null

          return (
            <div key={player.id} className="bg-[#162449] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: player.color }}>
                    {player.name[0]}
                  </div>
                  <span className="text-white font-bold">{player.name}</span>
                </div>
                {label && strokes > 0 && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ color: label.color, backgroundColor: label.color + '22' }}>
                    {label.emoji} {label.label}
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                {/* 총 타수 */}
                <div className="flex-1 bg-[#0D1B3E] rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-2 text-center">총 타수</p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => changeScore(player.id, 'strokes', -1)}
                      className="w-9 h-9 rounded-xl bg-[#162449] text-white font-bold text-xl flex items-center justify-center active:scale-90"
                    >−</button>
                    <span className="text-white font-black text-3xl" style={{ color: label?.color }}>
                      {strokes || '—'}
                    </span>
                    <button
                      onClick={() => changeScore(player.id, 'strokes', 1)}
                      className="w-9 h-9 rounded-xl bg-[#4A9FE0] text-white font-bold text-xl flex items-center justify-center active:scale-90"
                    >+</button>
                  </div>
                </div>

                {/* 퍼팅 수 */}
                <div className="flex-1 bg-[#0D1B3E] rounded-xl p-3">
                  <p className="text-[#60A5FA] text-xs mb-2 text-center">🔵 퍼팅</p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => changeScore(player.id, 'putts', -1)}
                      className="w-9 h-9 rounded-xl bg-[#162449] text-white font-bold text-xl flex items-center justify-center active:scale-90"
                    >−</button>
                    <span className="text-[#60A5FA] font-black text-3xl">
                      {putts || '—'}
                    </span>
                    <button
                      onClick={() => changeScore(player.id, 'putts', 1)}
                      className="w-9 h-9 rounded-xl bg-blue-700 text-white font-bold text-xl flex items-center justify-center active:scale-90"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 다음 홀 버튼 */}
      {currentHole < totalHoles - 1 && !isFinished && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setCurrentHole(currentHole + 1)}
            className="w-full bg-[#162449] text-[#4A9FE0] font-bold py-3 rounded-xl"
          >
            다음 홀 ({currentHole + 2}번) →
          </button>
        </div>
      )}
    </div>
  )
}
