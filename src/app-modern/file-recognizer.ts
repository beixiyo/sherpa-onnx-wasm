import { initWasmLoader } from '../sherpa-wasm-loader'
import type { WasmLoaderOptions } from '../sherpa-wasm-loader'
import {
  createOnlineRecognizer,
  OnlineRecognizer,
  type OnlineRecognizerConfig,
  type RecognitionResult,
} from '../sherpa-onnx-asr-ts'

/**
 * 文件识别器创建选项
 */
export type FileRecognizerOptions = {
  /**
   * wasm loader 相关配置（是否缓存、缓存前缀、脚本路径等）
   */
  loader?: WasmLoaderOptions
  /**
   * OnlineRecognizer 配置
   * 不传则使用默认配置
   */
  config?: OnlineRecognizerConfig
}

export type FileRecognizer = {
  recognizer: OnlineRecognizer
  /**
   * 识别音频数据
   * @param samples 音频采样数据（Float32Array，范围 [-1, 1]）
   * @param sampleRate 采样率
   * @returns 识别结果文本
   */
  recognizeSamples: (samples: Float32Array, sampleRate: number) => string
  /**
   * 释放资源
   */
  free: () => void
}

/**
 * 创建一个文件识别器
 * 注意：由于当前 WASM 只支持在线识别，我们使用 OnlineRecognizer 来处理完整音频文件
 */
export async function createFileRecognizer(
  options?: FileRecognizerOptions,
): Promise<FileRecognizer> {
  const { Module } = await initWasmLoader(options?.loader)

  // 检查 Module 是否包含在线识别函数
  if (typeof Module._SherpaOnnxCreateOnlineRecognizer !== 'function') {
    throw new Error(
      'WASM Module 不包含在线识别功能。请确认 WASM 文件是否正确加载。',
    )
  }

  const recognizer = options?.config
    ? createOnlineRecognizer(Module, options.config)
    : createOnlineRecognizer(Module)

  const recognizeSamples = (
    samples: Float32Array,
    sampleRate: number,
  ): string => {
    const stream = recognizer.createStream()

    try {
      // 将完整音频数据分块输入（每次最多 4096 个样本，避免内存问题）
      const chunkSize = 4096
      let offset = 0

      while (offset < samples.length) {
        const chunk = samples.slice(offset, offset + chunkSize)
        stream.acceptWaveform(sampleRate, chunk)

        // 解码可用的数据
        while (recognizer.isReady(stream)) {
          recognizer.decode(stream)
        }

        offset += chunkSize
      }

      // 标记输入完成
      stream.inputFinished()

      // 继续解码直到没有更多数据
      while (recognizer.isReady(stream)) {
        recognizer.decode(stream)
      }

      // 对于 paraformer 模型，可能需要尾部填充
      if (
        recognizer.config.modelConfig.paraformer &&
        recognizer.config.modelConfig.paraformer.encoder !== ''
      ) {
        const tailPaddings = new Float32Array(sampleRate)
        stream.acceptWaveform(sampleRate, tailPaddings)
        stream.inputFinished()
        while (recognizer.isReady(stream)) {
          recognizer.decode(stream)
        }
      }

      // 获取最终结果
      const result: RecognitionResult = recognizer.getResult(stream)
      return result.text || ''
    } finally {
      stream.free()
    }
  }

  const free = () => {
    recognizer.free()
  }

  return {
    recognizer,
    recognizeSamples,
    free,
  }
}

