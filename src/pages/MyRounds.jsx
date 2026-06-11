import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database'
import { getProfile, getLocalHistory } from '../utils/auth'
import { calcHandicap, calcStats, puttLevel } from '../utils/handicap'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function MyRounds() {
  const navigate = useNavigate()
  const profile = getProfile()
  const [rounds, setRounds] = useState([])
  const [filter, setFilter] = useState('all') // all | month | year

  useEffect(() => {
    // Firebase에서 내 라운드 가져오기
    const myRef = query(ref(db, 'rounds'), orderByChild('playerName'), equalTo(profile?.name))
    return onValue(myRef, snap => {
      if (!snap.exists()) {
        // Firebase 없으면 로컬 히스토리 사용
        setRounds(getLocalHistory())
        return
      }
      const arr = Object.values(snap.val())
        .filter(r => !r.isLive)
        .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
      setRounds(arr)
    })
  }, [])

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const thisYear = String(now.getFullYear())

  const filtered = rounds.filter(r => {
    if (filter === 'month') return r.month === thisMonth
    if (filter === 'year') return r.year === thisYear
    return true
  })

  // 통계
  const statsData = filtered.map(r => ({
    ...r,
    totalPar: r.totalPar || (r.holePars || []).reduce((a,b)=>a+b,0),
  }))
  const stats = calcStats(statsData)
  const handicap = calcHandicap(statsData)

  // 월별 그룹핑
  const byMonth = {}
  filtered.forEach(r => {
    const key = r.month || r.year || '기타'
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(r)
  })

  function scoreDiffLabel(r) {
    const strokes = r.totalStrokes || Object.values(r.scores || {}).reduce((a, s) => a + (s.strokes || 0), 0)
    const par = r.totalPar || (r.holePars || []).reduce((a, b) => a + b, 0)
    const diff = strokes - par
    return {
      strokes,
      diff,
      color: diff < 0 ? '#E8B84B' : diff === 0 ? '#ffffff' : '#EF4444',
      label: diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`,
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      <div className="bg-[#162449] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 text-2xl">←</button>
        <h2 className="text-white font-bold text-lg flex-1">📋 내 라운드 기록</h2>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
          style={{ backgroundColor: profile?.color }}>
          {profile?.name?.[0]}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 통계 요약 */}
        {stats && (
          <div className="mx-4 mt-4 bg-[#162449] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold text-sm">📊 나의 골프</p>
              {handicap !== null && (
                <div className="bg-[#4A9FE0]/20 px-3 py-1 rounded-full">
                  <span className="text-[#4A9FE0] text-xs font-bold">핸디캡 {handicap > 0 ? `+${handicap}` : handicap}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: '라운드', value: stats.totalRounds },
                { label: '베스트', value: stats.best > 0 ? `+${stats.best}` : stats.best <= 0 ? stats.best : '-', color: '#E8B84B' },
                { label: '평균', value: stats.avg > 0 ? `+${stats.avg}` : stats.avg },
                { label: '버디', value: `${stats.totalBirdies}개`, color: '#10B981' },
              ].map(item => (
                <div key={item.label} className="bg-[#0D1B3E] rounded-xl p-2">
                  <p className="text-gray-400 text-xs">{item.label}</p>
                  <p className="font-black text-base" style={{ color: item.color || 'white' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="px-4 mt-4 flex gap-2">
          {[['all','전체'],['month','이달'],['year','올해']].map(([v, label]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all
                ${filter === v ? 'bg-[#4A9FE0] text-white' : 'bg-[#162449] text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* 라운드 목록 */}
        <div className="px-4 mt-4 pb-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">⛳</p>
              <p className="text-gray-400 text-sm">아직 기록이 없습니다</p>
              <button onClick={() => navigate('/start')}
                className="mt-3 text-[#4A9FE0] text-sm underline">
                첫 라운드 시작하기
              </button>
            </div>
          ) : (
            Object.entries(byMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, monthRounds]) => (
                <div key={month}>
                  <p className="text-gray-400 text-xs font-bold mb-2">
                    {month.includes('-') ? `${month.split('-')[0]}년 ${parseInt(month.split('-')[1])}월` : month}
                  </p>
                  <div className="space-y-2">
                    {monthRounds.map(r => {
                      const sd = scoreDiffLabel(r)
                      const totalPutts = Object.values(r.scores || {}).reduce((a, s) => a + (s.putts || 0), 0)
                      const holesPlayed = Object.values(r.scores || {}).filter(s => s.strokes > 0).length
                      const pLevel = puttLevel(totalPutts, holesPlayed)
                      return (
                        <div key={r.id} onClick={() => navigate(`/watch/${r.id}`)}
                          className="bg-[#162449] rounded-2xl p-4 cursor-pointer active:scale-98 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white font-bold">{r.courseName}</p>
                              <p className="text-gray-400 text-xs">{r.date} · {r.totalHoles}홀</p>
                              {r.note && <p className="text-gray-500 text-xs mt-1 italic">"{r.note}"</p>}
                            </div>
                            <div className="text-right ml-3">
                              <p className="font-black text-2xl" style={{ color: sd.color }}>{sd.label}</p>
                              <p className="text-gray-400 text-xs">{sd.strokes}타</p>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            {r.birdies > 0 && <span className="text-green-400">🐦 버디 {r.birdies}개</span>}
                            {r.eagles > 0 && <span className="text-[#E8B84B]">🦅 이글 {r.eagles}개</span>}
                            {pLevel && <span style={{ color: pLevel.color }}>{pLevel.emoji} {pLevel.label}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
