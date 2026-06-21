import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { findAccount, registerAccount, loginAccount, getRememberedEmail, getRedirectAfterLogin, clearRedirectAfterLogin, getProfile, setSessionConfirmed } from '../utils/auth'

const COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
]

  export default function Onboarding() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(getRememberedEmail())
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [pin, setPin] = useState('')
  const [step, setStep] = useState('email') // email → (name, signup만) → pin
  const [mode, setMode] = useState(null) // 'login' | 'signup'
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const profile = getProfile()
      if (profile) {
        setEmail(profile.email)
          setName(profile.name)
            setColor(profile.color)
              setPin(profile.pin || '')
                setMode('login')
                  setStep('pin')
      }
  }, [])
    
    function goAfterLogin() {
    const redirect = getRedirectAfterLogin()
    if (redirect) { clearRedirectAfterLogin(); navigate(redirect) }
    else navigate('/')
  }

  async function handleEmailNext() {
    if (!email.trim() || !email.includes('@')) { setError('이메일을 정확히 입력하세요'); return }
    setError('')
    setChecking(true)
    try {
      const account = await findAccount(email)
      setChecking(false)
      if (account) {
        // 이미 가입된 이메일 — PIN만 입력하면 됨
        setMode('login')
        setStep('pin')
      } else {
        setMode('signup')
        setStep('name')
      }
    } catch {
      setChecking(false)
      setError('네트워크 확인 후 다시 시도해주세요')
    }
  }

  function handleNameNext() {
    if (!name.trim()) return
    setStep('pin')
  }

  async function handlePinSubmit() {
    if (pin.length !== 4) return
    setError('')
    setChecking(true)
    try {
      if (mode === 'login') {
        const res = await loginAccount(email, pin)
        setChecking(false)
        if (!res.ok) {
          setError('PIN 번호가 일치하지 않습니다')
          setPin('')
          return
        }
        setSessionConfirmed()
          goAfterLogin()
      } else {
        await registerAccount({ email, pin, name, color })
        setChecking(false)
        setSessionConfirmed()
          goAfterLogin()
      }
    } catch {
      setChecking(false)
      setError('네트워크 확인 후 다시 시도해주세요')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D1B3E] px-6 justify-center">
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">⛳</div>
        <h1 className="text-3xl font-black text-white">버디타임</h1>
        <p className="text-[#4A9FE0] text-sm mt-1">내 골프 기록 · 실시간 공유</p>
      </div>

      {/* ── STEP: 이메일 ── */}
      {step === 'email' && (
        <div>
          <p className="text-white font-bold text-center mb-6">이메일로 시작하기</p>
          <div className="mb-5">
            <label className="text-gray-400 text-sm mb-2 block">이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleEmailNext()}
              className="w-full bg-[#162449] text-white text-center text-lg font-bold rounded-2xl py-4 outline-none border-2 border-transparent focus:border-[#4A9FE0]"
            />
            <p className="text-gray-500 text-xs mt-2 text-center">실제 인증 메일은 가지 않아요. 내 기록을 구분하는 아이디로만 써요.</p>
          </div>
          {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
          <button
            disabled={!email.trim() || checking}
            onClick={handleEmailNext}
            className="w-full bg-[#4A9FE0] text-white font-bold py-4 rounded-2xl disabled:opacity-40 transition-all active:scale-95"
          >
            {checking ? '확인 중...' : '다음 →'}
          </button>
        </div>
      )}

      {/* ── STEP: 이름+색상 (신규 가입만) ── */}
      {step === 'name' && (
        <div>
          <p className="text-white font-bold text-center mb-6">프로필 설정</p>

          <div className="mb-5">
            <label className="text-gray-400 text-sm mb-2 block">이름</label>
            <input
              type="text"
              placeholder="예: 정대훈"
              maxLength={10}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameNext()}
              className="w-full bg-[#162449] text-white text-center text-xl font-bold rounded-2xl py-4 outline-none border-2 border-transparent focus:border-[#4A9FE0]"
            />
          </div>

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
            onClick={handleNameNext}
            className="w-full bg-[#4A9FE0] text-white font-bold py-4 rounded-2xl disabled:opacity-40 transition-all active:scale-95"
          >
            다음 →
          </button>
        </div>
      )}

      {/* ── STEP: PIN ── */}
      {step === 'pin' && (
        <div>
          <p className="text-white font-bold text-center mb-2">
            {mode === 'login' ? 'PIN 번호 입력' : 'PIN 설정'}
          </p>
          <p className="text-gray-400 text-sm text-center mb-1">{email}</p>
          <p className="text-gray-500 text-xs text-center mb-6">
            {mode === 'login' ? '가입할 때 만든 4자리 숫자를 입력하세요' : '내 기록 보호용 4자리 숫자'}
          </p>

          <div className="flex justify-center gap-3 mb-6">
            {[0,1,2,3].map(i => (
              <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black
                ${i < pin.length ? 'bg-[#4A9FE0] text-white' : 'bg-[#162449] text-gray-600'}`}>
                {i < pin.length ? '●' : '○'}
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

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
            disabled={pin.length !== 4 || checking}
            onClick={handlePinSubmit}
            className="w-full bg-[#E8B84B] text-[#0D1B3E] font-black py-4 rounded-2xl disabled:opacity-40 transition-all active:scale-95"
          >
            {checking ? '확인 중...' : mode === 'login' ? '🏌️ 들어가기' : '🏌️ 시작하기!'}
          </button>

          <button
            onClick={() => { setStep('email'); setPin(''); setError('') }}
            className="w-full text-gray-500 text-xs text-center mt-4 underline"
          >
            다른 이메일로 시작하기
          </button>
        </div>
      )}
    </div>
  )
}
