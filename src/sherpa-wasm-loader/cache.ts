/**
 * wasm 文件缓存逻辑
 *
 * 职责：
 * - 对 .wasm / .data 文件进行 IndexedDB 缓存
 * - 通过 patch fetch 和 XMLHttpRequest 实现透明缓存
 * - 提供缓存读取和写入的底层接口
 */

import localforage from 'localforage'
import type { WasmLoaderOptions } from './types'

/**
 * 判断 URL 是否需要缓存
 */
export function shouldCache(url: string): boolean {
  return url.endsWith('.wasm') || url.endsWith('.data')
}

/**
 * 获取缓存的 key
 */
export function getCacheKey(url: string, cachePrefix: string): string {
  return `${cachePrefix}${url}`
}

/**
 * 获取文件的 MIME 类型
 */
export function getMimeType(url: string): string {
  return url.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream'
}

/**
 * 从缓存读取文件
 */
export async function getCachedFile(key: string): Promise<ArrayBuffer | null> {
  try {
    return await localforage.getItem<ArrayBuffer>(key)
  } catch {
    return null
  }
}

/**
 * 将文件写入缓存
 */
export async function setCachedFile(key: string, data: ArrayBuffer): Promise<void> {
  try {
    await localforage.setItem(key, data)
  } catch {
    // 写缓存失败不影响主流程
  }
}

let networkPatched = false

/**
 * 对 fetch 和 XMLHttpRequest 进行补丁，
 * 对 .wasm / .data 请求做 IndexedDB 缓存，其他请求透明转发。
 */
export function patchNetwork(options?: WasmLoaderOptions): void {
  if (networkPatched || typeof window === 'undefined') {
    return
  }

  const enableCache = options?.cacheWasm ?? true
  const cachePrefix = options?.cachePrefix ?? 'sherpa-wasm:'

  // 配置 localforage（提前配置，确保后续可以使用）
  localforage.config({
    name: 'sherpa-onnx-cache',
    storeName: 'wasm-files',
  })

  // Patch fetch
  if (window.fetch) {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

      if (!shouldCache(url) || !enableCache) {
        return originalFetch(input, init)
      }

      const key = getCacheKey(url, cachePrefix)

      // 尝试从缓存读取
      const cached = await getCachedFile(key)
      if (cached) {
        const mimeType = getMimeType(url)
        const blob = new Blob([cached], { type: mimeType })
        return new Response(blob, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
          },
        })
      }

      // 缓存未命中，正常请求
      const resp = await originalFetch(input, init)

      // 确保响应具有正确的 MIME 类型（如果服务器没有设置）
      let finalResp = resp
      if (url.endsWith('.wasm')) {
        const contentType = resp.headers.get('Content-Type')
        if (!contentType || !contentType.includes('application/wasm')) {
          // 如果响应没有正确的 MIME 类型，创建一个新的响应
          const respClone = resp.clone()
          const buf = await resp.arrayBuffer()
          finalResp = new Response(buf, {
            status: resp.status,
            statusText: resp.statusText,
            headers: {
              ...Object.fromEntries(resp.headers.entries()),
              'Content-Type': 'application/wasm',
            },
          })

          // 使用克隆的响应进行缓存
          const cacheBuf = await respClone.arrayBuffer()
          await setCachedFile(key, cacheBuf)
          return finalResp
        }
      }

      // 如果 MIME 类型正确，正常进行缓存
      const buf = await resp.clone().arrayBuffer()
      await setCachedFile(key, buf)

      return finalResp
    }
  }

  // Patch XMLHttpRequest
  if (window.XMLHttpRequest) {
    const OriginalXHR = window.XMLHttpRequest

    window.XMLHttpRequest = class PatchedXHR extends OriginalXHR {
      private _url: string | null = null
      private _responseType: XMLHttpRequestResponseType = ''

      open(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
        this._url = typeof url === 'string' ? url : url.toString()
        return super.open(method, this._url, async ?? true, username ?? null, password ?? null)
      }

      set responseType(value: XMLHttpRequestResponseType) {
        this._responseType = value
        super.responseType = value
      }

      get responseType(): XMLHttpRequestResponseType {
        return super.responseType
      }

      send(body?: Document | XMLHttpRequestBodyInit | null): void {
        const url = this._url
        if (!url || !shouldCache(url) || !enableCache) {
          return super.send(body)
        }

        const key = getCacheKey(url, cachePrefix)
        const responseType = this._responseType || 'arraybuffer'

        // 异步检查缓存
        getCachedFile(key).then((cached) => {
          if (cached) {
            // 有缓存，直接设置响应
            if (responseType === 'arraybuffer') {
              Object.defineProperty(this, 'response', {
                value: cached,
                writable: false,
                configurable: true,
              })
              Object.defineProperty(this, 'responseText', {
                value: '',
                writable: false,
                configurable: true,
              })
            } else if (responseType === 'blob') {
              const mimeType = getMimeType(url)
              const blob = new Blob([cached], { type: mimeType })
              Object.defineProperty(this, 'response', {
                value: blob,
                writable: false,
                configurable: true,
              })
            }

            Object.defineProperty(this, 'status', {
              value: 200,
              writable: false,
              configurable: true,
            })
            Object.defineProperty(this, 'statusText', {
              value: 'OK',
              writable: false,
              configurable: true,
            })
            // 按顺序触发状态变化事件（模拟真实的 XHR 行为）
            // readyState: 0 -> 1 (OPENED)
            Object.defineProperty(this, 'readyState', {
              value: 1,
              writable: false,
              configurable: true,
            })
            if (this.onreadystatechange) {
              this.onreadystatechange(new Event('readystatechange'))
            }

            // readyState: 1 -> 2 (HEADERS_RECEIVED)
            Object.defineProperty(this, 'readyState', {
              value: 2,
              writable: false,
              configurable: true,
            })
            if (this.onreadystatechange) {
              this.onreadystatechange(new Event('readystatechange'))
            }

            // readyState: 2 -> 3 (LOADING)
            Object.defineProperty(this, 'readyState', {
              value: 3,
              writable: false,
              configurable: true,
            })
            if (this.onreadystatechange) {
              this.onreadystatechange(new Event('readystatechange'))
            }

            // readyState: 3 -> 4 (DONE)
            Object.defineProperty(this, 'readyState', {
              value: 4,
              writable: false,
              configurable: true,
            })
            if (this.onreadystatechange) {
              this.onreadystatechange(new Event('readystatechange'))
            }

            // 触发 load 事件
            if (this.onload) {
              const loadEvent = new ProgressEvent('load', {
                lengthComputable: true,
                loaded: cached.byteLength,
                total: cached.byteLength,
              })
              this.onload(loadEvent)
            }
            return
          }

          // 没有缓存，正常发送请求
          // 拦截响应进行缓存
          const originalOnLoad = this.onload
          const originalOnReadyStateChange = this.onreadystatechange

          this.onload = (event: ProgressEvent) => {
            if (this.status === 200 || this.status === 304 || this.status === 206 || (this.status === 0 && this.response)) {
              // 缓存响应数据
              if (responseType === 'arraybuffer' && this.response instanceof ArrayBuffer) {
                setCachedFile(key, this.response)
              } else if (responseType === 'blob' && this.response instanceof Blob) {
                this.response.arrayBuffer().then((buf) => setCachedFile(key, buf))
              } else if (!responseType && this.response instanceof ArrayBuffer) {
                setCachedFile(key, this.response)
              }
            }

            if (originalOnLoad) {
              originalOnLoad.call(this, event)
            }
          }

          this.onreadystatechange = (event: Event) => {
            if (this.readyState === 4 && this.status === 200) {
              // 缓存响应数据
              if (responseType === 'arraybuffer' && this.response instanceof ArrayBuffer) {
                setCachedFile(key, this.response)
              } else if (responseType === 'blob' && this.response instanceof Blob) {
                this.response.arrayBuffer().then((buf) => setCachedFile(key, buf))
              } else if (!responseType && this.response instanceof ArrayBuffer) {
                setCachedFile(key, this.response)
              }
            }

            if (originalOnReadyStateChange) {
              originalOnReadyStateChange.call(this, event)
            }
          }

          super.send(body)
        }).catch(() => {
          // 缓存读取失败，正常发送请求
          super.send(body)
        })
      }
    } as typeof XMLHttpRequest
  }

  networkPatched = true
}

