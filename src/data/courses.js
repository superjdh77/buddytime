// ─────────────────────────────────────────────
//  BuddyTime 전국 골프장 데이터
//  출처: golfmon.net (2026-06 기준)
//  Par: 표준 패턴 적용 (실제 홈페이지 데이터 기반 추후 업데이트 예정)
// ─────────────────────────────────────────────

const P72 = [4,5,3,4,4,3,5,4,4, 4,3,5,4,4,3,4,5,4];
const P36 = [4,3,5,4,4,3,4,5,4];
const P40 = [4,3,4,5,4,3,4,4,5,4];

function sc(id, name, pars = P72) {
  return { id, name, holes: pars.length, totalPar: pars.reduce((a,b)=>a+b,0), pars };
}
function single(id, name, pars = P72) {
  return { id, name, subCourses: [sc('main', '메인코스', pars)] };
}
function multi(id, name, subList) {
  return { id, name, subCourses: subList };
}
function region(id, name, locationFk, courses) {
  return { id, name, locationFk, courses };
}

export const REGIONS = [
  region('incheon', '인천경인', 9, [
    multi('club72', '클럽72', [
      sc('sky','하늘코스',P72), sc('ocean','오션코스',P72),
      sc('lake','레이크코스',P72), sc('classic','클래식코스',P72),
    ]),
    single('golfjeon-songdo','골프존 송도(구 오렌지듄스)'),
    single('uni-island','유니아일랜드cc'),
    single('saltbay','솔트베이cc'),
    single('inseoul27','인서울27'),
    single('aseco-siheung','아세코(시흥)gc'),
    single('incheon-grand','인천 그랜드cc'),
    single('incheon-intl','인천국제cc'),
    single('berhil','베르힐CC영종'),
    single('thehaven','더헤븐cc(구 아일랜드)'),
    single('grand-cheongju','그랜드cc 청주'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('gyeonggi-n', '경기북부', 1, [
    single('tiger','타이거cc'), single('paju','파주cc'),
    single('paju-private','파주비공개(M)'), single('pureunpine','푸른솔gc포천'),
    single('namyangju','남양주cc',P36),
    multi('mongvert','몽베르cc',[sc('public','대중제',P72),sc('member','회원제',P72)]),
    single('shambalha','샴발라cc'), single('venuji','베뉴지CC'),
    single('pocheon-private','포천비공개(M)'), single('foresthill','포레스트힐cc'),
    single('filos','필로스cc'), single('jayuro','자유로cc'),
    single('smartku','스마트KU골프파빌리온'), single('lassa','라싸골프클럽'),
    single('goyang-private','고양비공개(M)'), single('northfarm','노스팜cc'),
    single('newkorea','뉴코리아cc'), single('bestvalley','베스트밸리cc',P36),
    single('sunhill','썬힐cc'), single('olympic','올림픽cc',P36),
    single('cobswing','코브스윙(구 참밸리CC)'), single('pocheon-hills','포천힐스cc'),
    single('pocheon-hillmaru','포천 힐마루'), single('hanyang-pine','한양파인',P36),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('gyeonggi-s', '경기남부', 2, [
    single('360do','360도cc'), single('maestro','마에스트로cc'),
    single('greenhill','그린힐cc'), single('yangjipine','양지파인cc'),
    single('shilla','신라cc'), single('golfclubq','골프클럽Q'),
    single('riviera','리베라cc'), single('ananti-joongang','아난티 중앙cc'),
    single('hallim-yongin','한림용인cc'), single('midas-lake','마이다스레이크이천'),
    single('hallim-anseong','한림안성',P36), single('haesolia','해솔리아cc'),
    single('anseong-w','안성Wcc'), single('ijuk-crystal','일죽 크리스밸리cc'),
    single('yangpyeong-tpc','양평TPCcc'), single('namicheon-priv','남이천비공개(M)'),
    single('pinecreek','파인크리크cc'), single('powell-anseong','포웰CC 안성'),
    single('sehyeon','세현cc'), single('hwaseong','화성cc'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('chungcheong', '충청', 3, [
    single('centerium','센테리움CC'), single('royallinks','로얄링스'),
    single('golfjeon-jincheon','골프존 진천(아트밸리)'), single('daeyoung-hills','대영힐스cc'),
    single('golfjeon-hwarang','골프존 화랑'), single('princess','프린세스cc'),
    single('moka','모카cc(구 세일)'), single('grand-cheongju2','그랜드cc 청주'),
    single('hildesheim','힐데스하임(충북음성)'), single('seosansu','서산수cc'),
    single('royalfore','로얄포레cc'), single('maronnewday','마론뉴데이cc'),
    multi('tgv','떼제베',[sc('dongbuk','동북코스',P72),sc('seonam','서남코스',P72)]),
    single('kingsdale','킹스데일cc'), single('golfjeon-cheonan','골프존 천안'),
    single('daeyoung-base','대영베이스cc'), single('dongchon','동촌cc'),
    single('cheonryong','천룡cc'), single('gamgok','감곡CC'),
    single('clubd-boeun','CLUB D 보은'), single('jeungpyeong-blk','증평 블랙스톤 벨포레cc'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('gangwon', '강원', 4, [
    single('alps-daeyoung','알프스대영cc'), single('wellihilli','웰리힐리cc'),
    single('hantangang','한탄강cc'), single('bellastone','벨라스톤cc'),
    single('namhangang-espark','남한강에스파크'), single('pinevalley','파인밸리cc'),
    single('alpencia700','알펜시아 700'), single('dongseoul','동서울CC',P40),
    single('bella45','벨라45(마스터스)'), single('aurora','오로라cc'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('jeolla', '전라', 5, [
    single('jangsu','장수CC'), single('seokjeong','석정힐cc'),
    single('gochang','고창cc'), single('boseong','보성cc'),
    multi('gunsan','군산cc',[sc('regular','레귤러코스',P72),sc('tournament','토너먼트코스',P72)]),
    single('poseven-geumgang','포세븐 금강(구 CLUB D 금강)'),
    single('jeonju-shangrila','전주샹그릴라cc'), single('ungpo','웅포cc'),
    single('golfjeon-muju','골프존 무주'), single('hwasun-eliche','화순엘리체(구 남광주)'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('gyeongsang', '경상', 6, [
    single('clubd-geochang','CLUB D 거창'), single('parazio-ms','파라지오+엠스클럽의성'),
    single('daegu-palgang','대구팔공cc'), single('ms-uiseong','엠스클럽의성cc'),
    single('easysky','이지스카이CC'), single('gimcheon-grape','김천포도cc'),
    single('uljin-marine','울진마린CC'), single('guni','구니cc'),
    single('donghun-hillmaru','동훈힐마루'), single('hanmaek','한맥cc'),
    single('pentaview','펜타뷰GC'), single('jinhae-singang','진해신항(구 아라미르cc)'),
    single('yangsan','양산cc'), single('andong-riverhill','안동리버힐'),
    single('stonegate','스톤게이트cc'), single('skyview','스카이뷰cc'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('jeju', '제주', 7, [
    single('theclassic','더클래식cc'), single('jeju-buyoung','제주부영cc'),
    single('teddyvalley','테디밸리cc'), single('jeju-blackstone','제주 블랙스톤'),
    single('lotte-skyhill','롯데스카이힐제주'), single('lahenne','라헨느'),
    single('cypress','사이프러스'), single('shineville','샤인빌cc'),
    single('greenfield','그린필드(구 제피로스)'), single('springdale','스프링데일cc'),
    single('raon','라온cc'), single('castlex','캐슬렉스제주cc'),
    single('tamius','타미우스cc'), single('ora','오라cc'),
    single('ananti-jeju','아난티 제주'), single('adenhill','아덴힐'),
    single('crown','크라운cc'), single('elysian','엘리시안제주'),
    single('shineville-park','샤인빌파크cc'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
  region('gyeonggi-e', '경기동부', 8, [
    single('clubd-players','CLUB D 더플레이어스'),
    single('gapyeong-benest','가평베네스트cc'),
    single('gapyeong-pristine','가평프리스틴밸리cc'),
    single('namchuncheon','남춘천cc'), single('radena','라데나cc'),
    single('roadhills','로드힐스cc'), single('beaconhills','비콘힐스cc'),
    single('shinedell','샤인데일cc'),
    single('serenity-gangchon','세레니티강촌cc(구 파가니카)'),
    single('springvale','스프링베일gc',P36), single('yangju','양주CC'),
    single('owners','오너스cc'), single('cheongpyeong-priv','청평비공개'),
    single('clubmow','클럽모우cc'), single('hilldrosay','힐드로사이cc'),
    { id:'custom', name:'직접 입력', subCourses:[sc('main','메인코스',P72)] },
  ]),
];

export const COURSES = REGIONS.flatMap(r =>
  r.courses.map(c => ({
    id: c.id, name: c.name, region: r.name,
    holes: c.subCourses[0]?.holes ?? 18,
    totalPar: c.subCourses[0]?.totalPar ?? 72,
    pars: c.subCourses[0]?.pars ?? P72,
    subCourses: c.subCourses,
  }))
);

export function getRegion(id) { return REGIONS.find(r => r.id === id); }
export function getCourse(rId, cId) { return getRegion(rId)?.courses.find(c => c.id === cId); }
export function getSubCourse(rId, cId, scId) { return getCourse(rId, cId)?.subCourses.find(s => s.id === scId); }
export function hasMultipleSubCourses(rId, cId) { return (getCourse(rId, cId)?.subCourses?.length ?? 0) > 1; }

export const PLAYER_COLORS = [
  { bg: '#EF4444', label: '빨강' }, { bg: '#3B82F6', label: '파랑' },
  { bg: '#10B981', label: '초록' }, { bg: '#F59E0B', label: '주황' },
  { bg: '#8B5CF6', label: '보라' }, { bg: '#EC4899', label: '핑크' },
];

export function getScoreLabel(diff) {
  if (diff <= -2) return { label: '이글', color: '#E8B84B', emoji: '🦅' }
  if (diff === -1) return { label: '버디', color: '#10B981', emoji: '🐦' }
  if (diff === 0)  return { label: '파',   color: '#FFFFFF', emoji: '' }
  if (diff === 1)  return { label: '보기', color: '#F97316', emoji: '' }
  if (diff === 2)  return { label: '더블', color: '#EF4444', emoji: '' }
  return { label: `+${diff}`, color: '#EF4444', emoji: '' }
}
