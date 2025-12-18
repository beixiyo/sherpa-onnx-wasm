import { initWasmLoader } from '../sherpa-wasm-loader'
import type { WasmLoaderOptions } from '../sherpa-wasm-loader'
import {
  createOnlineRecognizer,
  OnlineRecognizer,
  OnlineStream,
  type OnlineRecognizerConfig,
  type RecognitionResult,
} from '../sherpa-onnx-asr-ts'

/**
 * 流式识别器创建选项
 */
export type StreamingRecognizerOptions = {
  /**
   * wasm loader 相关配置（是否缓存、缓存前缀、脚本路径等）
   */
  loader?: WasmLoaderOptions
  /**
   * OnlineRecognizer 配置
   * 不传则使用默认配置（同原始 js 逻辑）
   */
  config?: OnlineRecognizerConfig
}

export type StreamingRecognizerUpdate = {
  /**
   * 当前未结束的增量识别结果
   */
  partialText: string
  /**
   * 已经确认结束的完整句子列表
   */
  finalTexts: string[]
}

export type StreamingRecognizer = {
  recognizer: OnlineRecognizer
  getOrCreateStream: () => OnlineStream
  /**
   * 推入一段音频数据，返回最新的识别文本
   */
  pushSamples: (
    samples: Float32Array,
    sampleRate: number,
  ) => StreamingRecognizerUpdate
  /**
   * 重置内部状态和结果缓存
   */
  reset: () => void
}

/**
 * 创建一个高层的流式识别控制器
 * - 内部管理 OnlineStream 生命周期
 * - 封装 endpoint 逻辑，返回增量 / 最终结果
 */
export async function createStreamingRecognizer(
  options?: StreamingRecognizerOptions,
): Promise<StreamingRecognizer> {
  const { Module } = await initWasmLoader(options?.loader)

  const recognizer = options?.config
    ? createOnlineRecognizer(Module, options.config)
    : createOnlineRecognizer(Module)

  let stream: OnlineStream | null = null
  let lastResult = ''
  const resultList: string[] = []

  const getOrCreateStream = () => {
    if (!stream) {
      stream = recognizer.createStream()
    }
    return stream
  }

  const pushSamples = (
    samples: Float32Array,
    sampleRate: number,
  ): StreamingRecognizerUpdate => {
    const currentStream = getOrCreateStream()
    currentStream.acceptWaveform(sampleRate, samples)

    while (recognizer.isReady(currentStream)) {
      recognizer.decode(currentStream)
    }

    let isEndpoint = recognizer.isEndpoint(currentStream)
    let result: RecognitionResult = recognizer.getResult(currentStream)
    let text = result.text

    // paraformer 需要尾部填充一次再取结果
    if (recognizer.config.modelConfig.paraformer?.encoder) {
      const tailPaddings = new Float32Array(sampleRate)
      currentStream.acceptWaveform(sampleRate, tailPaddings)
      while (recognizer.isReady(currentStream)) {
        recognizer.decode(currentStream)
      }
      result = recognizer.getResult(currentStream)
      text = result.text
    }

    if (text.length > 0 && lastResult !== text) {
      lastResult = text
    }

    if (isEndpoint) {
      if (lastResult.length > 0) {
        resultList.push(lastResult)
        lastResult = ''
      }
      recognizer.reset(currentStream)
    }

    return {
      partialText: lastResult,
      finalTexts: [...resultList],
    }
  }

  const reset = () => {
    if (stream) {
      recognizer.reset(stream)
    }
    lastResult = ''
    resultList.splice(0, resultList.length)
  }

  return {
    recognizer,
    getOrCreateStream,
    pushSamples,
    reset,
  }
}


