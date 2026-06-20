import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { ref, set } from 'firebase/database'
import { getProfile, generateId, setActiveRound, saveRoundBackup } from '../utils/auth'
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
    const now = Date.now()
    const today = new Date()
    const roundData = {
      id: roundId,
      playerName: profile.name,
      playerColor: profile.color,
      groupCode: profile.groups?.[0] || null,
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
