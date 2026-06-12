import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-install-dismissed')) return
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const safari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)
    if (ios && safari) {
      setIsIos(true)
      setTimeout(() => setShow(true), 3000)
      return
    }
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pointer-events-none">
      <div className="bg-[#162449] border border-[#4A9FE0]/40 rounded-2xl p-4 shadow-2xl pointer-events-auto flex items-start gap-3 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-xl bg-[#0D1B3E] flex items-center justify-center flex-shrink-0 text-2xl">
          ⛳
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">버디타임 앱으로 설치</p>
          {isIos ? (
            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
              Safari 하단 <span className="text-[#4A9FE0]">공유 버튼</span>을 눌러
              <br />"홈 화면에 추가"를 선택하세요
            </p>
          ) : (
            <p className="text-gray-400 text-xs mt-0.5">홈 화면에 추가하면 앱처럼 사용 가능</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {!isIos && (
            <button onClick={handleInstall} className="bg-[#E8B84B] text-[#0D1B3E] font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
              설치
            </button>
          )}
          <button onClick={handleDismiss} className="text-gray-500 text-xs px-3 py-1.5 rounded-lg hover:text-gray-300">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
