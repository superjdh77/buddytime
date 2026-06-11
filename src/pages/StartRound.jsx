import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, set } from 'firebase/database'
import { getProfile, generateId } from '../utils/auth'
import { COURSES } from '../data/courses'

const DEFAULT_PAR = [4, 4, 3, 5, 4, 4, 3, 5, 4]

export default function StartRound() {
  const navigate = useNavigate()
  const profile = getProfile()
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [customName, setCustomName] = useState('')
  const [customHoles, setCustomHoles] = useState(18)
  const [starting, setStarting] = useState(false)

  function getCourse() {
    if (!selectedCourse) return null
    if (selectedCourse.id === 'custom') {
      const pars = Array.from({ length: customHoles }, (_, i) => DEFAULT_PAR[i % DEFAULT_PAR.length])
      return { ...selectedCourse, name: customName || '직접 입력', holes: customHoles, pars, totalPar: pars.reduce((a,b)=>a+b,0) }
    }
    return selectedCourse
  }

  async function startRound() {
    const course = getCourse()
    if (!course) return
    setStarting(true)

    const roundId = generateId()
    const now = Date.now()
    const today = new Date()
    const roundData = {
      id: roundId,
      playerName: profile.name,
      playerColor: profile.color,
      groupCode: profile.groups?.[0] || null,
      courseId: course.id,
      courseName: course.name,
      totalHoles: course.holes,
      holePars: course.pars,
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

    try {
      await set(ref(db, `rounds/${roundId}`), roundData)
      navigate(`/live/${roundId}`)
    } catch (e) {
      alert('시작 실패: ' + e.message)
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 text-2xl">←</button>
        <h2 className="text-white font-bold text-lg">골프장 선택</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {COURSES.map(course => (
          <div
            key={course.id}
            onClick={() => setSelectedCourse(course)}
            className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all
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

        {/* 직접 입력 옵션 */}
        {selectedCourse?.id === 'custom' && (
          <div className="bg-[#162449] rounded-2xl p-4 space-y-3">
            <input
              type="text"
              placeholder="골프장 이름 입력"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full bg-[#0D1B3E] text-white rounded-xl px-4 py-3 outline-none border border-[#4A9FE0]/30 focus:border-[#4A9FE0]"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-300 text-sm">홀 수:</span>
              {[9, 18, 27, 36].map(h => (
                <button key={h} onClick={() => setCustomHoles(h)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all
                    ${customHoles === h ? 'bg-[#4A9FE0] text-white' : 'bg-[#0D1B3E] text-gray-400'}`}>
                  {h}홀
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={startRound}
        disabled={!selectedCourse || starting}
        className="w-full bg-[#E8B84B] text-[#0D1B3E] font-black py-5 rounded-2xl text-lg mt-4 disabled:opacity-40 transition-all active:scale-95 shadow-lg"
      >
        {starting ? '시작 중...' : '🔴 생중계 시작!'}
      </button>

      <p className="text-center text-gray-500 text-xs mt-2">
        시작하면 친구들이 실시간으로 내 스코어를 볼 수 있어요
      </p>
    </div>
  )
}
