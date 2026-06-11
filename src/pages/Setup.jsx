import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, set } from 'firebase/database'
import { COURSES, PLAYER_COLORS } from '../data/courses'

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const DEFAULT_PAR_PATTERN = [4, 4, 3, 5, 4, 4, 3, 5, 4]

export default function Setup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1:골프장, 2:플레이어, 3:설정
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [customName, setCustomName] = useState('')
  const [customHoles, setCustomHoles] = useState(18)
  const [players, setPlayers] = useState([{ name: '', colorIdx: 0 }])
  const [skinsAmount, setSkinsAmount] = useState(5000)
  const [creating, setCreating] = useState(false)

  function getCourseData() {
    if (selectedCourse?.id === 'custom') {
      const pars = Array.from({ length: customHoles }, (_, i) => DEFAULT_PAR_PATTERN[i % DEFAULT_PAR_PATTERN.length])
      return { ...selectedCourse, name: customName || '직접 입력', holes: customHoles, pars, totalPar: pars.reduce((a, b) => a + b, 0) }
    }
    return selectedCourse
  }

  function addPlayer() {
    if (players.length >= 6) return
    const usedColors = players.map(p => p.colorIdx)
    const nextColor = [0,1,2,3,4,5].find(c => !usedColors.includes(c)) ?? players.length
    setPlayers([...players, { name: '', colorIdx: nextColor }])
  }

  function removePlayer(idx) {
    if (players.length <= 1) return
    setPlayers(players.filter((_, i) => i !== idx))
  }

  function updatePlayer(idx, field, val) {
    const updated = [...players]
    updated[idx] = { ...updated[idx], [field]: val }
    setPlayers(updated)
  }

  async function startGame() {
    const course = getCourseData()
    const filledPlayers = players.filter(p => p.name.trim())
    if (!course || filledPlayers.length < 1) return
    setCreating(true)
    const roomCode = generateRoomCode()
    const gameData = {
      roomCode,
      courseId: course.id,
      courseName: course.name,
      totalHoles: course.holes,
      holePars: course.pars,
      skinsAmount,
      players: filledPlayers.map((p, i) => ({
        id: `p${i}`,
        name: p.name.trim(),
        color: PLAYER_COLORS[p.colorIdx].bg,
      })),
      scores: {},
      currentHole: 0,
      status: 'playing',
      createdAt: Date.now(),
    }
    try {
      await set(ref(db, `rooms/${roomCode}`), gameData)
      navigate(`/game/${roomCode}`)
    } catch (e) {
      alert('게임 생성 실패: ' + e.message)
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className="text-gray-400 text-2xl mr-3">←</button>
        <h2 className="text-white font-bold text-lg">
          {step === 1 ? '골프장 선택' : step === 2 ? '플레이어 설정' : '게임 설정'}
        </h2>
        <div className="ml-auto flex gap-1">
          {[1,2,3].map(s => (
            <div key={s} className={`w-2 h-2 rounded-full ${s <= step ? 'bg-[#4A9FE0]' : 'bg-gray-600'}`} />
          ))}
        </div>
      </div>

      {/* STEP 1: 골프장 선택 */}
      {step === 1 && (
        <div className="flex-1">
          <div className="space-y-2">
            {COURSES.map(course => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all
                  ${selectedCourse?.id === course.id
                    ? 'bg-[#4A9FE0]/20 border-2 border-[#4A9FE0]'
                    : 'bg-[#162449] border-2 border-transparent'}`}
              >
                <div>
                  <p className="text-white font-bold">{course.name}</p>
                  <p className="text-gray-400 text-xs">{course.location} · {course.holes}홀 · Par {course.totalPar}</p>
                </div>
                {selectedCourse?.id === course.id && <span className="text-[#4A9FE0] text-xl">✓</span>}
              </div>
            ))}
          </div>

          {/* 직접 입력 옵션 */}
          {selectedCourse?.id === 'custom' && (
            <div className="mt-4 bg-[#162449] rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder="골프장 이름"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full bg-[#0D1B3E] text-white rounded-xl px-4 py-3 outline-none border border-[#4A9FE0]/30"
              />
              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-sm">홀 수</span>
                {[9, 18, 27, 36].map(h => (
                  <button
                    key={h}
                    onClick={() => setCustomHoles(h)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all
                      ${customHoles === h ? 'bg-[#4A9FE0] text-white' : 'bg-[#0D1B3E] text-gray-400'}`}
                  >
                    {h}홀
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            disabled={!selectedCourse}
            onClick={() => setStep(2)}
            className="w-full bg-[#4A9FE0] text-white font-bold py-4 rounded-2xl mt-6 disabled:opacity-40 transition-all active:scale-95"
          >
            다음 →
          </button>
        </div>
      )}

      {/* STEP 2: 플레이어 설정 */}
      {step === 2 && (
        <div className="flex-1">
          <div className="space-y-3">
            {players.map((player, idx) => (
              <div key={idx} className="bg-[#162449] rounded-xl p-3 flex items-center gap-3">
                {/* 색상 선택 */}
                <div className="flex gap-1 flex-wrap w-16">
                  {PLAYER_COLORS.map((c, ci) => (
                    <button
                      key={ci}
                      onClick={() => updatePlayer(idx, 'colorIdx', ci)}
                      style={{ backgroundColor: c.bg }}
                      className={`w-6 h-6 rounded-full transition-all ${player.colorIdx === ci ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                    />
                  ))}
                </div>
                {/* 이름 입력 */}
                <input
                  type="text"
                  placeholder={`플레이어 ${idx + 1}`}
                  value={player.name}
                  onChange={e => updatePlayer(idx, 'name', e.target.value)}
                  className="flex-1 bg-[#0D1B3E] text-white rounded-xl px-3 py-2.5 outline-none border border-transparent focus:border-[#4A9FE0]/50"
                  style={{ color: PLAYER_COLORS[player.colorIdx].bg }}
                />
                {/* 삭제 */}
                {players.length > 1 && (
                  <button onClick={() => removePlayer(idx)} className="text-gray-500 text-xl">×</button>
                )}
              </div>
            ))}
          </div>

          {players.length < 6 && (
            <button
              onClick={addPlayer}
              className="w-full border-2 border-dashed border-gray-600 text-gray-400 py-3 rounded-xl mt-3 text-sm"
            >
              + 플레이어 추가 (최대 6명)
            </button>
          )}

          <button
            disabled={players.filter(p => p.name.trim()).length < 1}
            onClick={() => setStep(3)}
            className="w-full bg-[#4A9FE0] text-white font-bold py-4 rounded-2xl mt-6 disabled:opacity-40 transition-all active:scale-95"
          >
            다음 →
          </button>
        </div>
      )}

      {/* STEP 3: 게임 설정 */}
      {step === 3 && (
        <div className="flex-1">
          <div className="bg-[#162449] rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-sm mb-1">선택한 골프장</p>
            <p className="text-white font-bold">{getCourseData()?.name}</p>
            <p className="text-gray-400 text-xs">{getCourseData()?.holes}홀 · Par {getCourseData()?.totalPar}</p>
          </div>

          <div className="bg-[#162449] rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-sm mb-2">참여 플레이어</p>
            <div className="flex gap-2 flex-wrap">
              {players.filter(p => p.name.trim()).map((p, i) => (
                <span
                  key={i}
                  style={{ backgroundColor: PLAYER_COLORS[p.colorIdx].bg + '33', color: PLAYER_COLORS[p.colorIdx].bg, borderColor: PLAYER_COLORS[p.colorIdx].bg }}
                  className="px-3 py-1 rounded-full text-sm font-bold border"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* 스킨스 금액 */}
          <div className="bg-[#162449] rounded-xl p-4 mb-6">
            <p className="text-white font-bold mb-3">💰 스킨스 홀당 금액</p>
            <div className="flex gap-2 flex-wrap">
              {[0, 1000, 3000, 5000, 10000, 20000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSkinsAmount(amt)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all
                    ${skinsAmount === amt ? 'bg-[#E8B84B] text-[#0D1B3E]' : 'bg-[#0D1B3E] text-gray-300'}`}
                >
                  {amt === 0 ? '없음' : `${amt.toLocaleString()}원`}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={creating}
            className="w-full bg-[#E8B84B] text-[#0D1B3E] font-black py-4 rounded-2xl text-lg disabled:opacity-50 transition-all active:scale-95"
          >
            {creating ? '게임 생성 중...' : '🏌️ 게임 시작!'}
          </button>
        </div>
      )}
    </div>
  )
}
