/**
 * 访问计数工具
 * 使用 CounterAPI v2 (counterapi.dev)
 * 文档: https://docs.counterapi.dev/api/endpoints/v2/
 *
 * 注意：V2 认证需要 Authorization header，但浏览器 CORS 预检会拦截自定义 header。
 * 解决方案：将 API Key 作为 URL query parameter 传递（public counter 方式）。
 */

const API_KEY = 'ut_uicD6k967pl6DzEbfCUMrmCUEdWmLEDFZANEAa0u'
const BASE_URL = 'https://api.counterapi.dev/v2'
const WORKSPACE = '4321'

// 错误日志（用于前端排查）
let lastError: { endpoint: string; status: number; statusText: string; body: string } | null = null

export function getLastCounterError() {
  return lastError
}

function buildUrl(path: string): string {
  // 将 API key 作为 query param 传递，避免 CORS preflight 拦截 Authorization header
  const sep = path.includes('?') ? '&' : '?'
  return `${BASE_URL}${path}${sep}api_key=${encodeURIComponent(API_KEY)}`
}

async function up(name: string): Promise<number> {
  const endpoint = buildUrl(`/${WORKSPACE}/${name}/up`)
  try {
    const res = await fetch(endpoint, { method: 'GET' })
    if (!res.ok) {
      const body = await res.text()
      lastError = { endpoint, status: res.status, statusText: res.statusText, body }
      console.error('[CounterAPI] up failed:', lastError)
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    const data = await res.json()
    // v2 返回结构: { count: number }
    const count = typeof data.count === 'number' ? data.count : 0
    lastError = null
    return count
  } catch (e) {
    console.error('[CounterAPI] up exception:', e)
    return 0
  }
}

async function get(name: string): Promise<number> {
  const endpoint = buildUrl(`/${WORKSPACE}/${name}`)
  try {
    const res = await fetch(endpoint, { method: 'GET' })
    if (!res.ok) {
      const body = await res.text()
      lastError = { endpoint, status: res.status, statusText: res.statusText, body }
      console.error('[CounterAPI] get failed:', lastError)
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    const data = await res.json()
    const count = typeof data.count === 'number' ? data.count : 0
    lastError = null
    return count
  } catch (e) {
    console.error('[CounterAPI] get exception:', e)
    return 0
  }
}

export const counter = {
  /** 增加并获取访问计数 */
  async hitVisit(): Promise<number> {
    return up('visits')
  },

  /** 增加并获取完成测试计数 */
  async hitComplete(): Promise<number> {
    return up('completes')
  },

  /** 增加并获取特定人格类型计数 */
  async hitType(typeCode: string): Promise<number> {
    return up(`type_${typeCode}`)
  },

  /** 仅获取访问计数（不增加） */
  async getVisits(): Promise<number> {
    return get('visits')
  },
}
