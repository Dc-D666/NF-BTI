<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTestStore } from '@/stores/testStore'
import { counter } from '@/utils/counter'
import { ref, onMounted } from 'vue'
import qqQrImg from '@/assets/QQ.jpg'
import wxQrImg from '@/assets/WX.jpg'

const router = useRouter()
const store = useTestStore()
const showResumeModal = ref(false)
const resumeMode = ref<'quick' | 'full' | 'debug' | null>(null)
const resumePage = ref(1)
const showContributors = ref(false)
const showChangelog = ref(false)



// Debug 模式状态
const debugEnabled = ref(false)
const clickCount = ref(0)
let clickTimer: ReturnType<typeof setTimeout> | null = null

// 访问计数
const visitCount = ref(0)

onMounted(() => {
  const unfinished = store.hasUnfinishedProgress()
  if (unfinished) {
    resumeMode.value = unfinished.mode
    resumePage.value = unfinished.currentPage
    showResumeModal.value = true
  }
  // 增加访问计数（ruseo.cn Counter API）
  counter.hitVisit().then((n) => {
    visitCount.value = n
  })
})

function startTest(mode: 'quick' | 'full' | 'debug') {
  store.setMode(mode)
  router.push(`/test/${mode}/1`)
}

function handleLogoClick() {
  clickCount.value++
  if (clickTimer) clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    clickCount.value = 0
  }, 2000)
  if (clickCount.value >= 5) {
    debugEnabled.value = true
    clickCount.value = 0
  }
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
      <div class="top-bar">
        <div class="eyebrow">南方中学 · 人格测试</div>
        <button class="changelog-btn" @click="showChangelog = true">近期更新</button>
      </div>

      <!-- Logo 区域 -->
      <div class="hero" @click="handleLogoClick">
        <div class="logo-mark" aria-hidden="true">
          <span class="logo-text">NFTI</span>
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

        <div class="mode-card full" @click="startTest(debugEnabled ? 'debug' : 'full')">
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
          <div v-if="debugEnabled" class="debug-badge">DEBUG</div>
          <div class="card-arrow" aria-hidden="true">→</div>
        </div>
      </div>

      <!-- Debug 开关（触发后显示） -->
      <div v-if="debugEnabled" class="debug-panel">
        <label class="debug-toggle">
          <input type="checkbox" v-model="debugEnabled" />
          <span>Debug 模式已激活 — 点击上方卡片自动答题</span>
        </label>
      </div>

      <!-- 扫码加入社区 -->
      <div class="community-section">
        <p class="community-text">测完别急着走，扫码回「家」聊聊你的人格</p>
        <div class="qr-grid">
          <div class="qr-item">
            <div class="qr-frame">
              <img :src="qqQrImg" alt="QQ频道二维码" class="qr-image" />
            </div>
            <span class="qr-label">QQ 扫码</span>
          </div>
          <div class="qr-item">
            <div class="qr-frame">
              <img :src="wxQrImg" alt="微信群二维码" class="qr-image" />
            </div>
            <span class="qr-label">微信扫码</span>
          </div>
        </div>
      </div>

      <!-- 底部信息栏 -->
      <footer class="footer-bar">
        <span class="footer-version">v2.0-beta</span>
        <span class="footer-divider">·</span>
        <button class="footer-link" @click="showContributors = true">贡献者</button>
        <span class="footer-divider">·</span>
        <button class="footer-link" @click="router.push('/feedback')">
          <span aria-hidden="true">✎</span> 反馈
        </button>
        <span class="footer-divider">·</span>
        <span class="footer-copyright">© 2026 NFTI · 南方人专属</span>
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

    <!-- 更新日志弹窗 -->
    <div v-if="showChangelog" class="modal-overlay" @click="showChangelog = false">
      <div class="modal changelog-modal" @click.stop>
        <h3>更新日志</h3>
        <div class="changelog-list">
          <div class="changelog-item">
            <div class="changelog-version">
              <span class="version-tag">v2.0-beta</span>
              <span class="version-date">当前版本</span>
            </div>
            <ul>
              <li>开放分享功能</li>
              <li>优化人格插图</li>
            </ul>
          </div>
          <div class="changelog-item">
            <div class="changelog-version">
              <span class="version-tag">v1.3-alpha</span>
            </div>
            <ul>
              <li>引入AI学长问答功能，基于人格类型提供个性化建议</li>
              <li>支持流式输出</li>
            </ul>
          </div>
          <div class="changelog-item">
            <div class="changelog-version">
              <span class="version-tag">v1.2-alpha</span>
            </div>
            <ul>
              <li>完成 16 种标准人格的插图设计与展示</li>
              <li>新增人格关系分析</li>
              <li>结果页全新布局</li>
            </ul>
          </div>
          <div class="changelog-item">
            <div class="changelog-version">
              <span class="version-tag">v1.1-alpha</span>
            </div>
            <ul>
              <li>完成 19 种人格数据全面重构</li>
              <li>新增反馈入口</li>
              <li>优化结果页分数计算与维度解析展示</li>
            </ul>
          </div>
          <div class="changelog-item">
            <div class="changelog-version">
              <span class="version-tag">v1.0-alpha</span>
            </div>
            <ul>
              <li>完成测试题目与人格设计</li>
              <li>基于南方中学真实校园场景构建八维字母体系</li>
            </ul>
          </div>
        </div>
        <div class="changelog-footer">
          <button class="btn-dismiss" @click="showChangelog = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 贡献者名单弹窗 -->
    <div v-if="showContributors" class="modal-overlay" @click="showContributors = false">
      <div class="modal contributors-modal" @click.stop>
        <h3>贡献者名单</h3>
        <div class="contributors-list">
          <div class="contributor-row">
            <span class="contributor-role">策划</span>
            <span class="contributor-names">2118 言语薇</span>
          </div>
          <div class="contributor-row">
            <span class="contributor-role">开发</span>
            <span class="contributor-names">2120 戴睿羲 · Kimi-K2.6 · DeepSeek-v4-flash</span>
          </div>
          <div class="contributor-row">
            <span class="contributor-role">设计</span>
            <span class="contributor-names">2120 戴睿羲 · Gemini-3.5-Flash · Doubao-Seedream-4.5 · Qwen-Image-1.0</span>
          </div>
          <div class="contributor-row">
            <span class="contributor-role">内测志愿者</span>
            <span class="contributor-names">2117 HJP、2118 YYW、2119 JHT、2119 MYM、2120 YRX、2120 QYH、2317 DZH、2318 LJJ、2520 TYF</span>
          </div>
          <div class="contributor-row">
            <span class="contributor-role">数据来源</span>
            <span class="contributor-names">
              <a href="https://pd.qq.com/g/nanfang1958" target="_blank" rel="noopener noreferrer">腾讯频道</a>
            </span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-dismiss" @click="showContributors = false">关闭</button>
        </div>
        <div class="repo-link">
          <a href="https://github.com/Dc-D666/NF-BTI" target="_blank" rel="noopener noreferrer">
            开源项目地址 ↗
          </a>
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

/* ---- Top Bar ---- */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-8);
}
.eyebrow {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.changelog-btn {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--indigo-50);
  border: 1px solid var(--indigo-100);
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
}
.changelog-btn:hover {
  background: var(--indigo-100);
}
.changelog-btn:active {
  transform: scale(0.96);
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

/* ---- Footer Bar ---- */
.footer-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) 0 var(--space-4);
  flex-wrap: wrap;
}
.footer-version,
.footer-copyright,
.footer-divider,
.footer-counter {
  font-size: 11px;
  color: var(--gray-400);
}
.footer-link {
  font-size: 11px;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 150ms ease;
}
.footer-link:hover {
  opacity: 0.7;
}

/* ---- Community Section ---- */
.community-section {
  margin-top: var(--space-8);
  margin-bottom: var(--space-4);
  text-align: center;
}
.community-text {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--gray-500);
  margin-bottom: var(--space-4);
}
.qr-grid {
  display: flex;
  justify-content: center;
  gap: var(--space-5);
}
.qr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}
.qr-frame {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  background: var(--gray-0);
  border: 1.5px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  padding: var(--space-2);
  transition: transform 200ms var(--ease-out-quint), box-shadow 200ms ease;
}
.qr-frame:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.qr-image {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: contain;
}
.qr-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-400);
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

/* ---- Changelog Modal ---- */
.changelog-modal {
  max-width: 440px;
  max-height: 70vh;
  text-align: left;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}
.changelog-modal h3 {
  text-align: center;
  margin-bottom: 0;
  padding: var(--space-6) var(--space-6) var(--space-4);
  flex-shrink: 0;
}
.changelog-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: 0 var(--space-6);
  overflow-y: auto;
  flex: 1;
}
.changelog-footer {
  padding: var(--space-4) var(--space-6) var(--space-6);
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
}
.changelog-footer .btn-dismiss {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--gray-100);
  color: var(--gray-600);
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
}
.changelog-footer .btn-dismiss:hover {
  background: var(--gray-200);
}
.changelog-item {
  padding: var(--space-4);
  background: var(--gray-50);
  border-radius: 16px;
}
.changelog-version {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.version-tag {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--indigo-50);
  padding: 2px 8px;
  border-radius: 6px;
}
.version-date {
  font-size: 11px;
  color: var(--gray-400);
}
.changelog-item ul {
  margin: 0;
  padding-left: var(--space-5);
  list-style-type: disc;
}
.changelog-item li {
  font-size: 13px;
  color: var(--gray-600);
  line-height: 1.7;
  margin-bottom: var(--space-1);
}
.changelog-item li::marker {
  color: var(--indigo-300);
}

/* ---- Contributors Modal ---- */
.contributors-modal {
  max-width: 420px;
}
.contributors-list {
  text-align: left;
  margin: var(--space-4) 0 var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.contributor-row {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}
.contributor-role {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  width: 70px;
  flex-shrink: 0;
  text-align: right;
}
.contributor-names {
  font-size: 13px;
  color: var(--gray-600);
  line-height: 1.5;
  flex: 1;
}
.contributor-names a {
  color: var(--color-primary);
  text-decoration: none;
}
.contributor-names a:hover {
  text-decoration: underline;
}
.repo-link {
  margin-top: var(--space-4);
  text-align: center;
}
.repo-link a {
  font-size: 12px;
  color: var(--gray-400);
  text-decoration: none;
  transition: color 150ms ease;
}
.repo-link a:hover {
  color: var(--color-primary);
}

/* ---- Debug Mode ---- */
.debug-badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  background: var(--rose-500);
  color: var(--gray-0);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
  letter-spacing: 0.04em;
  animation: badgePulse 1.5s ease-in-out infinite;
}

.debug-panel {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--rose-50);
  border: 1.5px solid var(--rose-200);
  border-radius: 12px;
}
.debug-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  color: var(--rose-700);
  cursor: pointer;
}
.debug-toggle input {
  accent-color: var(--rose-500);
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
