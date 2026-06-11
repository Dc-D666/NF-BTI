<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useTestStore } from '@/stores/testStore'
import { counter } from '@/utils/counter'
import { getRelations } from '@/data/relationships'
import { computed, onMounted, ref } from 'vue'
import type { RelationEntry } from '@/data/relationships'

const route = useRoute()
const router = useRouter()
const store = useTestStore()

const mode = computed(() => route.params.mode as string)
const result = computed(() => store.result)
const isDebug = computed(() => mode.value === 'debug')

// 计数
const completeCount = ref(0)
const typeCount = ref(0)

// 人格关系数据
const relations = computed<RelationEntry[]>(() => {
  if (!result.value) return []
  return getRelations(result.value.type.code)
})

onMounted(() => {
  if (!store.isComplete || store.mode !== mode.value) {
    router.push('/')
    return
  }
  // 增加完成计数和类型计数
  counter.hitComplete().then((n) => {
    completeCount.value = n
  })
  if (result.value?.type.code) {
    counter.hitType(result.value.type.code).then((n) => {
      typeCount.value = n
    })
  }
})

function restart() {
  const wasDebug = isDebug.value
  store.reset()
  if (wasDebug) {
    router.push('/test/debug/1')
  } else {
    router.push('/')
  }
}

function exitDebug() {
  store.reset()
  router.push('/')
}

function share() {
  alert('当前处于内测版本，请不要外传本项目。')
}

const dimensionPairs = computed(() => {
  if (!result.value) return []
  const s = result.value.scores
  return [
    { label: '社交电量', left: 'O 充电型', right: 'R 省电型', leftScore: s.E, rightScore: s.I, codeLeft: 'O', codeRight: 'R' },
    { label: '信息偏好', left: 'G 显微镜', right: 'V 望远镜', leftScore: s.S, rightScore: s.N, codeLeft: 'G', codeRight: 'V' },
    { label: '决策风格', left: 'L 计算器', right: 'E 温度计', leftScore: s.T, rightScore: s.F, codeLeft: 'L', codeRight: 'E' },
    { label: '生活节奏', left: 'S 课表型', right: 'F 随心型', leftScore: s.J, rightScore: s.P, codeLeft: 'S', codeRight: 'F' },
  ]
})

function getLetterClass(letter: string) {
  // MBTI -> NFTI 映射
  const map: Record<string, string> = {
    'E': 'letter-o', 'I': 'letter-r',
    'S': 'letter-g', 'N': 'letter-v',
    'T': 'letter-l', 'F': 'letter-e',
    'J': 'letter-s', 'P': 'letter-f',
  }
  return map[letter] || ''
}

function getNFTILetter(mbtiLetter: string): string {
  const map: Record<string, string> = {
    'E': 'O', 'I': 'R',
    'S': 'G', 'N': 'V',
    'T': 'L', 'F': 'E',
    'J': 'S', 'P': 'F',
  }
  return map[mbtiLetter] || mbtiLetter
}

function getDimensionInfo(leftScore: number, rightScore: number, mode: string) {
  const diff = leftScore - rightScore
  // 快速测试：每维度3题 * 3分 = 9分最大差距
  // 完整测试：每维度12题 * 3分 = 36分最大差距
  const maxPossibleDiff = mode === 'quick' ? 9 : 36
  const intensity = Math.min(Math.abs(diff) / maxPossibleDiff, 1)

  // 主导侧百分比 = 50% + 倾向强度 * 50%
  // 劣势侧百分比 = 100% - 主导侧百分比
  // 两侧之和始终 = 100%
  const dominantPct = Math.round(50 + intensity * 50)
  const weakPct = 100 - dominantPct

  const winner = diff >= 0 ? 'left' : 'right'
  const diffAbs = Math.abs(diff)

  return {
    leftPct: diff >= 0 ? dominantPct : weakPct,
    rightPct: diff >= 0 ? weakPct : dominantPct,
    winner,
    diffAbs,
  }
}
</script>

<template>
  <div class="result-page" v-if="result">
    <div class="content">
      <!-- 顶部返回与反馈 -->
      <div class="top-bar">
        <button class="back-btn" @click="router.push('/')">
          <span aria-hidden="true">←</span> 返回首页
        </button>
        <button class="feedback-btn" @click="router.push({ path: '/feedback', query: { from: 'result' } })">
          <span aria-hidden="true">✎</span> 反馈
        </button>
      </div>

      <!-- 模式标签 -->
      <div class="mode-label" :class="{ debug: isDebug }">
        {{ isDebug ? 'DEBUG 结果' : result.mode === 'quick' ? '快速测试结果' : '完整测试结果' }}
      </div>

      <!-- 人格类型展示 -->
      <div class="type-display" :class="{ hidden: result.type.isHidden }">
        <!-- NFTI 四字母便利贴 -->
        <div v-if="result.mode !== 'quick' && result.type.fourLetter && !result.type.isHidden" class="nfti-sticker">
          <div class="sticker-tape"></div>
          <div class="sticker-content">
            <span class="sticker-letter" v-for="(letter, idx) in result.type.fourLetter.split('')" :key="idx" :class="getLetterClass(letter)">{{ getNFTILetter(letter) }}</span>
          </div>
        </div>

        <!-- 文字信息 -->
        <div class="type-meta-overlay">
          <div class="type-code">{{ result.type.code }}</div>
          <div class="type-name">{{ result.type.name }}</div>
        </div>

        <!-- 插图放在CODE和NAME下方 -->
        <div class="type-hero">
          <img v-if="result.type.illustration" :src="result.type.illustration" :alt="result.type.name" class="type-illustration" />
          <div v-else class="type-illustration-placeholder">
            <span>{{ result.type.code[0] }}</span>
          </div>
        </div>

        <div v-if="result.type.isHidden" class="hidden-badge">
          <span class="badge-star" aria-hidden="true">✦</span>
          隐藏款
          <span class="badge-star" aria-hidden="true">✦</span>
        </div>
        <div v-if="result.type.isHidden && result.type.unlockCondition" class="unlock-condition">
          解锁条件：{{ result.type.unlockCondition }}
        </div>
      </div>

      <!-- 一句话描述 -->
      <div class="type-description">
        <p>{{ result.type.description }}</p>
      </div>

      <!-- 详细解析 -->
      <div v-if="result.type.detail" class="type-detail">
        <h3>你是这样的人</h3>
        <p>{{ result.type.detail }}</p>
      </div>

      <!-- 计数信息 -->
      <div v-if="completeCount > 0" class="counter-info">
        <p>你是第 {{ completeCount }} 个完成测试的</p>
        <p v-if="typeCount > 0">第 {{ typeCount }} 个 {{ result.type.name }} 类型</p>
      </div>

      <!-- 维度得分（完整测试和 Debug 模式） -->
      <div v-if="result.mode === 'full' || result.mode === 'debug'" class="dimensions">
        <h3>四维解析</h3>
        <div
          v-for="(pair, idx) in dimensionPairs"
          :key="pair.label"
          class="dimension-row"
          :style="{ '--i': idx }"
        >
          <div class="dim-header">
            <span class="dim-name">{{ pair.label }}</span>
          </div>
          <div class="dim-bar">
            <span
              class="dim-side"
              :class="{ active: pair.leftScore >= pair.rightScore, dimmed: pair.leftScore < pair.rightScore }"
            >
              {{ pair.left }}
            </span>
            <div class="bar-track">
              <!-- 左侧色条 -->
              <div
                class="bar-segment bar-left"
                :class="{ dominant: pair.leftScore >= pair.rightScore }"
                :style="{
                  width: getDimensionInfo(pair.leftScore, pair.rightScore, result.mode).leftPct + '%'
                }"
              ></div>
              <!-- 右侧色条 -->
              <div
                class="bar-segment bar-right"
                :class="{ dominant: pair.rightScore > pair.leftScore }"
                :style="{
                  width: getDimensionInfo(pair.leftScore, pair.rightScore, result.mode).rightPct + '%'
                }"
              ></div>
              <!-- 中心线标记 -->
              <div class="bar-center"></div>
            </div>
            <span
              class="dim-side"
              :class="{ active: pair.rightScore > pair.leftScore, dimmed: pair.rightScore <= pair.leftScore }"
            >
              {{ pair.right }}
            </span>
          </div>
          <!-- 百分比数值 -->
          <div class="dim-values">
            <span
              class="dim-pct"
              :class="{ dimmed: pair.leftScore < pair.rightScore }"
            >
              {{ getDimensionInfo(pair.leftScore, pair.rightScore, result.mode).leftPct }}%
            </span>
            <span class="dim-raw">
              {{ pair.leftScore >= pair.rightScore ? pair.codeLeft : pair.codeRight }}
              {{ getDimensionInfo(pair.leftScore, pair.rightScore, result.mode).diffAbs }}
            </span>
            <span
              class="dim-pct"
              :class="{ dimmed: pair.rightScore <= pair.leftScore }"
            >
              {{ getDimensionInfo(pair.leftScore, pair.rightScore, result.mode).rightPct }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 快速测试引导 -->
      <div v-if="result.mode === 'quick'" class="upgrade-prompt">
        <div class="prompt-icon" aria-hidden="true">✦</div>
        <p class="upgrade-limit">快速测试仅通过 12 道题评估你的基础倾向，结果为 4 种概括型人格之一。</p>
        <p>完整测试（48 题）将解锁 16 种标准人格 + 3 款隐藏人格，并获得四维深度解析。</p>
        <button class="upgrade-btn" @click="router.push('/test/full/1')">
          开始完整测试
        </button>
      </div>

      <!-- 人格关系图谱 -->
      <div v-if="relations.length > 0" class="relations-section">
        <h3>人格关系图谱</h3>
        <div class="relations-list">
          <div
            v-for="(rel, idx) in relations"
            :key="idx"
            class="relation-card"
            :class="`relation-${rel.type}`"
          >
            <div class="relation-badge">{{ rel.type }}</div>
            <div class="relation-target">
              <span class="target-nfti">{{ rel.targetNfti }}</span>
              <span class="target-name">{{ rel.targetName }}</span>
            </div>
            <p class="relation-desc">{{ rel.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button v-if="!isDebug" class="action-btn share" @click="share">
          <span aria-hidden="true">↗</span> 分享结果
        </button>
        <button v-if="isDebug" class="action-btn share" @click="exitDebug">
          <span aria-hidden="true">←</span> 退出 Debug
        </button>
        <button class="action-btn restart" @click="restart">
          <span aria-hidden="true">↻</span> {{ isDebug ? '重新测试（Debug）' : '重新测试' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.content {
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-12);
}

/* ---- Back Button ---- */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  font-size: 14px;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-2) 0;
  transition: color 150ms ease;
}
.back-btn:hover {
  color: var(--color-primary);
}
.feedback-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  font-size: 13px;
  color: var(--gray-400);
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: 8px;
  transition: all 150ms ease;
}
.feedback-btn:hover {
  color: var(--color-primary);
  background: var(--color-bg-soft);
}

/* ---- Mode Label ---- */
.mode-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--space-5);
}
.mode-label.debug {
  color: var(--rose-500);
  font-weight: 700;
}

/* ---- Type Display ---- */
.type-display {
  margin-bottom: var(--space-6);
  padding: var(--space-8) var(--space-5) var(--space-6);
  border-radius: 28px;
  background: linear-gradient(180deg, var(--indigo-50) 0%, var(--gray-0) 40%);
  border: 1.5px solid var(--color-border);
  position: relative;
  overflow: visible;
  text-align: center;
}

.type-display.hidden {
  background: linear-gradient(180deg, var(--amber-50) 0%, var(--rose-50) 40%);
  border-color: var(--amber-200);
  animation: goldenGlow 3s ease-in-out infinite;
}

@keyframes goldenGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.15), 0 0 60px rgba(251, 191, 36, 0.05);
  }
  50% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.3), 0 0 100px rgba(251, 191, 36, 0.1);
  }
}

/* ---- Type Hero: 插图作为绝对视觉中心 ---- */
.type-hero {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin: var(--space-2) 0 var(--space-4);
}
.type-illustration {
  width: 320px;
  height: 320px;
  object-fit: contain;
  border-radius: 28px;
  filter: drop-shadow(0 12px 32px rgba(0,0,0,0.1));
  transition: transform 300ms var(--ease-out-quint);
}
.type-illustration:hover {
  transform: scale(1.02);
}
.type-illustration-placeholder {
  width: 320px;
  height: 320px;
  border-radius: 28px;
  background: linear-gradient(135deg, var(--indigo-100), var(--indigo-50));
  display: flex;
  align-items: center;
  justify-content: center;
}
.type-illustration-placeholder span {
  font-family: var(--font-display);
  font-size: 120px;
  font-weight: 700;
  color: var(--indigo-300);
}

/* ---- Type Meta Overlay: 文字在插图下方 ---- */
.type-meta-overlay {
  position: relative;
  z-index: 1;
  margin-top: var(--space-2);
}
.type-code {
  font-family: var(--font-display);
  font-size: clamp(44px, 14vw, 72px);
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1;
  margin-bottom: var(--space-2);
  letter-spacing: -0.03em;
}
.type-name {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--space-2);
}
.type-four-letter {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-400);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* ---- NFTI Sticker ---- */
.nfti-sticker {
  position: absolute;
  top: -12px;
  right: 20px;
  background: #fff9c4;
  padding: var(--space-2) var(--space-3);
  border-radius: 4px;
  box-shadow: 2px 3px 10px rgba(0,0,0,0.12);
  transform: rotate(3deg);
  z-index: 10;
}
.sticker-tape {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 14px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.sticker-content {
  display: flex;
  gap: 2px;
  justify-content: center;
}
.sticker-letter {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  width: 20px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.letter-o { background: #dbeafe; color: #1e40af; }
.letter-r { background: #dcfce7; color: #166534; }
.letter-g { background: #fef3c7; color: #92400e; }
.letter-v { background: #f3e8ff; color: #6b21a8; }
.letter-l { background: #e0f2fe; color: #0c4a6e; }
.letter-e { background: #fce7f3; color: #9d174d; }
.letter-s { background: #f1f5f9; color: #334155; }
.letter-f { background: #ffedd5; color: #9a3412; }

.hidden-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: linear-gradient(135deg, var(--amber-400), var(--amber-500));
  color: var(--gray-0);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  position: relative;
  z-index: 1;
  animation: badgePulse 2s ease-in-out infinite;
}
.badge-star {
  font-size: 12px;
  opacity: 0.9;
}
.unlock-condition {
  margin-top: var(--space-2);
  font-size: 12px;
  color: var(--gray-500);
  font-style: italic;
}
@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* ---- Description ---- */
.type-description {
  background: var(--gray-0);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  position: relative;
}
.type-description::before {
  content: '"';
  position: absolute;
  top: var(--space-3);
  left: var(--space-4);
  font-family: var(--font-display);
  font-size: 48px;
  color: var(--indigo-200);
  line-height: 1;
  opacity: 0.6;
}
.type-description p {
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.8;
  color: var(--gray-700);
  padding-left: var(--space-6);
}

/* ---- Type Detail ---- */
.type-detail {
  background: var(--gray-0);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}
.type-detail h3 {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--space-3);
  letter-spacing: 0.02em;
}
.type-detail p {
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.8;
  color: var(--gray-600);
}

/* ---- Dimensions ---- */
.dimensions {
  background: var(--gray-0);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}
.dimensions h3 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--space-5);
}

.dimension-row {
  margin-bottom: var(--space-5);
  animation: dimIn 400ms var(--ease-out-expo) both;
  animation-delay: calc(var(--i, 0) * 100ms + 200ms);
}
@keyframes dimIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

.dim-header {
  margin-bottom: var(--space-2);
}
.dim-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
}

.dim-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dim-side {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-400);
  width: 60px;
  text-align: center;
  transition: color 200ms ease;
}
.dim-side.active {
  color: var(--color-primary);
  font-weight: 700;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: var(--gray-100);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
}

.bar-segment {
  height: 100%;
  transition: all 600ms var(--ease-out-expo);
}
/* 左侧条圆角 */
.bar-segment.bar-left {
  border-radius: 4px 0 0 4px;
}
/* 右侧条圆角 */
.bar-segment.bar-right {
  border-radius: 0 4px 4px 0;
}
/* 劣势侧：浅灰色 */
.bar-segment:not(.dominant) {
  background: var(--gray-300);
}
/* 主导侧：紫色 */
.bar-segment.dominant {
  background: linear-gradient(90deg, var(--indigo-500), var(--indigo-600));
}

.bar-center {
  position: absolute;
  left: 50%;
  top: -2px;
  width: 2px;
  height: 12px;
  background: var(--gray-500);
  border-radius: 1px;
  z-index: 2;
  transform: translateX(-50%);
}

/* Dimension values */
.dim-values {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2);
  padding: 0 68px;
}
.dim-pct {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-400);
  transition: color 200ms ease;
}
.dim-pct.dimmed {
  color: var(--gray-300);
}
.dim-side.dimmed {
  color: var(--gray-300);
}
.dim-raw {
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-400);
  background: var(--gray-100);
  padding: 2px 10px;
  border-radius: 100px;
  font-variant-numeric: tabular-nums;
}

/* ---- Upgrade Prompt ---- */
.upgrade-prompt {
  background: linear-gradient(135deg, var(--indigo-600), var(--indigo-700));
  border-radius: 20px;
  padding: var(--space-6);
  text-align: center;
  margin-bottom: var(--space-6);
  color: var(--color-text-inverse);
  position: relative;
  overflow: hidden;
}
.upgrade-prompt::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: rgba(255,255,255,0.05);
  border-radius: 50%;
  pointer-events: none;
}

.prompt-icon {
  font-size: 24px;
  margin-bottom: var(--space-2);
  opacity: 0.8;
}
.upgrade-prompt p {
  font-size: 15px;
  margin-bottom: var(--space-4);
  opacity: 0.95;
}
.upgrade-prompt .upgrade-limit {
  font-size: 13px;
  opacity: 0.75;
  margin-bottom: var(--space-2);
}
.counter-info {
  text-align: center;
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-soft);
  border-radius: 16px;
  margin-bottom: var(--space-6);
}
.counter-info p {
  font-size: 13px;
  color: var(--gray-500);
  margin: 0;
  line-height: 1.6;
}

.upgrade-btn {
  padding: var(--space-3) var(--space-6);
  background: var(--color-text-inverse);
  color: var(--indigo-700);
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 150ms var(--ease-out-quint), box-shadow 150ms ease;
  position: relative;
  z-index: 1;
}
.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.upgrade-btn:active {
  transform: translateY(0);
}

/* ---- Actions ---- */
.actions {
  display: flex;
  gap: var(--space-3);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms var(--ease-out-quint);
}
.action-btn:active {
  transform: scale(0.97);
}

.action-btn.share {
  background: var(--gray-100);
  color: var(--gray-700);
}
.action-btn.share:hover {
  background: var(--gray-200);
}

.action-btn.restart {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}
.action-btn.restart:hover {
  background: var(--indigo-700);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);
}

/* ---- Relations Section ---- */
.relations-section {
  background: var(--gray-0);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}
.relations-section h3 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--space-4);
}
.relations-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.relation-card {
  padding: var(--space-4);
  border-radius: 16px;
  border: 1.5px solid var(--color-border);
  background: var(--gray-0);
  transition: transform 150ms ease, box-shadow 150ms ease;
}
.relation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.relation-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-2);
}
.relation-绝配 .relation-badge {
  background: linear-gradient(135deg, #dbeafe, #dcfce7);
  color: #1e40af;
}
.relation-天敌 .relation-badge {
  background: linear-gradient(135deg, #fee2e2, #ffedd5);
  color: #991b1b;
}
.relation-孽缘 .relation-badge {
  background: linear-gradient(135deg, #f3e8ff, #fce7f3);
  color: #7c3aed;
}
.relation-专克 .relation-badge {
  background: linear-gradient(135deg, #fef3c7, #ffedd5);
  color: #92400e;
}
.relation-target {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.target-nfti {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.08em;
}
.target-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-700);
}
.relation-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--gray-500);
  margin: 0;
}

/* ---- Responsive ---- */
@media (max-width: 480px) {
  .content {
    padding: var(--space-4) var(--space-4) var(--space-10);
  }
  .type-illustration,
  .type-illustration-placeholder {
    width: 260px;
    height: 260px;
  }
  .type-code {
    font-size: 44px;
  }
  .type-name {
    font-size: 26px;
  }
  .nfti-sticker {
    top: -10px;
    right: 8px;
    padding: var(--space-1) var(--space-2);
  }
  .sticker-letter {
    font-size: 14px;
    width: 18px;
    height: 22px;
  }
  .type-description {
    padding: var(--space-5);
  }
  .type-description::before {
    font-size: 36px;
  }
  .type-description p {
    padding-left: var(--space-4);
    font-size: 15px;
  }
  .dim-side {
    font-size: 11px;
    width: 52px;
  }
  .action-btn {
    font-size: 14px;
    padding: var(--space-3);
  }
}
</style>
