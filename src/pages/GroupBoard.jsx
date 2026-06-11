import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, onValue, set, update, get } from 'firebase/database'
import { getProfile, saveProfile, generateGroupCode } from '../utils/auth'

export default function GroupBoard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(getProfile())
  const [group, setGroup] = useState(null)
  const [groupRounds, setGroupRounds] = useState([])
  const [tab, setTab] = useState('month') // month | year | best
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')

  const groupCode = profile?.groups?.[0]

  useEffect(() => {
    if (!groupCode) return
    // 그룹 정보
    const unsub1 = onValue(ref(db, `groups/${groupCode}`), snap => {
      if (snap.exists()) setGroup(snap.val())
    })
    // 그룹 라운드
    const unsub2 = onValue(ref(db, 'rounds'), snap => {
      if (!snap.exists()) return
      const arr = Object.values(snap.val())
        .filter(r => !r.isLive && r.groupCode === groupCode)
        .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
      setGroupRounds(arr)
    })
    return () => { unsub1(); unsub2() }
  }, [groupCode])

  async function createGroup() {
    if (!groupName.trim()) { setError('그룹 이름을 입력하세요'); return }
    const code = generateGroupCode()
    const groupData = {
      code,
      name: groupName.trim(),
      createdBy: profile.name,
      createdAt: Date.now(),
      members: { [profile.name]: { color: profile.color, joinedAt: Date.now() } },
    }
    await set(ref(db, `groups/${code}`), groupData)
    const newProfile = { ...profile, groups: [code] }
    saveProfile(newProfile)
    setProfile(newProfile)
    setGroup(groupData)
  }

  async function joinGroup() {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) { setError('6자리 코드를 입력하세요'); return }
    const snap = await get(ref(db, `groups/${code}`))
    if (!snap.exists()) { setError('그룹을 찾을 수 없습니다'); return }
    await update(ref(db, `groups/${code}/members/${profile.name}`), {
      color: profile.color,
      joinedAt: Date.now(),
    })
    const newProfile = { ...profile, groups: [code] }
    saveProfile(newProfile)
    setProfile(newProfile)
  }

  async function leaveGroup() {
    if (!confirm('그룹에서 나가시겠습니까?')) return
    const newProfile = { ...profile, groups: [] }
    saveProfile(newProfile)
    setProfile(newProfile)
    setGroup(null)
    setGroupRounds([])
  }

  // 랭킹 계산
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const thisYear = String(now.getFullYear())

  function calcRankings(rounds) {
    const playerMap = {}
    rounds.forEach(r => {
      const strokes = r.totalStrokes || Object.values(r.scores || {}).reduce((a,s)=>a+(s.strokes||0),0)
      const par = r.totalPar || (r.holePars||[]).reduce((a,b)=>a+b,0)
      if (strokes === 0) return
      const diff = strokes - par
      if (!playerMap[r.playerName]) {
        playerMap[r.playerName] = { name: r.playerName, color: r.playerColor, rounds: 0, totalDiff: 0, bestDiff: Infinity, birdies: 0, eagles: 0 }
      }
      const p = playerMap[r.playerName]
      p.rounds++
      p.totalDiff += diff
      if (diff < p.bestDiff) p.bestDiff = diff
      p.birdies += r.birdies || 0
      p.eagles += r.eagles || 0
    })
    return Object.values(playerMap).map(p => ({
      ...p,
      avgDiff: p.rounds > 0 ? Math.round((p.totalDiff / p.rounds) * 10) / 10 : 0,
    }))
  }

  const monthRounds = groupRounds.filter(r => r.month === thisMonth)
  const yearRounds = groupRounds.filter(r => r.year === thisYear)

  const monthRankings = calcRankings(monthRounds).sort((a,b) => a.avgDiff - b.avgDiff)
  const yearRankings = calcRankings(yearRounds).sort((a,b) => a.avgDiff - b.avgDiff)
  const bestRankings = calcRankings(groupRounds).sort((a,b) => a.bestDiff - b.bestDiff)

  const rankings = tab === 'month' ? monthRankings : tab === 'year' ? yearRankings : bestRankings
  const medals = ['🥇','🥈','🥉']

  function shareGroup() {
    if (!groupCode) return
    const msg = `⛳ 버디타임 그룹 초대\n그룹: ${group?.name}\n참여 코드: ${groupCode}\nhttps://buddytime.vercel.app`
    if (navigator.share) navigator.share({ text: msg })
    else { navigator.clipboard?.writeText(msg); alert('초대 코드가 복사되었습니다!') }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E]">
      <div className="bg-[#162449] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 text-2xl">←</button>
        <h2 className="text-white font-bold text-lg flex-1">👥 그룹 순위</h2>
        {group && (
          <button onClick={shareGroup} className="text-[#4A9FE0] text-xs font-bold">초대</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* 그룹 없음 */}
        {!groupCode && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-5xl mb-3">👥</p>
              <p className="text-white font-bold mb-1">그룹을 만들거나 참여하세요</p>
              <p className="text-gray-400 text-sm">친구들과 스코어를 함께 관리해요</p>
            </div>

            {/* 그룹 만들기 */}
            <div className="bg-[#162449] rounded-2xl p-4 space-y-3">
              <p className="text-white font-bold">새 그룹 만들기</p>
              <input
                type="text"
                placeholder="그룹 이름 (예: 회사 골프 모임)"
                value={groupName}
                onChange={e => { setGroupName(e.target.value); setError('') }}
                className="w-full bg-[#0D1B3E] text-white rounded-xl px-4 py-3 outline-none border border-[#4A9FE0]/30 focus:border-[#4A9FE0]"
              />
              <button onClick={createGroup}
                className="w-full bg-[#4A9FE0] text-white font-bold py-3 rounded-xl transition-all active:scale-95">
                그룹 만들기
              </button>
            </div>

            {/* 참여하기 */}
            <div className="bg-[#162449] rounded-2xl p-4 space-y-3">
              <p className="text-white font-bold">초대 코드로 참여</p>
              <input
                type="text"
                placeholder="6자리 코드 입력"
                maxLength={6}
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                className="w-full bg-[#0D1B3E] text-white text-center text-xl font-bold tracking-widest rounded-xl py-3 outline-none border border-[#E8B84B]/30 focus:border-[#E8B84B]"
              />
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              <button onClick={joinGroup}
                className="w-full bg-[#E8B84B] text-[#0D1B3E] font-bold py-3 rounded-xl transition-all active:scale-95">
                참여하기
              </button>
            </div>
          </div>
        )}

        {/* 그룹 있음 */}
        {groupCode && group && (
          <div className="space-y-4">
            {/* 그룹 정보 */}
            <div className="bg-[#162449] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-black text-lg">{group.name}</p>
                  <p className="text-gray-400 text-xs">코드: <span className="font-mono font-bold text-[#4A9FE0]">{groupCode}</span> · {Object.keys(group.members || {}).length}명</p>
                </div>
                <button onClick={shareGroup}
                  className="bg-[#E8B84B]/20 text-[#E8B84B] text-xs font-bold px-3 py-2 rounded-lg">
                  📤 초대
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(group.members || {}).map(([name, info]) => (
                  <div key={name} className="flex items-center gap-1.5 bg-[#0D1B3E] rounded-full px-3 py-1.5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: info.color }} />
                    <span className="text-white text-xs font-bold">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 탭 */}
            <div className="flex gap-2">
              {[['month','이달'],['year','올해'],['best','전체 베스트']].map(([v, label]) => (
                <button key={v} onClick={() => setTab(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                    ${tab === v ? 'bg-[#4A9FE0] text-white' : 'bg-[#162449] text-gray-400'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* 순위 */}
            {rankings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">
                  {tab === 'month' ? '이달' : tab === 'year' ? '올해' : ''}에 기록된 라운드가 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankings.map((p, rank) => (
                  <div key={p.name}
                    className={`bg-[#162449] rounded-2xl p-4 flex items-center gap-3
                      ${rank === 0 ? 'border border-[#E8B84B]/40' : ''}`}>
                    <span className="text-xl w-8">{medals[rank] ?? rank + 1}</span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black"
                      style={{ backgroundColor: p.color }}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{p.name}</p>
                      <p className="text-gray-400 text-xs">
                        {p.rounds}라운드
                        {p.birdies > 0 && ` · 버디 ${p.birdies}개`}
                        {p.eagles > 0 && ` · 이글 ${p.eagles}개`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-lg ${
                        (tab === 'best' ? p.bestDiff : p.avgDiff) < 0 ? 'text-[#E8B84B]' :
                        (tab === 'best' ? p.bestDiff : p.avgDiff) === 0 ? 'text-white' : 'text-red-400'
                      }`}>
                        {(() => {
                          const d = tab === 'best' ? p.bestDiff : p.avgDiff
                          return d === 0 ? 'E' : d > 0 ? `+${d}` : d
                        })()}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {tab === 'best' ? '베스트' : '평균'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 최근 그룹 라운드 */}
            {groupRounds.slice(0, 5).length > 0 && (
              <div>
                <p className="text-white font-bold text-sm mb-2">최근 그룹 라운드</p>
                <div className="space-y-2">
                  {groupRounds.slice(0, 5).map(r => {
                    const strokes = r.totalStrokes || Object.values(r.scores||{}).reduce((a,s)=>a+(s.strokes||0),0)
                    const par = r.totalPar || (r.holePars||[]).reduce((a,b)=>a+b,0)
                    const diff = strokes - par
                    return (
                      <div key={r.id} onClick={() => navigate(`/watch/${r.id}`)}
                        className="bg-[#162449] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                          style={{ backgroundColor: r.playerColor }}>
                          {r.playerName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">{r.playerName}</p>
                          <p className="text-gray-400 text-xs">{r.courseName} · {r.date}</p>
                        </div>
                        <p className={`font-black ${
                          diff < 0 ? 'text-[#E8B84B]' : diff === 0 ? 'text-white' : 'text-red-400'
                        }`}>
                          {diff === 0 ? 'E' : diff > 0 ? `+${diff}` : diff}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button onClick={leaveGroup} className="text-gray-600 text-xs text-center w-full mt-4">
              그룹 나가기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
