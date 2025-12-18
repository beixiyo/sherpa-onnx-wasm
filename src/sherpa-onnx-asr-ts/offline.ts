import type {
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


