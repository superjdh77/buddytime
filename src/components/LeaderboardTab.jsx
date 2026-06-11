export default function LeaderboardTab({ game }) {
  const { players = [], scores = {}, holePars = [], totalHoles } = game

  // 플레이어별 집계
  const stats = players.map(player => {
    let totalStrokes = 0
    let totalPar = 0
    let totalPutts = 0
    let holesPlayed = 0

    for (let i = 0; i < totalHoles; i++) {
      const s = scores?.[player.id]?.[i]
      if (s?.strokes > 0) {
        totalStrokes += s.strokes
        totalPar += holePars[i] ?? 4
        totalPutts += s.putts ?? 0
        holesPlayed++
      }
    }

    return {
      ...player,
      totalStrokes,
      totalPar,
      scoreDiff: totalStrokes - totalPar,
      totalPutts,
      holesPlayed,
      avgPutts: holesPlayed > 0 ? (totalPutts / holesPlayed).toFixed(1) : '-',
    }
  })

  const scoreRanking = [...stats].sort((a, b) => {
    if (a.holesPlayed === 0 && b.holesPlayed === 0) return 0
    if (a.holesPlayed === 0) return 1
    if (b.holesPlayed === 0) return -1
    return a.scoreDiff - b.scoreDiff
  })

  const puttRanking = [...stats].sort((a, b) => {
    if (a.holesPlayed === 0 && b.holesPlayed === 0) return 0
    if (a.holesPlayed === 0) return 1
    if (b.holesPlayed === 0) return -1
    return a.totalPutts - b.totalPutts
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="overflow-y-auto h-full px-4 py-4 space-y-6">
      {/* 스코어 순위 */}
      <div>
        <h3 className="text-white font-bold text-base mb-3">🏆 스코어 순위</h3>
        <div className="space-y-2">
          {scoreRanking.map((player, rank) => (
            <div key={player.id} className="bg-[#162449] rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl w-8">{medals[rank] ?? `${rank + 1}`}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: player.color }}
              >
                {player.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{player.name}</p>
                <p className="text-gray-400 text-xs">{player.holesPlayed}/{totalHoles}홀 완료</p>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg ${
                  player.scoreDiff < 0 ? 'text-[#E8B84B]' :
                  player.scoreDiff === 0 ? 'text-white' : 'text-red-400'
                }`}>
                  {player.holesPlayed === 0 ? '—' :
                    player.scoreDiff === 0 ? 'E' :
                    player.scoreDiff > 0 ? `+${player.scoreDiff}` : player.scoreDiff}
                </p>
                <p className="text-gray-500 text-xs">{player.totalStrokes > 0 ? player.totalStrokes + '타' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 퍼팅 순위 */}
      <div>
        <h3 className="text-white font-bold text-base mb-3">🔵 퍼팅 순위 <span className="text-[#60A5FA] text-xs">(낮을수록 좋음)</span></h3>
        <div className="space-y-2">
          {puttRanking.map((player, rank) => (
            <div key={player.id} className="bg-[#162449] rounded-xl px-4 py-3 flex items-center gap-3">
              {rank === 0 && player.holesPlayed > 0 && (
                <span className="text-xl w-8">👑</span>
              )}
              {(rank > 0 || player.holesPlayed === 0) && (
                <span className="text-gray-400 text-sm w-8 text-center">{rank + 1}</span>
              )}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: player.color }}
              >
                {player.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{player.name}</p>
                {rank === 0 && player.holesPlayed > 0 && (
                  <p className="text-[#60A5FA] text-xs font-bold">퍼팅왕 👑</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[#60A5FA] font-black text-lg">
                  {player.holesPlayed === 0 ? '—' : player.totalPutts}
                </p>
                <p className="text-gray-500 text-xs">평균 {player.avgPutts}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 미니 스코어카드 */}
      <div>
        <h3 className="text-white font-bold text-base mb-3">📋 스코어카드</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <td className="py-1 pr-2">홀</td>
                <td className="py-1 pr-2 text-center">Par</td>
                {players.map(p => (
                  <td key={p.id} className="py-1 text-center" style={{ color: p.color }}>{p.name.slice(0, 2)}</td>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalHoles }, (_, i) => (
                <tr key={i} className={`border-t border-[#162449] ${i === 8 ? 'border-t-2 border-[#4A9FE0]' : ''}`}>
                  <td className="py-1 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-1 pr-2 text-center text-gray-400">{holePars[i]}</td>
                  {players.map(p => {
                    const s = scores?.[p.id]?.[i]?.strokes ?? 0
                    const diff = s > 0 ? s - (holePars[i] ?? 4) : null
                    const color = diff === null ? 'text-gray-600' :
                      diff <= -2 ? 'text-[#E8B84B]' : diff === -1 ? 'text-green-400' :
                      diff === 0 ? 'text-white' : diff === 1 ? 'text-orange-400' : 'text-red-400'
                    return (
                      <td key={p.id} className={`py-1 text-center font-bold ${color}`}>
                        {s || '·'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-[#4A9FE0] font-bold">
                <td className="py-1 pr-2 text-[#4A9FE0]">합계</td>
                <td className="py-1 pr-2 text-center text-[#4A9FE0]">{holePars.reduce((a,b)=>a+b,0)}</td>
                {players.map(p => {
                  const total = Object.values(scores?.[p.id] ?? {}).reduce((a, s) => a + (s.strokes ?? 0), 0)
                  return <td key={p.id} className="py-1 text-center text-white">{total || '—'}</td>
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
