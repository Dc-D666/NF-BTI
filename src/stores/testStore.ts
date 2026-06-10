import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TestMode, UserAnswers, TestResult } from '@/types'
import { quickQuestions, fullQuestions, questions } from '@/data/questions'
import { getQuickType, getFullType } from '@/data/personalities'

const STORAGE_KEY_QUICK = 'nfbti_quick_progress'
const STORAGE_KEY_FULL = 'nfbti_full_progress'

export const useTestStore = defineStore('test', () => {
  // State
  const mode = ref<TestMode | null>(null)
  const currentPage = ref(1)
  const answers = ref<UserAnswers>({})
  const isComplete = ref(false)
  const result = ref<TestResult | null>(null)

  // 根据模式获取题目数组
  const activeQuestions = computed(() => {
    if (!mode.value) return []
    return mode.value === 'quick' ? quickQuestions : fullQuestions
  })

  // Computed
  const currentQuestions = computed(() => {
    if (!mode.value) return []
    const qs = activeQuestions.value
    const perPage = 4
    const start = (currentPage.value - 1) * perPage
    return qs.slice(start, start + perPage)
  })

  const totalPages = computed(() => {
    if (!mode.value) return 0
    return Math.ceil(activeQuestions.value.length / 4)
  })

  const progress = computed(() => {
    const qs = activeQuestions.value
    const answered = qs.filter(q => answers.value[q.id] !== undefined).length
    return Math.round((answered / qs.length) * 100)
  })

  const canGoNext = computed(() => {
    return currentQuestions.value.every(q => answers.value[q.id] !== undefined)
  })

  const canGoPrev = computed(() => {
    return currentPage.value > 1
  })

  const isLastPage = computed(() => {
    return currentPage.value >= totalPages.value
  })

  // Actions
  function setMode(newMode: TestMode) {
    // 如果模式没变，不要重置答案（防止路由变化导致数据丢失）
    if (mode.value === newMode) return
    mode.value = newMode
    currentPage.value = 1
    answers.value = {}
    isComplete.value = false
    result.value = null
  }

  function setAnswer(questionId: number, value: number) {
    answers.value[questionId] = value
    saveProgress()
  }

  function nextPage() {
    if (isLastPage.value && canGoNext.value) {
      calculateResult()
    } else if (canGoNext.value) {
      currentPage.value++
      saveProgress()
    }
  }

  function prevPage() {
    if (currentPage.value > 1) {
      currentPage.value--
      saveProgress()
    }
  }

  function calculateResult() {
    if (!mode.value) return
    isComplete.value = true

    // 计算维度得分（排除隐藏题，id >= 149 为隐藏题）
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
    const qs = activeQuestions.value
    let hiddenAnswer: number | null = null

    for (const [qid, val] of Object.entries(answers.value)) {
      const id = Number(qid)
      if (id >= 149) {
        // 隐藏题：记录答案但不计入维度得分
        hiddenAnswer = val
        continue
      }
      const q = qs.find(q => q.id === id)
      if (!q) continue
      const score = val * q.direction
      scores[q.dimension] += score
    }

    // 判定人格类型
    let type
    if (mode.value === 'quick') {
      type = getQuickType({ E: scores.E, I: scores.I, S: scores.S, N: scores.N })
    } else {
      type = getFullType(scores, hiddenAnswer)
    }

    result.value = {
      mode: mode.value,
      type,
      scores,
    }

    // 清除进度
    clearProgress()
  }

  function reset() {
    mode.value = null
    currentPage.value = 1
    answers.value = {}
    isComplete.value = false
    result.value = null
    clearProgress()
  }

  // localStorage
  function saveProgress() {
    if (!mode.value) return
    const key = mode.value === 'quick' ? STORAGE_KEY_QUICK : STORAGE_KEY_FULL
    const data = {
      mode: mode.value,
      currentPage: currentPage.value,
      answers: answers.value,
      timestamp: Date.now(),
    }
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      console.warn('localStorage 不可用，进度仅保存在内存中')
    }
  }

  function loadProgress(): { mode: TestMode; currentPage: number; answers: UserAnswers } | null {
    try {
      const quick = localStorage.getItem(STORAGE_KEY_QUICK)
      const full = localStorage.getItem(STORAGE_KEY_FULL)

      let data = null
      if (quick) data = JSON.parse(quick)
      if (full) {
        const fullData = JSON.parse(full)
        if (!data || (fullData.timestamp > data.timestamp)) {
          data = fullData
        }
      }

      if (data && data.mode) {
        mode.value = data.mode
        currentPage.value = data.currentPage || 1
        answers.value = data.answers || {}
        return { mode: data.mode, currentPage: data.currentPage, answers: data.answers }
      }
    } catch {
      console.warn('localStorage 读取失败')
    }
    return null
  }

  function clearProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY_QUICK)
      localStorage.removeItem(STORAGE_KEY_FULL)
    } catch {
      // ignore
    }
  }

  function hasUnfinishedProgress(): { mode: TestMode; currentPage: number } | null {
    try {
      const quick = localStorage.getItem(STORAGE_KEY_QUICK)
      const full = localStorage.getItem(STORAGE_KEY_FULL)
      if (quick) {
        const data = JSON.parse(quick)
        return { mode: 'quick', currentPage: data.currentPage || 1 }
      }
      if (full) {
        const data = JSON.parse(full)
        return { mode: 'full', currentPage: data.currentPage || 1 }
      }
    } catch {
      // ignore
    }
    return null
  }

  return {
    mode,
    currentPage,
    answers,
    isComplete,
    result,
    currentQuestions,
    totalPages,
    progress,
    canGoNext,
    canGoPrev,
    isLastPage,
    setMode,
    setAnswer,
    nextPage,
    prevPage,
    calculateResult,
    reset,
    saveProgress,
    loadProgress,
    clearProgress,
    hasUnfinishedProgress,
  }
})
