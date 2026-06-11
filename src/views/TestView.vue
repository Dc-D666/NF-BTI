<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useTestStore } from '@/stores/testStore'
import { computed, watch, ref, nextTick, onMounted, onUnmounted } from 'vue'

const route = useRoute()
const router = useRouter()
const store = useTestStore()

const mode = computed(() => route.params.mode as string)
const routePage = computed(() => parseInt(route.params.page as string) || 1)
const isDebug = computed(() => mode.value === 'debug')

// 内部页面状态，用于平滑切换动画
const displayPage = ref(1)
const slideDirection = ref<'next' | 'prev'>('next')
const isTransitioning = ref(false)

// Debug 自动答题定时器
let debugTimer: ReturnType<typeof setTimeout> | null = null

// 初始化：从路由参数同步到 store
watch([mode, routePage], ([newMode, newPage]) => {
  if (newMode && ['quick', 'full', 'debug'].includes(newMode)) {
    store.setMode(newMode as 'quick' | 'full' | 'debug')
    store.currentPage = newPage
    displayPage.value = newPage
  }
}, { immediate: true })

// Debug 模式：自动答题
function runDebugAutoAnswer() {
  if (!isDebug.value) return
  const questions = store.currentQuestions
  if (!questions.length) return

  // 为当前页每道题随机选择答案
  for (const q of questions) {
    if (store.answers[q.id] !== undefined) continue
    let value: number
    if (isHiddenQuestion(q.id)) {
      // 隐藏题：1-4 随机
      value = Math.floor(Math.random() * 4) + 1
    } else {
      // 标准题：-3 到 +3 随机（排除0）
      const values = [-3, -2, -1, 1, 2, 3]
      value = values[Math.floor(Math.random() * values.length)]!
    }
    store.setAnswer(q.id, value)
  }

  // 延迟后自动下一页
  debugTimer = setTimeout(() => {
    if (store.isLastPage && store.canGoNext) {
      store.calculateResult()
      if (store.result) {
        router.push(`/result/debug`)
      }
    } else if (store.canGoNext) {
      goNext()
      // 继续下一页的自动答题
      nextTick(() => {
        runDebugAutoAnswer()
      })
    }
  }, 300)
}

onMounted(() => {
  if (isDebug.value) {
    // 延迟一点开始，让页面渲染完成
    debugTimer = setTimeout(() => {
      runDebugAutoAnswer()
    }, 500)
  }
})

onUnmounted(() => {
  if (debugTimer) {
    clearTimeout(debugTimer)
    debugTimer = null
  }
})

function selectOption(questionId: number, value: number) {
  store.setAnswer(questionId, value)
}

function isSelected(questionId: number, value: number): boolean {
  return store.answers[questionId] === value
}

async function goNext() {
  if (!store.canGoNext || isTransitioning.value) return

  if (store.isLastPage) {
    store.calculateResult()
    if (store.result) {
      router.push(`/result/${mode.value}`)
    }
    return
  }

  slideDirection.value = 'next'
  isTransitioning.value = true
  store.currentPage++
  displayPage.value = store.currentPage
  store.saveProgress()

  await nextTick()
  setTimeout(() => {
    isTransitioning.value = false
  }, 350)
}

async function goPrev() {
  if (!store.canGoPrev || isTransitioning.value) return

  slideDirection.value = 'prev'
  isTransitioning.value = true
  store.currentPage--
  displayPage.value = store.currentPage
  store.saveProgress()

  await nextTick()
  setTimeout(() => {
    isTransitioning.value = false
  }, 350)
}

const optionLabels = [
  { value: -3, label: '强烈不同意', short: '-3' },
  { value: -2, label: '不同意', short: '-2' },
  { value: -1, label: '有点不同意', short: '-1' },
  { value: 1, label: '有点同意', short: '+1' },
  { value: 2, label: '同意', short: '+2' },
  { value: 3, label: '强烈同意', short: '+3' },
]

// 隐藏题四选项（id >= 149）
const hiddenOptions = [
  { value: 1, label: 'A. 白开水', short: 'A' },
  { value: 2, label: 'B. 凉茶', short: 'B' },
  { value: 3, label: 'C. 奶茶', short: 'C' },
  { value: 4, label: 'D. 石油（汽油味的那种）', short: 'D' },
]

function isHiddenQuestion(qid: number): boolean {
  return qid >= 149
}
</script>

<template>
  <div class="test-page">
    <!-- 顶部导航 -->
    <header class="header">
      <button class="logo-btn" @click="router.push('/')">
        <span class="logo-text">NFTI</span>
      </button>
      <div class="progress-info">
        <span class="mode-tag" :class="{ debug: isDebug }">
          {{ isDebug ? 'DEBUG' : mode === 'quick' ? '快速' : '完整' }}
        </span>
        <span class="page-num">{{ displayPage }} / {{ store.totalPages }}</span>
      </div>
    </header>

    <!-- 进度条 -->
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: store.progress + '%' }"></div>
    </div>

    <!-- 题目区域 -->
    <main class="question-area">
      <Transition
        :name="slideDirection === 'next' ? 'slide-next' : 'slide-prev'"
        mode="out-in"
      >
        <div :key="displayPage" class="question-slide">
          <div
            v-for="q in store.currentQuestions"
            :key="q.id"
            class="question-card"
          >
            <div class="question-number">Q{{ q.id }}</div>
            <p class="question-text">{{ q.text }}</p>

            <!-- 标准题：Likert 6级量表 -->
            <template v-if="!isHiddenQuestion(q.id)">
              <div class="scale-labels">
                <span>不同意</span>
                <span>同意</span>
              </div>

              <div class="options">
                <button
                  v-for="(opt, idx) in optionLabels"
                  :key="opt.value"
                  class="option-btn"
                  :class="{
                    selected: isSelected(q.id, opt.value),
                    negative: opt.value < 0,
                    positive: opt.value > 0,
                    [`degree-${Math.abs(opt.value)}`]: true
                  }"
                  :style="{ '--i': idx }"
                  @click="selectOption(q.id, opt.value)"
                >
                  <span class="opt-dot" aria-hidden="true"></span>
                  <span class="opt-short">{{ opt.short }}</span>
                  <span class="opt-label">{{ opt.label }}</span>
                </button>
              </div>
            </template>

            <!-- 隐藏题：四选项单选 -->
            <template v-else>
              <div class="hidden-options">
                <button
                  v-for="opt in hiddenOptions"
                  :key="opt.value"
                  class="hidden-option-btn"
                  :class="{ selected: isSelected(q.id, opt.value) }"
                  @click="selectOption(q.id, opt.value)"
                >
                  <span class="hidden-opt-letter">{{ opt.short }}</span>
                  <span class="hidden-opt-label">{{ opt.label }}</span>
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </main>

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <button
        class="nav-btn prev"
        :disabled="!store.canGoPrev"
        @click="goPrev"
      >
        <span class="nav-arrow" aria-hidden="true">←</span>
        上一页
      </button>

      <div class="page-dots">
        <span
          v-for="p in store.totalPages"
          :key="p"
          class="dot"
          :class="{ active: p === displayPage, completed: p < displayPage }"
        />
      </div>

      <button
        class="nav-btn next"
        :disabled="!store.canGoNext"
        @click="goNext"
      >
        {{ store.isLastPage ? '查看结果' : '下一页' }}
        <span v-if="!store.isLastPage" class="nav-arrow" aria-hidden="true">→</span>
        <span v-else class="nav-arrow" aria-hidden="true">✦</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.test-page {
  min-height: 100vh;
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-5);
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
}

/* ---- Header ---- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.logo-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2) 0;
}
.logo-text {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.mode-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  letter-spacing: 0.02em;
}
.mode-tag.debug {
  background: var(--rose-500);
  color: var(--gray-0);
}
.page-num {
  font-size: 14px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

/* ---- Progress Track ---- */
.progress-track {
  height: 3px;
  background: var(--gray-100);
  border-radius: 2px;
  margin-bottom: var(--space-8);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--indigo-500), var(--indigo-600));
  border-radius: 2px;
  transition: width 400ms var(--ease-out-expo);
}

/* ---- Question Area with Slide Transitions ---- */
.question-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.question-slide {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Slide Next: current exits left, new enters from right */
.slide-next-enter-active {
  transition: all 350ms var(--ease-out-expo);
}
.slide-next-leave-active {
  transition: all 250ms ease-in;
  position: absolute;
  width: 100%;
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* Slide Prev: current exits right, new enters from left */
.slide-prev-enter-active {
  transition: all 350ms var(--ease-out-expo);
}
.slide-prev-leave-active {
  transition: all 250ms ease-in;
  position: absolute;
  width: 100%;
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* ---- Question Card ---- */
.question-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: var(--space-6) var(--space-5);
}

.question-number {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--space-3);
  letter-spacing: 0.04em;
}

.question-text {
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1.7;
  color: var(--gray-900);
  margin-bottom: var(--space-6);
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--gray-400);
  margin-bottom: var(--space-3);
  padding: 0 var(--space-2);
}

/* ---- Options ---- */
.options {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.option-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-1);
  border: 2px solid var(--gray-200);
  border-radius: 16px;
  background: var(--gray-0);
  cursor: pointer;
  transition: all 150ms var(--ease-out-quint);
  position: relative;
}

.option-btn:hover {
  border-color: var(--gray-300);
  transform: translateY(-2px);
}

.option-btn:active {
  transform: translateY(0) scale(0.97);
}

.opt-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--gray-300);
  transition: all 150ms ease;
}

.opt-short {
  font-size: 14px;
  font-weight: 700;
  color: var(--gray-500);
  font-variant-numeric: tabular-nums;
}

.opt-label {
  font-size: 10px;
  color: var(--gray-400);
  text-align: center;
  line-height: 1.3;
  max-width: 56px;
}

/* Selected states */
.option-btn.selected {
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.option-btn.selected .opt-dot {
  border-color: transparent;
  transform: scale(1.3);
}
.option-btn.selected .opt-short {
  color: var(--gray-0);
}
.option-btn.selected .opt-label {
  color: rgba(255,255,255,0.8);
}

/* Negative selected (disagree) */
.option-btn.selected.negative {
  background: linear-gradient(135deg, var(--rose-400), var(--rose-500));
}
.option-btn.selected.negative .opt-dot {
  background: var(--gray-0);
}

/* Positive selected (agree) */
.option-btn.selected.positive {
  background: linear-gradient(135deg, var(--indigo-500), var(--indigo-600));
}
.option-btn.selected.positive .opt-dot {
  background: var(--gray-0);
}

/* Degree sizing */
.option-btn.degree-1 .opt-dot { width: 10px; height: 10px; }
.option-btn.degree-2 .opt-dot { width: 14px; height: 14px; }
.option-btn.degree-3 .opt-dot { width: 18px; height: 18px; }

/* ---- Hidden Question Options ---- */
.hidden-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.hidden-option-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--gray-200);
  border-radius: 14px;
  background: var(--gray-0);
  cursor: pointer;
  transition: all 150ms var(--ease-out-quint);
  text-align: left;
}

.hidden-option-btn:hover {
  border-color: var(--indigo-300);
  transform: translateX(4px);
}

.hidden-option-btn.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateX(4px);
}

.hidden-opt-letter {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--gray-100);
  font-size: 14px;
  font-weight: 700;
  color: var(--gray-600);
  flex-shrink: 0;
}

.hidden-option-btn.selected .hidden-opt-letter {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.hidden-opt-label {
  font-size: 15px;
  color: var(--gray-700);
}

.hidden-option-btn.selected .hidden-opt-label {
  color: var(--indigo-700);
  font-weight: 600;
}

/* ---- Bottom Nav ---- */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--color-border);
  max-width: 640px;
  margin: 0 auto;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms var(--ease-out-quint);
  white-space: nowrap;
}
.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.nav-btn:not(:disabled):active {
  transform: scale(0.96);
}

.nav-btn.prev {
  background: var(--gray-100);
  color: var(--gray-600);
}
.nav-btn.prev:not(:disabled):hover {
  background: var(--gray-200);
}

.nav-btn.next {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}
.nav-btn.next:not(:disabled):hover {
  background: var(--indigo-700);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.nav-arrow {
  font-size: 16px;
}

/* Page dots */
.page-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gray-300);
  transition: all 200ms ease;
}
.dot.active {
  width: 20px;
  border-radius: 3px;
  background: var(--color-primary);
}
.dot.completed {
  background: var(--indigo-300);
}

/* ---- Responsive ---- */
@media (max-width: 480px) {
  .test-page {
    padding: var(--space-4);
    padding-bottom: 90px;
  }
  .question-text {
    font-size: 16px;
  }
  .option-btn {
    padding: var(--space-2) 2px;
    border-radius: 12px;
  }
  .opt-label {
    font-size: 9px;
    max-width: 48px;
  }
  .nav-btn {
    padding: var(--space-2) var(--space-4);
    font-size: 14px;
  }
  .page-dots {
    display: none;
  }
}
</style>
