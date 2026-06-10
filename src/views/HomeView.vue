<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTestStore } from '@/stores/testStore'
import { ref, onMounted } from 'vue'

const router = useRouter()
const store = useTestStore()
const showResumeModal = ref(false)
const resumeMode = ref<'quick' | 'full' | null>(null)
const resumePage = ref(1)

onMounted(() => {
  const unfinished = store.hasUnfinishedProgress()
  if (unfinished) {
    resumeMode.value = unfinished.mode
    resumePage.value = unfinished.currentPage
    showResumeModal.value = true
  }
})

function startTest(mode: 'quick' | 'full') {
  store.setMode(mode)
  router.push(`/test/${mode}/1`)
}

function resumeTest() {
  if (resumeMode.value) {
    store.loadProgress()
    router.push(`/test/${resumeMode.value}/${resumePage.value}`)
  }
  showResumeModal.value = false
}

function dismissModal() {
  showResumeModal.value = false
  store.clearProgress()
}
</script>

<template>
  <div class="home">
    <!-- 背景装饰 -->
    <div class="bg-blob blob-1" aria-hidden="true"></div>
    <div class="bg-blob blob-2" aria-hidden="true"></div>

    <div class="content">
      <!-- 顶部标签 -->
      <div class="eyebrow">南方中学 · 人格测试</div>

      <!-- Logo 区域 -->
      <div class="hero">
        <div class="logo-mark" aria-hidden="true">
          <span class="logo-nf">NF</span>
          <span class="logo-divider"></span>
          <span class="logo-bti">BTI</span>
        </div>
        <h1 class="title">
          你是哪种<br />
          <span class="title-highlight">南方人</span>？
        </h1>
        <p class="subtitle">
          基于南方中学真实校园场景<br />
          19 种人格，等你解锁
        </p>
      </div>

      <!-- 场景标签 — 不对称排列 -->
      <div class="scene-tags">
        <span class="tag" style="--i: 0">早起抢食堂</span>
        <span class="tag" style="--i: 1">晚自习装睡</span>
        <span class="tag" style="--i: 2">三楼酱饼</span>
        <span class="tag" style="--i: 3">社团招新</span>
        <span class="tag" style="--i: 4">跑操打卡</span>
      </div>

      <!-- 模式选择 — 非对称卡片 -->
      <div class="mode-section">
        <div class="mode-card quick" @click="startTest('quick')">
          <div class="card-meta">
            <span class="card-label">快速测试</span>
            <span class="card-time">~2 分钟</span>
          </div>
          <h3 class="card-title">12 道题</h3>
          <p class="card-desc">4 种基础人格速查</p>
          <div class="card-arrow" aria-hidden="true">→</div>
        </div>

        <div class="mode-card full" @click="startTest('full')">
          <div class="card-meta">
            <span class="card-label">完整测试</span>
            <span class="card-time">~8 分钟</span>
          </div>
          <h3 class="card-title">48 道题</h3>
          <p class="card-desc">16 种标准人格 + 3 款隐藏</p>
          <div class="card-features">
            <span class="feature-pill">深度解析</span>
            <span class="feature-pill">隐藏彩蛋</span>
          </div>
          <div class="card-arrow" aria-hidden="true">→</div>
        </div>
      </div>

      <!-- 底部 -->
      <footer class="footer">
        <p>© 2025 NF-BTI · 南方人专属</p>
      </footer>
    </div>

    <!-- 恢复进度弹窗 -->
    <div v-if="showResumeModal" class="modal-overlay" @click="dismissModal">
      <div class="modal" @click.stop>
        <div class="modal-icon" aria-hidden="true">◷</div>
        <h3>测试未完成的</h3>
        <p>
          你有一个未完成的{{ resumeMode === 'quick' ? '快速' : '完整' }}测试
          <br />（第 {{ resumePage }} 页）
        </p>
        <div class="modal-actions">
          <button class="btn-resume" @click="resumeTest">继续测试</button>
          <button class="btn-dismiss" @click="dismissModal">重新开始</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
}

/* ---- Background Blobs ---- */
.bg-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}
.blob-1 {
  width: 500px;
  height: 500px;
  background: var(--indigo-200);
  top: -150px;
  right: -100px;
  animation: blobFloat 8s ease-in-out infinite;
}
.blob-2 {
  width: 400px;
  height: 400px;
  background: var(--amber-200);
  bottom: -100px;
  left: -120px;
  animation: blobFloat 10s ease-in-out infinite reverse;
}
@keyframes blobFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.05); }
}

/* ---- Content ---- */
.content {
  position: relative;
  z-index: 1;
  max-width: 520px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-5);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ---- Eyebrow ---- */
.eyebrow {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--space-8);
}

/* ---- Hero ---- */
.hero {
  margin-bottom: var(--space-10);
}

.logo-mark {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: var(--color-primary);
}
.logo-divider {
  width: 1px;
  height: 16px;
  background: var(--color-primary);
  opacity: 0.4;
}

.title {
  font-family: var(--font-display);
  font-size: clamp(40px, 10vw, 56px);
  font-weight: 700;
  line-height: 1.15;
  color: var(--gray-900);
  margin-bottom: var(--space-4);
  letter-spacing: -0.02em;
}
.title-highlight {
  color: var(--color-primary);
  position: relative;
}
.title-highlight::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  height: 8px;
  background: var(--amber-200);
  opacity: 0.6;
  z-index: -1;
  border-radius: 2px;
}

.subtitle {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text-muted);
}

/* ---- Scene Tags ---- */
.scene-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-12);
}
.tag {
  font-size: 13px;
  padding: var(--space-2) var(--space-3);
  border-radius: 100px;
  background: var(--color-bg-soft);
  color: var(--gray-600);
  border: 1px solid var(--color-border);
  animation: tagIn 500ms var(--ease-out-quint) both;
  animation-delay: calc(var(--i, 0) * 80ms + 200ms);
}
@keyframes tagIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Mode Section ---- */
.mode-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: auto;
}

.mode-card {
  position: relative;
  padding: var(--space-6);
  border-radius: 20px;
  cursor: pointer;
  transition: transform 200ms var(--ease-out-quint),
              box-shadow 200ms var(--ease-out-quint);
  overflow: hidden;
}
.mode-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 200ms ease;
  pointer-events: none;
}
.mode-card:hover {
  transform: translateY(-3px);
}
.mode-card:hover::before {
  opacity: 1;
}

.mode-card.quick {
  background: var(--gray-0);
  border: 1.5px solid var(--color-border);
}
.mode-card.quick::before {
  background: linear-gradient(135deg, var(--indigo-50), transparent);
}
.mode-card.quick:hover {
  box-shadow: 0 8px 30px rgba(79, 70, 229, 0.1);
  border-color: var(--indigo-200);
}

.mode-card.full {
  background: var(--indigo-600);
  color: var(--color-text-inverse);
}
.mode-card.full::before {
  background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent);
}
.mode-card.full:hover {
  box-shadow: 0 12px 40px rgba(79, 70, 229, 0.3);
  transform: translateY(-3px) scale(1.01);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}
.card-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.card-time {
  font-size: 12px;
  opacity: 0.7;
}

.card-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  margin-bottom: var(--space-1);
  line-height: 1.2;
}
.card-desc {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: var(--space-3);
}

.card-features {
  display: flex;
  gap: var(--space-2);
}
.feature-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 100px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
}

.card-arrow {
  position: absolute;
  right: var(--space-6);
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  opacity: 0.3;
  transition: opacity 200ms ease, transform 200ms var(--ease-out-quint);
}
.mode-card:hover .card-arrow {
  opacity: 0.8;
  transform: translateY(-50%) translateX(4px);
}

/* ---- Footer ---- */
.footer {
  text-align: center;
  padding-top: var(--space-12);
  padding-bottom: var(--space-4);
}
.footer p {
  font-size: 12px;
  color: var(--gray-400);
  letter-spacing: 0.02em;
}

/* ---- Modal ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(19, 19, 31, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: var(--space-5);
  animation: fadeIn 200ms ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  background: var(--color-bg-elevated);
  padding: var(--space-8);
  border-radius: 24px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  box-shadow: 0 24px 80px rgba(19, 19, 31, 0.2);
  animation: modalIn 300ms var(--ease-out-expo);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.92) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-icon {
  font-size: 32px;
  color: var(--color-primary);
  margin-bottom: var(--space-3);
  opacity: 0.6;
}
.modal h3 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--space-2);
}
.modal p {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
}
.modal-actions button {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 100ms ease, opacity 150ms ease;
}
.modal-actions button:active {
  transform: scale(0.97);
}
.btn-resume {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}
.btn-resume:hover {
  background: var(--indigo-700);
}
.btn-dismiss {
  background: var(--gray-100);
  color: var(--gray-600);
}
.btn-dismiss:hover {
  background: var(--gray-200);
}

/* ---- Responsive ---- */
@media (max-width: 480px) {
  .content {
    padding: var(--space-6) var(--space-4);
  }
  .title {
    font-size: 40px;
  }
  .mode-card {
    padding: var(--space-5);
  }
  .card-title {
    font-size: 24px;
  }
  .card-arrow {
    display: none;
  }
}
</style>
