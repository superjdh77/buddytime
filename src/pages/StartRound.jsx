import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, set } from 'firebase/database'
import { getProfile, generateId, generateRoomCode, setActiveRound, saveRoundBackup } from '../utils/auth'
import { REGIONS } from '../data/courses'

export default function StartRound() {
  const navigate = useNavigate()
  const profile = getProfile()

  // 선택 단계: region → course → subCourse
  const [regionId,    setRegionId]    = useState(null)
  const [courseId,    setCourseId]    = useState(null)
  const [subCourseId, setSubCourseId] = useState(null)
  const [customName,  setCustomName]  = useState('')
  const [customHoles, setCustomHoles] = useState(18)
  const [starting,    setStarting]    = useState(false)

  // 파생 데이터
  const region    = REGIONS.find(r => r.id === regionId)
  const course    = region?.courses.find(c => c.id === courseId)
  const subCourse = course?.subCourses.find(sc => sc.id === subCourseId)
  const multiSub  = (course?.subCourses?.length ?? 0) > 1

  // 지역 선택 시 하위 초기화
  function selectRegion(id) {
    setRegionId(id)
    setCourseId(null)
    setSubCourseId(null)
  }

  // 골프장 선택 시 subCourse 자동 처리
  function selectCourse(id) {
    setCourseId(id)
    setSubCourseId(null)
    const c = region?.courses.find(c => c.id === id)
    if (c && c.subCourses.length === 1) {
      setSubCourseId(c.subCourses[0].id) // 단일 코스 자동 선택
    }
  }

  // 현재 선택된 실제 코스 데이터
  function getSelectedCourse() {
    if (!subCourse) return null
    if (courseId === 'custom') {
      const DEFAULT = [4,5,3,4,4,3,5,4,4, 4,3,5,4,4,3,4,5,4]
      const pars = Array.from({ length: customHoles }, (_, i) => DEFAULT[i % DEFAULT.length])
      return { name: customName || '직접 입력', holes: customHoles, pars, totalPar: pars.reduce((a,b)=>a+b,0) }
    }
    return {
      name: course.subCourses.length > 1
        ? `${course.name} (${subCourse.name})`
        : course.name,
      holes: subCourse.holes,
      pars: subCourse.pars,
      totalPar: subCourse.totalPar,
    }
  }

  async function startRound() {
    const c = getSelectedCourse()
    if (!c) return
    setStarting(true)

    const roundId = generateId()
    const roomCode = generateRoomCode()
    const now = Date.now()
    const today = new Date()
    const roundData = {
      id: roundId,
      playerName: profile.name,
      playerColor: profile.color,
      groupCode: profile.groups?.[0] || null,
      roomCode,
      isHost: true,
      courseId: `${regionId}_${courseId}_${subCourseId}`,
      courseName: c.name,
      totalHoles: c.holes,
      holePars: c.pars,
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

    // 방(룸) 생성 — 친구들이 코드/링크로 들어와서 선수 또는 갤러리로 참여
    const roomData = {
      code: roomCode,
      hostName: profile.name,
      courseName: c.name,
      totalHoles: c.holes,
      holePars: c.pars,
      isLive: true,
      createdAt: now,
      players: { [profile.name]: roundId },
      gallery: {},
    }

    // 골프장은 신호가 약할 수 있어서 서버 저장을 기다리지 않고 바로 진행.
    // 로컬 백업을 먼저 남겨두면 서버 전송이 늦거나 실패해도 이어하기가 가능함.
    setActiveRound(roundId)
    saveRoundBackup(roundData)
    navigate(`/live/${roundId}`)

    set(ref(db, `rounds/${roundId}`), roundData).catch(() => {
      // 오프라인 등으로 실패해도 로컬 백업이 있으니 괜찮음 — 연결되면 LiveScore에서 재시도함
    })
    set(ref(db, `rooms/${roomCode}`), roomData).catch(() => {})
  }

  // ── 현재 단계 결정 ──
  const step = !regionId ? 1 : !courseId ? 2 : !subCourseId ? 3 : 4

  // 단계 타이틀
  const stepTitles = ['', '지역 선택', '골프장 선택', '코스 선택', '시작 준비 완료']

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-4 py-5">

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            if (step === 1) navigate('/')
            else if (step === 2) selectRegion(null)
            else if (step === 3) { setCourseId(null); setSubCourseId(null) }
            else { setSubCourseId(null) }
          }}
          className="text-gray-400 text-2xl"
        >←</button>
        <h2 className="text-white font-bold text-lg flex-1">{stepTitles[step]}</h2>
        <button onClick={() => navigate('/')} className="text-gray-400 text-xl">🏠</button>
      </div>

      {/* 진행 표시기 */}
      <div className="flex gap-1.5 mb-5">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s < step ? 'bg-[#4A9FE0]' : s === step ? 'bg-[#E8B84B]' : 'bg-[#162449]'}`} />
        ))}
      </div>

      {/* ── STEP 1: 지역 선택 ── */}
      {step === 1 && (
        <div className="flex-1 grid grid-cols-3 gap-3">
          {REGIONS.map(r => (
            <button
              key={r.id}
              onClick={() => selectRegion(r.id)}
              className="bg-[#162449] hover:bg-[#1e3060] border-2 border-transparent hover:border-[#4A9FE0] rounded-2xl py-5 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <span className="text-2xl">{REGION_EMOJI[r.id]}</span>
              <span className="text-white font-bold text-sm">{r.name}</span>
              <span className="text-gray-400 text-xs">{r.courses.length}개</span>
            </button>
          ))}
        </div>
      )}

      {/* ── STEP 2: 골프장 선택 ── */}
      {step === 2 && region && (
        <div className="flex-1 space-y-2 overflow-y-auto">
          <p className="text-gray-400 text-xs mb-3">📍 {region.name} · {region.courses.length}개 골프장</p>
          {region.courses.map(c => (
            <button
              key={c.id}
              onClick={() => selectCourse(c.id)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#162449] border-2 border-transparent hover:border-[#4A9FE0] transition-all text-left"
            >
              <div>
                <p className="text-white font-bold">{c.name}</p>
                <p className="text-gray-400 text-xs">
                  {c.subCourses.length > 1
                    ? `${c.subCourses.length}개 코스`
                    : `${c.subCourses[0]?.holes ?? 18}홀 · Par ${c.subCourses[0]?.totalPar ?? 72}`}
                </p>
              </div>
              {c.subCourses.length > 1 && <span className="text-[#4A9FE0] text-xs">코스선택 →</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── STEP 3: 코스 선택 (multi-subCourse) ── */}
      {step === 3 && course && multiSub && (
        <div className="flex-1 space-y-2 overflow-y-auto">
          <p className="text-gray-400 text-xs mb-3">⛳ {course.name} · 코스 선택</p>
          {course.subCourses.map(sc => (
            <button
              key={sc.id}
              onClick={() => setSubCourseId(sc.id)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#162449] border-2 border-transparent hover:border-[#4A9FE0] transition-all text-left"
            >
              <div>
                <p className="text-white font-bold">{sc.name}</p>
                <p className="text-gray-400 text-xs">{sc.holes}홀 · Par {sc.totalPar}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── STEP 3: 직접 입력 ── */}
      {step === 3 && courseId === 'custom' && (
        <div className="flex-1 space-y-4">
          <input
            type="text"
            placeholder="골프장 이름 입력"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            className="w-full bg-[#162449] text-white rounded-xl px-4 py-3 outline-none border border-[#4A9FE0]/30 focus:border-[#4A9FE0]"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-300 text-sm">홀 수:</span>
            {[9, 18, 27, 36].map(h => (
              <button key={h} onClick={() => setCustomHoles(h)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all
                  ${customHoles === h ? 'bg-[#4A9FE0] text-white' : 'bg-[#162449] text-gray-400'}`}>
                {h}홀
              </button>
            ))}
          </div>
          <button
            onClick={() => setSubCourseId('main')}
            disabled={!customName}
            className="w-full bg-[#4A9FE0] text-white font-bold py-3 rounded-xl disabled:opacity-40"
          >
            확인
          </button>
        </div>
      )}

      {/* ── STEP 4: 선택 완료 + 시작 버튼 ── */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-[#162449] rounded-2xl p-5 text-center space-y-2">
            <div className="text-4xl">⛳</div>
            <p className="text-[#E8B84B] font-black text-xl">{getSelectedCourse()?.name}</p>
            <p className="text-gray-300">{getSelectedCourse()?.holes}홀 · Par {getSelectedCourse()?.totalPar}</p>
            <p className="text-gray-400 text-sm mt-2">플레이어: <span className="text-white font-bold">{profile?.name}</span></p>
          </div>

          <div className="space-y-3 mt-4">
            <button
              onClick={startRound}
              disabled={starting}
              className="w-full bg-[#E8B84B] text-[#0D1B3E] font-black py-5 rounded-2xl text-lg disabled:opacity-40 transition-all active:scale-95 shadow-lg"
            >
              {starting ? '시작 중...' : '🔴 생중계 시작!'}
            </button>
            <p className="text-center text-gray-500 text-xs">
              시작하면 친구들이 실시간으로 내 스코어를 볼 수 있어요
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const REGION_EMOJI = {
  'incheon':      '🌊',
  'gyeonggi-n':   '🏔️',
  'gyeonggi-s':   '🌿',
  'gyeonggi-e':   '🍁',
  'chungcheong':  '🌾',
  'gangwon':      '❄️',
  'jeolla':       '🌻',
  'gyeongsang':   '🌄',
  'jeju':         '🍊',
}
