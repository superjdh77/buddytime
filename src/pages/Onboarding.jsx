import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProfile } from '../utils/auth'

const COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [pin, setPin] = useState('')
  const [step, setStep] = useState(1)

  function handleNext() {
    if (step === 1 && name.trim().length < 1) return
    if (step === 2 && pin.length !== 4) return
    if (step < 2) { setStep(step + 1); return }

    saveProfile({ name: name.trim(), color, pin, groups: [] })
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-6 justify-center">
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">⛳</div>
        <h1 className="text-3xl font-black text-white">버디타임</h1>
        <p className="text-[#4A9FE0] text-sm mt-1">내 골프 기록 · 실시간 공유</p>
      </div>

      {step === 1 && (
        <div>
          <p className="text-white font-bold text-center mb-6">프로필 설정</p>

          {/* 이름 */}
          <div className="mb-5">
            <label className="text-gray-400 text-sm mb-2 block">이름</label>
            <input
              type="text"
              placeholder="예: 정대훈"
              maxLength={10}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#162449] text-white text-center text-xl font-bold rounded-2xl py-4 outline-none border-2 border-transparent focus:border-[#4A9FE0]"
            />
          </div>

          {/* 색상 선택 */}
          <div className="mb-8">
            <label className="text-gray-400 text-sm mb-3 block">내 색상</label>
            <div className="flex gap-3 justify-center flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-12 h-12 rounded-full transition-all
                    ${color === c ? 'ring-4 ring-white scale-110' : 'opacity-70'}`}
                />
              ))}
            </div>
          </div>

          {/* 미리보기 */}
          {name && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl"
                style={{ backgroundColor: color }}>
                {name[0]}
              </div>
              <span className="text-white font-bold text-lg">{name}</span>
            </div>
          )}

          <button
            disabled={!name.trim()}
            onClick={handleNext}
            className="w-full bg-[#4A9FE0] text-white font-bold py-4 rounded-2xl disabled:opacity-40 transition-all active:scale-95"
          >
            다음 →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="text-white font-bold text-center mb-2">PIN 설정</p>
          <p className="text-gray-400 text-sm text-center mb-6">내 기록 보호용 4자리 숫자</p>

          <div className="flex justify-center gap-3 mb-6">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black
                ${i < pin.length ? 'bg-[#4A9FE0] text-white' : 'bg-[#162449] text-gray-600'}`}>
                {i < pin.length ? '●' : '○'}
              </div>
            ))}
          </div>

          {/* 키패드 */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
              <button
                key={i}
                onClick={() => {
                  if (key === '⌫') setPin(p => p.slice(0, -1))
                  else if (key && pin.length < 4) setPin(p => p + key)
                }}
                className={`h-14 rounded-2xl text-white font-bold text-xl transition-all active:scale-90
                  ${key ? 'bg-[#162449] hover:bg-[#1e3260]' : 'invisible'}`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            disabled={pin.length !== 4}
            onClick={handleNext}
            className="w-full bg-[#E8B84B] text-[#0D1B3E] font-black py-4 rounded-2xl disabled:opacity-40 transition-all active:scale-95"
          >
            🏌️ 시작하기!
          </button>
        </div>
      )}
    </div>
  )
}
