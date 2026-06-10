<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
/* ============================================================
   NF-BTI Design System — Based on Impeccable Principles
   ============================================================ */

/* ---- Color Tokens (OKLCH-inspired, manually tuned) ---- */
:root {
  /* Primary: Deep Indigo — 校园气质，沉稳但有态度 */
  --indigo-50:  #eef2ff;
  --indigo-100: #e0e7ff;
  --indigo-200: #c7d2fe;
  --indigo-300: #a5b4fc;
  --indigo-400: #818cf8;
  --indigo-500: #6366f1;
  --indigo-600: #4f46e5;
  --indigo-700: #4338ca;
  --indigo-800: #3730a3;
  --indigo-900: #312e81;
  --indigo-950: #1e1b4b;

  /* Accent: Amber Gold — 温暖、青春、隐藏款的荣耀 */
  --amber-50:  #fffbeb;
  --amber-100: #fef3c7;
  --amber-200: #fde68a;
  --amber-300: #fcd34d;
  --amber-400: #fbbf24;
  --amber-500: #f59e0b;
  --amber-600: #d97706;
  --amber-700: #b45309;

  /* Rose: 活力、情感、人格色彩 */
  --rose-50:  #fff1f2;
  --rose-100: #ffe4e6;
  --rose-300: #fda4af;
  --rose-400: #fb7185;
  --rose-500: #f43f5e;
  --rose-600: #e11d48;

  /* Neutral: 带靛蓝色调的灰，不死板 */
  --gray-0:   #ffffff;
  --gray-50:  #f8f8fb;
  --gray-100: #f0f0f5;
  --gray-200: #e4e4ec;
  --gray-300: #c8c8d4;
  --gray-400: #9696a8;
  --gray-500: #6e6e80;
  --gray-600: #50505f;
  --gray-700: #3a3a48;
  --gray-800: #252532;
  --gray-900: #13131f;

  /* Semantic */
  --color-bg:           var(--gray-0);
  --color-bg-soft:      var(--gray-50);
  --color-bg-elevated:  var(--gray-0);
  --color-text:         var(--gray-800);
  --color-text-muted:   var(--gray-500);
  --color-text-inverse: var(--gray-0);
  --color-primary:      var(--indigo-600);
  --color-primary-soft: var(--indigo-100);
  --color-accent:       var(--amber-500);
  --color-accent-soft:  var(--amber-100);
  --color-rose:         var(--rose-500);
  --color-rose-soft:    var(--rose-100);
  --color-border:       var(--gray-200);

  /* Spacing: 4pt base scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Typography */
  --font-display: 'LXGW WenKai', 'PingFang SC', 'Microsoft YaHei', serif;
  --font-body:    'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  /* Motion */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
}

/* ---- Global Reset ---- */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ---- Page Transitions ---- */
.page-enter-active {
  transition: opacity 400ms var(--ease-out-expo),
              transform 400ms var(--ease-out-expo);
}
.page-leave-active {
  transition: opacity 250ms ease-in,
              transform 250ms ease-in;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ---- Reduced Motion ---- */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ---- Selection ---- */
::selection {
  background: var(--indigo-200);
  color: var(--indigo-900);
}
</style>
