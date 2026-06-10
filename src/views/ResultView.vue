<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useTestStore } from '@/stores/testStore'
import { computed, onMounted } from 'vue'
import ThreeScene from '@/components/ThreeScene.vue'

const route = useRoute()
const router = useRouter()
const store = useTestStore()

const mode = computed(() => route.params.mode as string)
const result = computed(() => store.result)

onMounted(() => {
  if (!store.isComplete || store.mode !== mode.value) {
    router.push('/')
  }
})

function restart() {
  store.reset()
  router.push('/')
}

function share() {
  alert('分享功能开发中...')
}

const dimensionPairs = computed(() => {
  if (!result.value) return []
  const s = result.value.scores
  return [
    { label: '能量来源', left: 'O 外放', right: 'R 内敛', leftScore: s.E, rightScore: s.I, codeLeft: 'O', codeRight: 'R' },
    { label: '信息接收', left: 'G 务实', right: 'V 前瞻', leftScore: s.S, rightScore: s.N, codeLeft: 'G', codeRight: 'V' },
    { label: '决策依据', left: 'L 理性', right: 'E 共情', leftScore: s.T, rightScore: s.F, codeLeft: 'L', codeRight: 'E' },
    { label: '生活态度', left: 'S 有序', right: 'F 随性', leftScore: s.J, rightScore: s.P, codeLeft: 'S', codeRight: 'F' },
  ]
})

function getDimensionInfo(leftScore: number, rightScore: number) {
  const total = Math.abs(leftScore) + Math.abs(rightScore)
  if (total === 0) {
    return { leftPct: 50, rightPct: 50, winner: 'tie', diffAbs: 0 }
  }

  // 两侧百分比之和 = 100%
  const leftPct = Math.round((Math.abs(leftScore) / total) * 100)
  const rightPct = 100 - leftPct

  const winner = leftScore >= rightScore ? 'left' : 'right'
  const diffAbs = Math.abs(leftScore - rightScore)

  return { leftPct, rightPct, winner, diffAbs }
}
</script>

<template>
  <div class="result-page" v-if="result">
    <div class="content">
      <!-- 顶部返回 -->
      <button class="back-btn" @click="router.push('/')">
        <span aria-hidden="true">←</span> 返回首页
      </button>

      <!-- 模式标签 -->
      <div class="mode-label">
        {{ result.mode === 'quick' ? '快速测试结果' : '完整测试结果' }}
      </div>

      <!-- 人格类型展示 -->
      <div class="type-display" :class="{ hidden: result.type.isHidden }">
        <div class="type-code">{{ result.type.code }}</div>
        <div class="type-name">{{ result.type.name }}</div>
        <div v-if="result.type.isHidden" class="hidden-badge">
          <span class="badge-star" aria-hidden="true">✦</span>
          隐藏款
          <span class="badge-star" aria-hidden="true">✦</span>
        </div>
      </div>

      <!-- 3D 效果 -->
      <ThreeScene
        :personality-code="result.type.code"
        :is-hidden="result.type.isHidden"
        class="three-scene"
      />

      <!-- 一句话描述 -->
      <div class="type-description">
        <p>{{ result.type.description }}</p>
      </div>

      <!-- 详细解析 -->
      <div v-if="result.type.detail" class="type-detail">
        <h3>你是这样的人</h3>
        <p>{{ result.type.detail }}</p>
      </div>

      <!-- 维度得分（仅完整测试） -->
      <div v-if="result.mode === 'full'" class="dimensions">
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
              <!-- 左侧色条（灰色底 + 主导时紫色） -->
              <div
                class="bar-bg bar-bg-left"
                :style="{ width: '50%' }"
              ></div>
              <div
                class="bar-fill bar-left"
                :class="{ dominant: pair.leftScore >= pair.rightScore }"
                :style="{
                  right: '50%',
                  width: getDimensionInfo(pair.leftScore, pair.rightScore).leftPct / 2 + '%'
                }"
              ></div>
              <!-- 右侧色条（灰色底 + 主导时紫色） -->
              <div
                class="bar-bg bar-bg-right"
                :style="{ width: '50%' }"
              ></div>
              <div
                class="bar-fill bar-right"
                :class="{ dominant: pair.rightScore > pair.leftScore }"
                :style="{
                  left: '50%',
                  width: getDimensionInfo(pair.leftScore, pair.rightScore).rightPct / 2 + '%'
                }"
              ></div>
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
              {{ getDimensionInfo(pair.leftScore, pair.rightScore).leftPct }}%
            </span>
            <span class="dim-raw">
              {{ pair.leftScore >= pair.rightScore ? pair.codeLeft : pair.codeRight }}
              {{ getDimensionInfo(pair.leftScore, pair.rightScore).diffAbs }}
            </span>
            <span
              class="dim-pct"
              :class="{ dimmed: pair.rightScore <= pair.leftScore }"
            >
              {{ getDimensionInfo(pair.leftScore, pair.rightScore).rightPct }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 快速测试引导 -->
      <div v-if="result.mode === 'quick'" class="upgrade-prompt">
        <div class="prompt-icon" aria-hidden="true">✦</div>
        <p>想知道更详细的 19 种完整人格？</p>
        <button class="upgrade-btn" @click="router.push('/test/full/1')">
          开始完整测试
        </button>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="action-btn share" @click="share">
          <span aria-hidden="true">↗</span> 分享结果
        </button>
        <button class="action-btn restart" @click="restart">
          <span aria-hidden="true">↻</span> 重新测试
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
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  font-size: 14px;
  color: var(--color-text-muted);
  cursor: pointer;
  margin-bottom: var(--space-6);
  padding: var(--space-2) 0;
  transition: color 150ms ease;
}
.back-btn:hover {
  color: var(--color-primary);
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

/* ---- Type Display ---- */
.type-display {
  text-align: center;
  margin-bottom: var(--space-6);
  padding: var(--space-6) var(--space-4);
  border-radius: 24px;
  background: var(--gray-0);
  border: 1.5px solid var(--color-border);
  position: relative;
  overflow: hidden;
}
.type-display::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--indigo-50), transparent 60%);
  opacity: 0.5;
  pointer-events: none;
}

.type-display.hidden {
  background: linear-gradient(135deg, var(--amber-50), var(--rose-50));
  border-color: var(--amber-200);
  animation: goldenGlow 3s ease-in-out infinite;
}
.type-display.hidden::before {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), transparent);
}

@keyframes goldenGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.15), 0 0 60px rgba(251, 191, 36, 0.05);
  }
  50% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.3), 0 0 100px rgba(251, 191, 36, 0.1);
  }
}

.type-code {
  font-family: var(--font-display);
  font-size: clamp(48px, 12vw, 64px);
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1;
  margin-bottom: var(--space-2);
  letter-spacing: -0.03em;
  position: relative;
  z-index: 1;
}
.type-name {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--space-3);
  position: relative;
  z-index: 1;
}

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
  opacity: 0.8;
}
@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* ---- 3D Scene ---- */
.three-scene {
  margin-bottom: var(--space-6);
  border-radius: 20px;
  overflow: hidden;
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
}

.bar-bg {
  position: absolute;
  top: 0;
  height: 100%;
  background: var(--gray-200);
}
.bar-bg-left {
  left: 0;
  border-radius: 4px 0 0 4px;
}
.bar-bg-right {
  right: 0;
  border-radius: 0 4px 4px 0;
}

.bar-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  transition: all 600ms var(--ease-out-expo);
  background: var(--gray-400); /* 默认灰色（劣势侧） */
}
/* 主导侧：紫色 */
.bar-fill.bar-left.dominant {
  background: linear-gradient(90deg, var(--indigo-400), var(--indigo-600));
}
.bar-fill.bar-right.dominant {
  background: linear-gradient(90deg, var(--indigo-600), var(--indigo-400));
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

/* ---- Responsive ---- */
@media (max-width: 480px) {
  .content {
    padding: var(--space-4) var(--space-4) var(--space-10);
  }
  .type-code {
    font-size: 44px;
  }
  .type-name {
    font-size: 24px;
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
