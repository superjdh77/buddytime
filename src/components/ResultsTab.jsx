export default function ResultsTab({ game, roomCode }) {
  const { players = [], scores = {}, holePars = [], totalHoles, courseName, skinsAmount = 0 } = game

  // 플레이어별 통계 계산
  const stats = players.map(player => {
    let totalStrokes = 0, totalPar = 0, totalPutts = 0
    let onePutts = 0, twoPutts = 0, threePlusPutts = 0
    let birdies = 0, eagles = 0
    let holesPlayed = 0

    for (let i = 0; i < totalHoles; i++) {
      const s = scores?.[player.id]?.[i]
      if (s?.strokes > 0) {
        const par = holePars[i] ?? 4
        const diff = s.strokes - par
        totalStrokes += s.strokes
        totalPar += par
        totalPutts += s.putts ?? 0
        holesPlayed++
        if (diff <= -2) eagles++
        if (diff === -1) birdies++
        if (s.putts === 1) onePutts++
        else if (s.putts === 2) twoPutts++
        else if (s.putts >= 3) threePlusPutts++
      }
    }

    const avgPutts = holesPlayed > 0 ? totalPutts / holesPlayed : 0
    let puttLevel = ''
    if (totalPutts <= 29) puttLevel = 'PGA 투어 수준 🏆'
    else if (totalPutts <= 32) puttLevel = '싱글 수준 ⭐'
    else if (totalPutts <= 36) puttLevel = '아마추어 평균 👍'
    else puttLevel = '연습 필요 💪'

    return {
      ...player,
      totalStrokes, totalPar, scoreDiff: totalStrokes - totalPar,
      totalPutts, avgPutts: avgPutts.toFixed(1),
      onePutts, twoPutts, threePlusPutts,
      birdies, eagles, holesPlayed, puttLevel,
    }
  })

  // 스킨스 계산
  const skinResults = []
  let carryOver = 0
  if (skinsAmount > 0) {
    for (let i = 0; i < totalHoles; i++) {
      const holeScores = players.map(p => ({
        player: p,
        strokes: scores?.[p.id]?.[i]?.strokes ?? 0,
      })).filter(s => s.strokes > 0)

      if (holeScores.length === 0) continue
      const minScore = Math.min(...holeScores.map(s => s.strokes))
      const winners = holeScores.filter(s => s.strokes === minScore)

      if (winners.length === 1) {
        const skins = 1 + carryOver
        skinResults.push({ hole: i + 1, winner: winners[0].player, skins, amount: skins * skinsAmount })
        carryOver = 0
      } else {
        carryOver++
        skinResults.push({ hole: i + 1, winner: null, skins: 0, carryOver: true })
      }
    }
  }

  // MVP, 퍼팅왕, 버디킹
  const sortedByScore = [...stats].sort((a, b) => a.scoreDiff - b.scoreDiff)
  const sortedByPutts = [...stats].sort((a, b) => a.totalPutts - b.totalPutts)
  const sortedByBirdies = [...stats].sort((a, b) => (b.birdies + b.eagles * 2) - (a.birdies + a.eagles * 2))

  const mvp = sortedByScore[0]
  const puttKing = sortedByPutts[0]
  const birdieKing = sortedByBirdies[0]

  // 결과 공유 텍스트
  function getShareText() {
    const date = new Date().toLocaleDateString('ko-KR')
    const lines = [
      `⛳ 버디타임 골프 결과`,
      `📅 ${date} · ${courseName}`,
      ``,
      `🏆 최종 순위`,
      ...sortedByScore.map((p, i) => {
        const medal = ['🥇','🥈','🥉'][i] ?? `${i+1}.`
        const diff = p.scoreDiff === 0 ? 'E' : p.scoreDiff > 0 ? `+${p.scoreDiff}` : `${p.scoreDiff}`
        return `${medal} ${p.name} (${diff})`
      }),
      ``,
      `🎯 MVP: ${mvp?.name}`,
      `🔵 퍼팅왕: ${puttKing?.name} (${puttKing?.totalPutts}개)`,
      `🐦 버디킹: ${birdieKing?.name} (버디 ${birdieKing?.birdies}개)`,
    ]
    if (skinsAmount > 0 && skinResults.length > 0) {
      const skinWins = {}
      skinResults.filter(s => s.winner).forEach(s => {
        const name = s.winner.name
        if (!skinWins[name]) skinWins[name] = 0
        skinWins[name] += s.amount
      })
      lines.push(``, `💰 스킨스 결과`)
      Object.entries(skinWins).forEach(([name, amt]) => {
        lines.push(`${name}: +${amt.toLocaleString()}원`)
      })
    }
    return lines.join('\n')
  }

  function shareResult() {
    const text = getShareText()
    if (navigator.share) navigator.share({ text })
    else { navigator.clipboard?.writeText(text); alert('클립보드에 복사되었습니다!') }
  }

  return (
    <div className="overflow-y-auto h-full px-4 py-4 space-y-5">
      {/* 결과 요약 카드 */}
      <div className="bg-gradient-to-br from-[#162449] to-[#1a2d5a] rounded-2xl p-4">
        <p className="text-gray-400 text-xs mb-1">{courseName}</p>
        <p className="text-white font-bold text-sm mb-3">{new Date().toLocaleDateString('ko-KR')}</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '🎯 MVP', value: mvp?.name },
            { label: '🔵 퍼팅왕', value: puttKing?.name },
            { label: '🐦 버디킹', value: birdieKing?.name },
          ].map(item => (
            <div key={item.label} className="bg-[#0D1B3E]/50 rounded-xl p-2 text-center">
              <p className="text-gray-400 text-xs">{item.label}</p>
              <p className="text-white font-bold text-sm truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 퍼팅 통계 */}
      <div>
        <h3 className="text-white font-bold text-base mb-3">🔵 퍼팅 통계</h3>
        <div className="space-y-3">
          {stats.map(p => (
            <div key={p.id} className="bg-[#162449] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: p.color }}>
                  {p.name[0]}
                </div>
                <span className="text-white font-bold">{p.name}</span>
                <span className="ml-auto text-xs text-[#60A5FA]">{p.puttLevel}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: '총 퍼팅', value: p.totalPutts },
                  { label: '홀 평균', value: p.avgPutts },
                  { label: '1퍼팅', value: `${p.onePutts}홀` },
                  { label: '3퍼팅↑', value: `${p.threePlusPutts}홀` },
                ].map(item => (
                  <div key={item.label} className="bg-[#0D1B3E] rounded-lg p-2">
                    <p className="text-gray-400 text-xs">{item.label}</p>
                    <p className="text-[#60A5FA] font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 스킨스 정산 */}
      {skinsAmount > 0 && (
        <div>
          <h3 className="text-white font-bold text-base mb-3">💰 스킨스 정산 (홀당 {skinsAmount.toLocaleString()}원)</h3>
          <div className="bg-[#162449] rounded-xl overflow-hidden">
            {skinResults.map(result => (
              <div key={result.hole} className={`flex items-center px-4 py-2.5 border-b border-[#0D1B3E]/50
                ${result.winner ? 'bg-[#E8B84B]/10' : ''}`}>
                <span className="text-gray-400 text-sm w-10">{result.hole}홀</span>
                {result.winner ? (
                  <>
                    <div className="w-5 h-5 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: result.winner.color }} />
                    <span className="text-white text-sm font-bold flex-1">{result.winner.name}</span>
                    <span className="text-[#E8B84B] font-bold text-sm">
                      {result.skins}스킨 · +{result.amount.toLocaleString()}원
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">이월 (carry over)</span>
                )}
              </div>
            ))}

            {/* 최종 정산 */}
            <div className="px-4 py-3 bg-[#0D1B3E]/50">
              <p className="text-[#E8B84B] font-bold text-sm mb-2">최종 정산</p>
              {players.map(player => {
                const earned = skinResults.filter(s => s.winner?.id === player.id)
                  .reduce((sum, s) => sum + s.amount, 0)
                const totalSkins = skinResults.filter(s => s.winner?.id === player.id).length
                const totalPot = skinsAmount * totalHoles
                const paid = totalPot / players.length
                const net = earned - paid
                return (
                  <div key={player.id} className="flex items-center gap-2 py-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                    <span className="text-white text-sm flex-1">{player.name}</span>
                    <span className={`font-bold text-sm ${net >= 0 ? 'text-[#E8B84B]' : 'text-red-400'}`}>
                      {net >= 0 ? '+' : ''}{net.toLocaleString()}원
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-2 text-center">카카오페이로 정산하세요 💸</p>
        </div>
      )}

      {/* 공유 버튼 */}
      <div className="pb-4">
        <button
          onClick={shareResult}
          className="w-full bg-[#E8B84B] text-[#0D1B3E] font-black py-4 rounded-2xl text-base transition-all active:scale-95"
        >
          📤 결과 공유하기 (카카오/문자)
        </button>
      </div>
    </div>
  )
}
