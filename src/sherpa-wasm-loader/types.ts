/**
 * wasm loader 相关的类型定义
 */

import type { SherpaOnnxModule } from '../sherpa-onnx-asr-ts'

/**
 * wasm loader 初始化选项
 */
export type WasmLoaderOptions = {
  /**
   * 是否对 .wasm / .data 进行 IndexedDB 缓存
   * @default true
   */
  cacheWasm?: boolean
  /**
   * 缓存前缀，便于区分不同模型 / 版本
   * @default 'sherpa-wasm:'
   */
  cachePrefix?: string
  /**
   * wasm loader 脚本的相对路径
   * 通常是官方生成的 `sherpa-onnx-wasm-main-asr.js`
   * @default 'sherpa-onnx-wasm-main-asr.js'
   */
  wasmScriptUrl?: string
}

/**
 * wasm loader 初始化结果
 */
export type WasmLoaderInitResult = {
  /**
   * wasm 对应的 Emscripten Module 对象
   */
  Module: SherpaOnnxModule
}

/**
 * 扩展 Window 接口，添加 Module 属性（用于兼容官方 wasm loader）
 */
declare global {
  interface Window {
    Module?: SherpaOnnxModule
  }
}

