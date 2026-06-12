<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import html2canvas from 'html2canvas'
import type { PersonalityType, DimensionScores, TestMode } from '@/types'
import { getRelations } from '@/data/relationships'
import qrCodeImg from '@/assets/QR-Code.jpg'

const props = defineProps<{
  show: boolean
  mode: TestMode
  type: PersonalityType
  scores: DimensionScores
  illustrationUrl?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const shareCardRef = ref<HTMLDivElement | null>(null)
const isGenerating = ref(false)
const savedImageUrl = ref<string | null>(null)

// 维度信息
const dimensionPairs = computed(() => {
  const s = props.scores
  return [
    { label: '社交电量', left: 'O', right: 'R', leftScore: s.E, rightScore: s.I },
    { label: '信息偏好', left: 'G', right: 'V', leftScore: s.S, rightScore: s.N },
    { label: '决策风格', left: 'L', right: 'E', leftScore: s.T, rightScore: s.F },
    { label: '生活节奏', left: 'S', right: 'F', leftScore: s.J, rightScore: s.P },
  ]
})

// 绝配关系
const bestMatch = computed(() => {
  const relations = getRelations(props.type.code)
  return relations.find(r => r.type === '绝配') || null
})

function getDimensionPct(leftScore: number, rightScore: number) {
  const diff = leftScore - rightScore
  const maxPossibleDiff = props.mode === 'quick' ? 9 : 36
  const intensity = Math.min(Math.abs(diff) / maxPossibleDiff, 1)
  const dominantPct = Math.round(50 + intensity * 50)
  const weakPct = 100 - dominantPct
  const winner = diff >= 0 ? 'left' : 'right'
  return {
    leftPct: diff >= 0 ? dominantPct : weakPct,
    rightPct: diff >= 0 ? weakPct : dominantPct,
    winner,
  }
}

function getNftiLetter(mbtiLetter: string): string {
  const map: Record<string, string> = {
    'E': 'O', 'I': 'R', 'S': 'G', 'N': 'V', 'T': 'L', 'F': 'E', 'J': 'S', 'P': 'F'
  }
  return map[mbtiLetter] || mbtiLetter
}

const nftiCode = computed(() => {
  if (!props.type.fourLetter) return props.type.code
  return props.type.fourLetter.split('').map(getNftiLetter).join('')
})

// 生成分享文案
const shareText = computed(() => {
  const matchText = bestMatch.value
    ? `\n💕 绝配：${bestMatch.value.targetName}（${bestMatch.value.targetNfti}）`
    : ''
  return `我在 NFTI 南方人格测试中测出了「${props.type.name}」(${nftiCode.value})！${matchText}\n\n${props.type.description}\n\n来测测你是哪种南方人？\n\nhttps://nf-bti.pages.dev`
})

// 复制文案
async function copyText() {
  try {
    await navigator.clipboard.writeText(shareText.value)
    alert('文案已复制到剪贴板')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = shareText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('文案已复制到剪贴板')
  }
}

// 使用 html2canvas 生成图片
async function generateCardImage() {
  if (!shareCardRef.value) return
  isGenerating.value = true
  try {
    const canvas = await html2canvas(shareCardRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    })
    savedImageUrl.value = canvas.toDataURL('image/png')
  } catch (err) {
    console.error('生成图片失败:', err)
    alert('生成图片失败，请尝试截图分享')
  } finally {
    isGenerating.value = false
  }
}

// 下载图片
function downloadImage() {
  if (!savedImageUrl.value) {
    generateCardImage().then(() => {
      if (savedImageUrl.value) triggerDownload()
    })
    return
  }
  triggerDownload()
}

function triggerDownload() {
  if (!savedImageUrl.value) return
  const link = document.createElement('a')
  link.download = `NFTI_${props.type.code}_${Date.now()}.png`
  link.href = savedImageUrl.value
  link.click()
}

// 弹窗打开时预生成图片
watch(() => props.show, (show) => {
  if (show) {
    savedImageUrl.value = null
    nextTick(() => {
      setTimeout(() => generateCardImage(), 400)
    })
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="share-modal-overlay" @click.self="emit('close')">
        <Transition name="slide-up">
          <div v-if="show" class="share-modal">
            <!-- 头部 -->
            <div class="share-header">
              <h3>分享我的结果</h3>
              <button class="close-btn" @click="emit('close')" aria-label="关闭">✕</button>
            </div>

            <!-- 分享卡片预览 -->
            <div ref="shareCardRef" class="share-card">
              <!-- 顶部品牌条 -->
              <div class="card-brand-bar">
                <span class="brand-mark">NFTI</span>
                <span class="brand-divider"></span>
                <span class="brand-tag">你是哪种南方人？</span>
              </div>

              <!-- 核心信息区：插图 + 编码 -->
              <div class="card-hero">
                <div class="card-illustration-wrap">
                  <img
                    v-if="illustrationUrl"
                    :src="illustrationUrl"
                    :alt="type.name"
                    class="card-illustration"
                    crossorigin="anonymous"
                  />
                  <div v-else class="card-illustration-placeholder">
                    <span>{{ type.code[0] }}</span>
                  </div>
                </div>
                <div class="card-identity">
                  <div class="card-code">{{ type.code }}</div>
                  <div class="card-name">{{ type.name }}</div>
                  <div v-if="type.fourLetter && !type.isHidden" class="card-nfti">{{ nftiCode }}</div>
                </div>
              </div>

              <!-- 描述 -->
              <div class="card-desc">{{ type.description }}</div>

              <!-- 绝配关系 -->
              <div v-if="bestMatch" class="card-match">
                <div class="match-header">
                  <span class="match-icon">💕</span>
                  <span class="match-label">绝配</span>
                </div>
                <div class="match-target">
                  <span class="match-nfti">{{ bestMatch.targetNfti }}</span>
                  <span class="match-name">{{ bestMatch.targetName }}</span>
                </div>
                <p class="match-desc">{{ bestMatch.desc }}</p>
              </div>

              <!-- 维度解析 -->
              <div class="card-dims">
                <div
                  v-for="pair in (mode === 'quick' ? dimensionPairs.slice(0, 2) : dimensionPairs)"
                  :key="pair.label"
                  class="dim-row"
                >
                  <span class="dim-side" :class="{ active: getDimensionPct(pair.leftScore, pair.rightScore).winner === 'left' }">{{ pair.left }}</span>
                  <div class="dim-bar-track">
                    <div
                      class="dim-bar-fill"
                      :class="{ left: getDimensionPct(pair.leftScore, pair.rightScore).winner === 'left' }"
                      :style="{ width: Math.max(getDimensionPct(pair.leftScore, pair.rightScore).leftPct, getDimensionPct(pair.leftScore, pair.rightScore).rightPct) + '%' }"
                    ></div>
                  </div>
                  <span class="dim-side" :class="{ active: getDimensionPct(pair.leftScore, pair.rightScore).winner === 'right' }">{{ pair.right }}</span>
                </div>
              </div>

              <!-- 底部：二维码 + 网址 -->
              <div class="card-bottom">
                <div class="qr-section">
                  <img :src="qrCodeImg" alt="扫码测试" class="qr-code" crossorigin="anonymous" />
                  <span class="qr-hint">扫码测测你是哪种南方人</span>
                </div>
                <div class="card-meta">
                  <span class="meta-mode">{{ mode === 'quick' ? '快速测试' : '完整测试' }}</span>
                  <span class="meta-url">nf-bti.pages.dev</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="share-actions">
              <button class="share-action-btn primary" @click="copyText">
                <span class="action-icon">📋</span>
                <span>复制文案</span>
              </button>
              <button class="share-action-btn" @click="downloadImage" :disabled="isGenerating">
                <span class="action-icon">💾</span>
                <span>{{ isGenerating ? '生成中...' : '保存图片' }}</span>
              </button>
            </div>

            <p class="share-tip">
              {{ savedImageUrl ? 'QQ、微信内置浏览器无法保存图片，请直接截屏保存' : '正在生成分享图片...' }}
            </p>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.share-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.share-modal {
  background: var(--gray-0);
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-5);
  padding-bottom: var(--space-8);
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.share-header h3 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
}
.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--gray-400);
  cursor: pointer;
  padding: var(--space-2);
  line-height: 1;
}
.close-btn:hover {
  color: var(--gray-600);
}

/* ---- Share Card ---- */
.share-card {
  background: #ffffff;
  border: 1px solid var(--gray-200);
  border-radius: 16px;
  padding: var(--space-4);
  margin-bottom: var(--space-5);
  position: relative;
  overflow: hidden;
}

/* 顶部品牌条 */
.card-brand-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.brand-mark {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.1em;
}
.brand-divider {
  width: 1px;
  height: 12px;
  background: var(--gray-300);
}
.brand-tag {
  font-size: 12px;
  color: var(--gray-400);
}

/* Hero 区：插图 + 编码并排 */
.card-hero {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}
.card-illustration-wrap {
  flex-shrink: 0;
}
.card-illustration {
  width: 120px;
  height: auto;
  max-height: 120px;
  object-fit: contain;
  border-radius: 12px;
  background: var(--gray-50);
  display: block;
}
.card-illustration-placeholder {
  width: 120px;
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--indigo-100), var(--indigo-50));
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-illustration-placeholder span {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  color: var(--indigo-300);
}

.card-identity {
  flex: 1;
  min-width: 0;
}
.card-code {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1;
  letter-spacing: -0.02em;
}
.card-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--space-1);
}
.card-nfti {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-400);
  letter-spacing: 0.12em;
  margin-top: 2px;
}

/* 描述 */
.card-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--gray-600);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--gray-100);
}

/* 绝配关系 */
.card-match {
  padding: var(--space-3);
  background: linear-gradient(135deg, #eef2ff, #f0fdf4);
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  margin-bottom: var(--space-3);
}
.match-header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}
.match-icon {
  font-size: 12px;
}
.match-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.04em;
}
.match-target {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}
.match-nfti {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.08em;
}
.match-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-700);
}
.match-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--gray-500);
  margin: 0;
}

/* 维度解析 */
.card-dims {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.dim-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.dim-side {
  font-size: 11px;
  font-weight: 500;
  color: var(--gray-400);
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}
.dim-side.active {
  color: var(--color-primary);
  font-weight: 700;
}
.dim-bar-track {
  flex: 1;
  height: 8px;
  background: var(--gray-100);
  border-radius: 4px;
  overflow: hidden;
}
.dim-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--indigo-500), var(--indigo-600));
  border-radius: 4px;
  transition: width 600ms var(--ease-out-expo);
}
.dim-bar-fill.left {
  background: linear-gradient(90deg, var(--indigo-400), var(--indigo-500));
}

/* 底部：二维码 + 网址 */
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--gray-100);
}
.qr-section {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.qr-code {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: contain;
}
.qr-hint {
  font-size: 10px;
  color: var(--gray-400);
  line-height: 1.4;
  max-width: 80px;
}
.card-meta {
  text-align: right;
}
.meta-mode {
  display: block;
  font-size: 10px;
  color: var(--gray-400);
  margin-bottom: 2px;
}
.meta-url {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
}

/* Actions */
.share-actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.share-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--gray-200);
  border-radius: 14px;
  background: var(--gray-0);
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-700);
  cursor: pointer;
  transition: all 150ms var(--ease-out-quint);
}
.share-action-btn:hover {
  border-color: var(--indigo-300);
  background: var(--indigo-50);
}
.share-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.share-action-btn.primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: transparent;
}
.share-action-btn.primary:hover {
  background: var(--indigo-700);
}
.action-icon {
  font-size: 18px;
}

.share-tip {
  text-align: center;
  font-size: 12px;
  color: var(--gray-400);
  margin: 0;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: transform 300ms var(--ease-out-expo);
}
.slide-up-leave-active {
  transition: transform 200ms ease-in;
}
.slide-up-enter-from {
  transform: translateY(100%);
}
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (max-width: 480px) {
  .share-modal {
    padding: var(--space-4) var(--space-4) var(--space-6);
    max-width: 100%;
  }
  .share-card {
    padding: var(--space-3);
  }
  .card-hero {
    gap: var(--space-3);
  }
  .card-illustration {
    width: 100px;
    height: auto;
    max-height: 100px;
  }
  .card-illustration-placeholder {
    width: 100px;
    height: 67px;
  }
  .card-code {
    font-size: 28px;
  }
  .card-name {
    font-size: 16px;
  }
  .qr-code {
    width: 48px;
    height: 48px;
  }
  .share-action-btn {
    font-size: 14px;
    padding: var(--space-3);
  }
}
</style>
