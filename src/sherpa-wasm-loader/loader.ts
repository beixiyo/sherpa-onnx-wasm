/**
 * sherpa-onnx wasm loader
 *
 * 职责：
 * - 动态加载官方生成的 `sherpa-onnx-wasm-main-asr.js`
 * - 配置 Module（locateFile / setStatus / onRuntimeInitialized）
 * - 使用 localforage 对 .wasm / .data 做 IndexedDB 缓存（可选）
 * - 返回初始化完成的 Module 对象
 *
 * 调用时机：
 * - 在应用启动时调用一次 `initWasmLoader()` 初始化 wasm 运行时
 * - 后续通过返回的 `Module` 创建识别器
 *
 * 调用流程：
 * ```
 * app-modern/index.ts
 *   └─> recognizer.ts (createStreamingRecognizer)
 *         └─> loader.ts (initWasmLoader)
 *               └─> 动态加载官方 wasm loader
 *                     └─> 返回 Module
 * ```
 */

import type { SherpaOnnxModule } from '../sherpa-onnx-asr-ts'
import type { WasmLoaderInitResult, WasmLoaderOptions } from './types'
import { patchNetwork } from './cache'

let initPromise: Promise<WasmLoaderInitResult> | null = null

/**
 * 初始化 sherpa-onnx wasm loader
 *
 * @param options 可选配置（缓存策略、脚本路径等）
 * @returns 初始化完成后的 Module 对象
 *
 * @example
 * ```ts
 * const { Module } = await initWasmLoader({
 *   cacheWasm: true,
 *   cachePrefix: 'sherpa-wasm:',
 * })
 * ```
 */
export function initWasmLoader(
  options?: WasmLoaderOptions,
): Promise<WasmLoaderInitResult> {
  if (!initPromise) {
    initPromise = doInit(options)
  }
  return initPromise
}

async function doInit(
  options?: WasmLoaderOptions,
): Promise<WasmLoaderInitResult> {
  if (typeof window === 'undefined') {
    throw new Error('initWasmLoader 仅支持在浏览器环境中调用')
  }

  patchNetwork(options)

  const Module: SherpaOnnxModule = {} as SherpaOnnxModule

  // 配置 locateFile（主要用于确定 wasm/data 的 URL）
  Module.locateFile = (path: string, scriptDirectory = '') => {
    // 这里只做路径拼接，实际的缓存逻辑在 patchNetwork 中拦截
    return scriptDirectory + path
  }

  // 复用原来 app-asr.js 里的 setStatus 逻辑，做成更安全的实现
  Module.setStatus = (status: string) => {
    if (typeof document === 'undefined') return

    const statusElement = document.getElementById('status')
    if (!statusElement) return

    let text = status
    if (text === 'Running...') {
      text = 'Model downloaded. Initializing recongizer...'
    }

    const downloadMatch = text.match(/Downloading data... \((\d+)\/(\d+)\)/)
    if (downloadMatch) {
      const downloaded = BigInt(downloadMatch[1])
      const total = BigInt(downloadMatch[2])
      const percent =
        total === 0n ? 0 : Number((downloaded * 10000n) / total) / 100
      text = `Downloading data... ${percent.toFixed(2)}% (${downloadMatch[1]}/${downloadMatch[2]})`
    }

    statusElement.textContent = text

    const tabContents = document.querySelectorAll('.tab-content')
    if (text === '') {
      (statusElement as HTMLElement).style.display = 'none'
      tabContents.forEach((el) => el.classList.remove('loading'))
    } else {
      (statusElement as HTMLElement).style.display = 'block'
      tabContents.forEach((el) => el.classList.add('loading'))
    }
  }

  // 为兼容官方生成的 sherpa-onnx-wasm-main-asr.js，把 Module 暂时挂到 window 上
  window.Module = Module

  // 动态加载 wasm loader（等价于 <script src="sherpa-onnx-wasm-main-asr.js">）
  const scriptUrl = options && options.wasmScriptUrl
    ? options.wasmScriptUrl
    : 'sherpa-onnx-wasm-main-asr.js'
  await loadScript(scriptUrl)

  await new Promise<void>((resolve) => {
    Module.onRuntimeInitialized = () => {
      resolve()
    }
  })

  return {
    Module,
  }
}


function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('loadScript 仅支持在浏览器环境中调用'))
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
}

