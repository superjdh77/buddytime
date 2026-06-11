// 홀별 파 기본 패턴 (9홀 기준, 18홀이면 2번 반복)
const DEFAULT_PAR_PATTERN = [4, 4, 3, 5, 4, 4, 3, 5, 4]

function generatePars(totalHoles, pattern = DEFAULT_PAR_PATTERN) {
  const pars = []
  for (let i = 0; i < totalHoles; i++) {
    pars.push(pattern[i % pattern.length])
  }
  return pars
}

export const COURSES = [
  {
    id: 'club72',
    name: '클럽72 (구 스카이72)',
    location: '영종도',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'jacknicklaus',
    name: '잭니클라우스 GC',
    location: '송도',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'bearsbest',
    name: '베어즈베스트 청라',
    location: '청라',
    holes: 27,
    totalPar: 108,
    pars: generatePars(27),
  },
  {
    id: 'dreampark',
    name: '드림파크CC',
    location: '서구',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'incheon_intl',
    name: '인천국제CC',
    location: '서구',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'incheon_grand',
    name: '인천그랜드CC',
    location: '서구',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'orangedunes_songdo',
    name: '오렌지듄스 송도',
    location: '연수구',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'orangedunes_yeongjong',
    name: '오렌지듄스 영종',
    location: '영종도',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'uniisland',
    name: '유니아일랜드CC',
    location: '강화도',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
  {
    id: 'custom',
    name: '직접 입력',
    location: '-',
    holes: 18,
    totalPar: 72,
    pars: generatePars(18),
  },
]

export const PLAYER_COLORS = [
  { bg: '#EF4444', label: '빨강' },
  { bg: '#3B82F6', label: '파랑' },
  { bg: '#10B981', label: '초록' },
  { bg: '#F59E0B', label: '주황' },
  { bg: '#8B5CF6', label: '보라' },
  { bg: '#EC4899', label: '핑크' },
]

export function getScoreLabel(diff) {
  if (diff <= -2) return { label: '이글', color: '#E8B84B', emoji: '🦅' }
  if (diff === -1) return { label: '버디', color: '#10B981', emoji: '🐦' }
  if (diff === 0)  return { label: '파',   color: '#FFFFFF', emoji: '' }
  if (diff === 1)  return { label: '보기', color: '#F97316', emoji: '' }
  if (diff === 2)  return { label: '더블', color: '#EF4444', emoji: '' }
  return { label: `+${diff}`, color: '#EF4444', emoji: '' }
}
