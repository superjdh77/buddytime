import { useEffect, useState } from 'react'

const COLORS = ['#E8B84B', '#4A9FE0', '#10B981', '#EF4444', '#8B5CF6', '#EC4899']

export default function Celebration({ data }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    const newPieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }))
    setPieces(newPieces)
  }, [data])

  if (!data) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="bg-[#162449] rounded-3xl px-8 py-6 text-center border-2 border-[#E8B84B] shadow-2xl">
          <p className="text-5xl mb-2">
            {data.diff <= -2 ? '🦅' : '🐦'}
          </p>
          <p className="text-[#E8B84B] font-black text-3xl mb-1">{data.label}!</p>
          <p className="text-white font-bold text-lg" style={{ color: data.player?.color }}>
            {data.player?.name}
          </p>
        </div>
      </div>

      {/* 색종이 */}
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.x}%`,
            top: '-10px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  )
}
