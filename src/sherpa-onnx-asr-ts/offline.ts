import type {
  OfflineModelConfig,
  OfflineRecognizerConfig,
  RecognitionResult,
  SherpaOnnxModule,
} from './types'
import {
  freeConfig,
  initSherpaOnnxOfflineRecognizerConfig,
} from './config'

export class OfflineStream {
  handle: number
  Module: SherpaOnnxModule

  constructor(handle: number, Module: SherpaOnnxModule) {
    this.handle = handle
    this.Module = Module
  }

  free() {
    if (this.handle) {
      this.Module._SherpaOnnxDestroyOfflineStream(this.handle)
      this.handle = 0
    }
  }

  /**
   * 接收离线音频数据
   * @param sampleRate 采样率
   * @param samples [-1, 1] 的 Float32Array
   */
  acceptWaveform(sampleRate: number, samples: Float32Array) {
    const pointer =
      this.Module._malloc(samples.length * samples.BYTES_PER_ELEMENT)
    this.Module.HEAPF32.set(
      samples,
      pointer / samples.BYTES_PER_ELEMENT,
    )
    this.Module._SherpaOnnxAcceptWaveformOffline(
      this.handle,
      sampleRate,
      pointer,
      samples.length,
    )
    this.Module._free(pointer)
  }
}

export class OfflineRecognizer {
  config: OfflineRecognizerConfig
  handle: number
  Module: SherpaOnnxModule

  constructor(configObj: OfflineRecognizerConfig, Module: SherpaOnnxModule) {
    this.config = configObj
    const config = initSherpaOnnxOfflineRecognizerConfig(configObj, Module)
    const handle =
      Module._SherpaOnnxCreateOfflineRecognizer(config.ptr)
    freeConfig(config, Module)

    this.handle = handle
    this.Module = Module
  }

  setConfig(configObj: OfflineRecognizerConfig) {
    const config = initSherpaOnnxOfflineRecognizerConfig(
      configObj,
      this.Module,
    )
    this.Module._SherpaOnnxOfflineRecognizerSetConfig(
      this.handle,
      config.ptr,
    )
    freeConfig(config, this.Module)
    this.config = configObj
  }

  free() {
    this.Module._SherpaOnnxDestroyOfflineRecognizer(this.handle)
    this.handle = 0
  }

  createStream() {
    const handle = this.Module._SherpaOnnxCreateOfflineStream(this.handle)
    return new OfflineStream(handle, this.Module)
  }

  decode(stream: OfflineStream) {
    this.Module._SherpaOnnxDecodeOfflineStream(
      this.handle,
      stream.handle,
    )
  }

  getResult(stream: OfflineStream): RecognitionResult {
    const r =
      this.Module._SherpaOnnxGetOfflineStreamResultAsJson(stream.handle)
    const jsonStr = this.Module.UTF8ToString(r)
    const ans = JSON.parse(jsonStr) as RecognitionResult
    this.Module._SherpaOnnxDestroyOfflineStreamResultJson(r)

    return ans
  }
}

/**
 * 创建离线识别器
 *
 * 配置来源说明：
 * 1. 默认配置：参考原始 JS 文件 `sherpa-onnx-asr.js` 中 `createOnlineRecognizer` 的实现
 * 2. 模型文件路径：指向 WASM 虚拟文件系统（MEMFS）中的文件
 *    - 这些文件来自 `sherpa-onnx-wasm-main-asr.data` 文件
 *    - `.data` 文件在加载时会被解压到虚拟文件系统
 *    - 路径如 `./encoder.onnx` 是相对于虚拟文件系统根目录的路径
 * 3. 配置优先级：如果传入 `myConfig` 参数，则使用传入的配置，否则使用默认配置
 *
 * @param Module WASM Module 对象
 * @param myConfig 可选的离线识别器配置，如果提供则完全覆盖默认配置
 * @returns OfflineRecognizer 实例
 */
export function createOfflineRecognizer(
  Module: SherpaOnnxModule,
  myConfig?: OfflineRecognizerConfig,
): OfflineRecognizer {
  // 初始化各种模型类型的配置对象（默认都为空字符串）
  const offlineTransducerModelConfig: OfflineModelConfig['transducer'] = {
    encoder: '',
    decoder: '',
    joiner: '',
  }

  const offlineParaformerModelConfig: OfflineModelConfig['paraformer'] = {
    model: '',
  }

  const offlineNemoCtcModelConfig: OfflineModelConfig['nemoCtc'] = {
    model: '',
  }

  // 模型类型选择（0: transducer, 1: paraformer, 2: nemoCtc）
  // 当前默认使用 type = 0 (transducer 模型)
  let type = 0

  // 根据模型类型设置对应的模型文件路径
  // 注意：这些路径是相对于 WASM 虚拟文件系统（MEMFS）的路径
  // 模型文件来自 `sherpa-onnx-wasm-main-asr.data` 文件，加载时会被解压到虚拟文件系统
  switch (type) {
    case 0:
      // Transducer 模型：需要 encoder、decoder、joiner 三个文件
      offlineTransducerModelConfig.encoder = './encoder.onnx'
      offlineTransducerModelConfig.decoder = './decoder.onnx'
      offlineTransducerModelConfig.joiner = './joiner.onnx'
      break
    case 1:
      // Paraformer 模型：只需要一个 model 文件
      offlineParaformerModelConfig.model = './encoder.onnx'
      break
    case 2:
      // NeMo CTC 模型：只需要一个 model 文件
      offlineNemoCtcModelConfig.model = './nemo-ctc.onnx'
      break
    default:
      break
  }

  // 构建离线模型配置
  const offlineModelConfig: OfflineModelConfig = {
    transducer: offlineTransducerModelConfig,
    paraformer: offlineParaformerModelConfig,
    nemoCtc: offlineNemoCtcModelConfig,
    tokens: './tokens.txt', // 词汇表文件，也来自 .data 文件
    numThreads: 1, // 使用单线程（CPU）
    provider: 'cpu', // 使用 CPU 推理
    debug: 1, // 开启调试模式
    modelType: '', // 模型类型（由模型文件自动识别）
    modelingUnit: 'cjkchar', // 建模单元：中文字符
    bpeVocab: '', // BPE 词汇表（可选）
  }

  // 特征提取配置
  const featureConfig = {
    sampleRate: 16000, // 采样率：16kHz
    featureDim: 80, // 特征维度：80（Mel 频谱特征）
  }

  // 构建完整的离线识别器配置
  let recognizerConfig: OfflineRecognizerConfig = {
    featConfig: featureConfig,
    modelConfig: offlineModelConfig,
    decodingMethod: 'greedy_search', // 解码方法：贪心搜索
    maxActivePaths: 4, // 最大活跃路径数
    hotwordsFile: '', // 热词文件路径（可选）
    hotwordsScore: 1.5, // 热词权重
    ruleFsts: '', // 规则 FST 文件路径（可选）
    ruleFars: '', // 规则 FAR 文件路径（可选）
  }

  // 如果调用方提供了自定义配置，则完全使用自定义配置
  if (myConfig) {
    recognizerConfig = myConfig
  }

  return new OfflineRecognizer(recognizerConfig, Module)
}

