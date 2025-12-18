import type {
  OnlineModelConfig,
  OnlineRecognizerConfig,
  RecognitionResult,
  SherpaOnnxModule,
} from './types'
import {
  freeConfig, initSherpaOnnxOnlineRecognizerConfig
} from './config'

export class OnlineStream {
  handle: number
  pointer: number | null
  n: number
  Module: SherpaOnnxModule

  constructor(handle: number, Module: SherpaOnnxModule) {
    this.handle = handle
    this.pointer = null
    this.n = 0
    this.Module = Module
  }

  free() {
    if (this.handle) {
      this.Module._SherpaOnnxDestroyOnlineStream(this.handle)
      this.handle = 0
      if (this.pointer) {
        this.Module._free(this.pointer)
      }
      this.pointer = null
      this.n = 0
    }
  }

  /**
   * 接收一段在线音频数据
   * @param sampleRate 采样率
   * @param samples [-1, 1] 的 Float32Array
   */
  acceptWaveform(sampleRate: number, samples: Float32Array) {
    if (!this.pointer || this.n < samples.length) {
      if (this.pointer) {
        this.Module._free(this.pointer)
      }
      this.pointer =
        this.Module._malloc(samples.length * samples.BYTES_PER_ELEMENT)
      this.n = samples.length
    }

    this.Module.HEAPF32.set(
      samples,
      this.pointer / samples.BYTES_PER_ELEMENT,
    )
    this.Module._SherpaOnnxOnlineStreamAcceptWaveform(
      this.handle,
      sampleRate,
      this.pointer,
      samples.length,
    )
  }

  inputFinished() {
    this.Module._SherpaOnnxOnlineStreamInputFinished(this.handle)
  }
}

export class OnlineRecognizer {
  config: OnlineRecognizerConfig
  handle: number
  Module: SherpaOnnxModule

  constructor(configObj: OnlineRecognizerConfig, Module: SherpaOnnxModule) {
    this.config = configObj
    const config = initSherpaOnnxOnlineRecognizerConfig(configObj, Module)
    const handle =
      Module._SherpaOnnxCreateOnlineRecognizer(config.ptr)

    freeConfig(config, Module)

    this.handle = handle
    this.Module = Module
  }

  free() {
    this.Module._SherpaOnnxDestroyOnlineRecognizer(this.handle)
    this.handle = 0
  }

  createStream() {
    const handle = this.Module._SherpaOnnxCreateOnlineStream(this.handle)
    return new OnlineStream(handle, this.Module)
  }

  isReady(stream: OnlineStream) {
    return (
      this.Module._SherpaOnnxIsOnlineStreamReady(
        this.handle,
        stream.handle,
      ) === 1
    )
  }

  decode(stream: OnlineStream) {
    this.Module._SherpaOnnxDecodeOnlineStream(
      this.handle,
      stream.handle,
    )
  }

  isEndpoint(stream: OnlineStream) {
    return (
      this.Module._SherpaOnnxOnlineStreamIsEndpoint(
        this.handle,
        stream.handle,
      ) === 1
    )
  }

  reset(stream: OnlineStream) {
    this.Module._SherpaOnnxOnlineStreamReset(
      this.handle,
      stream.handle,
    )
  }

  getResult(stream: OnlineStream): RecognitionResult {
    const r = this.Module._SherpaOnnxGetOnlineStreamResultAsJson(
      this.handle,
      stream.handle,
    )
    const jsonStr = this.Module.UTF8ToString(r)
    const ans = JSON.parse(jsonStr) as RecognitionResult
    this.Module._SherpaOnnxDestroyOnlineStreamResultJson(r)

    return ans
  }
}

/**
 * 完整复刻原始 js 中的 createOnlineRecognizer 逻辑
 * 如果传入 myConfig 则直接使用调用方配置，否则构造默认配置
 */
export function createOnlineRecognizer(
  Module: SherpaOnnxModule,
  myConfig?: OnlineRecognizerConfig,
): OnlineRecognizer {
  const onlineTransducerModelConfig: OnlineModelConfig['transducer'] = {
    encoder: '',
    decoder: '',
    joiner: '',
  }

  const onlineParaformerModelConfig: OnlineModelConfig['paraformer'] = {
    encoder: '',
    decoder: '',
  }

  const onlineZipformer2CtcModelConfig: OnlineModelConfig['zipformer2Ctc'] = {
    model: '',
  }

  const onlineNemoCtcModelConfig: OnlineModelConfig['nemoCtc'] = {
    model: '',
  }

  const onlineToneCtcModelConfig: OnlineModelConfig['toneCtc'] = {
    model: '',
  }

  let type = 0

  switch (type) {
    case 0:
      onlineTransducerModelConfig.encoder = './encoder.onnx'
      onlineTransducerModelConfig.decoder = './decoder.onnx'
      onlineTransducerModelConfig.joiner = './joiner.onnx'
      break
    case 1:
      onlineParaformerModelConfig.encoder = './encoder.onnx'
      onlineParaformerModelConfig.decoder = './decoder.onnx'
      break
    case 2:
      onlineZipformer2CtcModelConfig.model = './encoder.onnx'
      break
    case 3:
      onlineNemoCtcModelConfig.model = './nemo-ctc.onnx'
      break
    case 4:
      onlineToneCtcModelConfig.model = './tone-ctc.onnx'
      break
    default:
      break
  }

  const onlineModelConfig: OnlineModelConfig = {
    transducer: onlineTransducerModelConfig,
    paraformer: onlineParaformerModelConfig,
    zipformer2Ctc: onlineZipformer2CtcModelConfig,
    nemoCtc: onlineNemoCtcModelConfig,
    toneCtc: onlineToneCtcModelConfig,
    tokens: './tokens.txt',
    numThreads: 1,
    provider: 'cpu',
    debug: 1,
    modelType: '',
    modelingUnit: 'cjkchar',
    bpeVocab: '',
  }

  const featureConfig = {
    sampleRate: 16000,
    featureDim: 80,
  }

  let recognizerConfig: OnlineRecognizerConfig = {
    featConfig: featureConfig,
    modelConfig: onlineModelConfig,
    decodingMethod: 'greedy_search',
    maxActivePaths: 4,
    enableEndpoint: 1,
    rule1MinTrailingSilence: 2.4,
    rule2MinTrailingSilence: 1.2,
    rule3MinUtteranceLength: 20,
    hotwordsFile: '',
    hotwordsScore: 1.5,
    ctcFstDecoderConfig: {
      graph: '',
      maxActive: 3000,
    },
    ruleFsts: '',
    ruleFars: '',
  }

  if (myConfig) {
    recognizerConfig = myConfig
  }

  return new OnlineRecognizer(recognizerConfig, Module)
}


