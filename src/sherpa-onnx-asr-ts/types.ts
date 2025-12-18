/**
 * sherpa-onnx ASR 相关的类型定义
 * 从原来的 d.ts 抽取到正常的 TS 模块中，方便统一维护
 */

export interface SherpaOnnxModule {
  UTF8ToString(ptr: number): string

  lengthBytesUTF8(str: string): number

  stringToUTF8(str: string, ptr: number, maxBytesToWrite: number): void

  _malloc(size: number): number

  _free(ptr: number): void

  _CopyHeap(src: number, len: number, dst: number): void

  setValue(ptr: number, value: number | string, type: string): void

  getValue(ptr: number, type: string): number

  HEAPF32: Float32Array
  HEAPU8: Uint8Array
  HEAPU32: Uint32Array

  locateFile?(path: string, scriptDirectory?: string): string

  setStatus?(status: string): void

  onRuntimeInitialized?(): void

  _SherpaOnnxCreateOnlineRecognizer(configPtr: number): number
  _SherpaOnnxDestroyOnlineRecognizer(handle: number): void
  _SherpaOnnxCreateOnlineStream(recognizerHandle: number): number
  _SherpaOnnxDestroyOnlineStream(handle: number): void
  _SherpaOnnxOnlineStreamAcceptWaveform(
    handle: number,
    sampleRate: number,
    samplesPtr: number,
    n: number,
  ): void
  _SherpaOnnxIsOnlineStreamReady(
    recognizerHandle: number,
    streamHandle: number,
  ): number
  _SherpaOnnxDecodeOnlineStream(
    recognizerHandle: number,
    streamHandle: number,
  ): void
  _SherpaOnnxOnlineStreamIsEndpoint(
    recognizerHandle: number,
    streamHandle: number,
  ): number
  _SherpaOnnxOnlineStreamReset(
    recognizerHandle: number,
    streamHandle: number,
  ): void
  _SherpaOnnxOnlineStreamInputFinished(handle: number): void
  _SherpaOnnxGetOnlineStreamResultAsJson(
    recognizerHandle: number,
    streamHandle: number,
  ): number
  _SherpaOnnxDestroyOnlineStreamResultJson(ptr: number): void

  _SherpaOnnxCreateOfflineRecognizer(configPtr: number): number
  _SherpaOnnxDestroyOfflineRecognizer(handle: number): void
  _SherpaOnnxCreateOfflineStream(recognizerHandle: number): number
  _SherpaOnnxDestroyOfflineStream(handle: number): void
  _SherpaOnnxAcceptWaveformOffline(
    handle: number,
    sampleRate: number,
    samplesPtr: number,
    n: number,
  ): void
  _SherpaOnnxDecodeOfflineStream(
    recognizerHandle: number,
    streamHandle: number,
  ): void
  _SherpaOnnxGetOfflineStreamResultAsJson(streamHandle: number): number
  _SherpaOnnxDestroyOfflineStreamResultJson(ptr: number): void
  _SherpaOnnxOfflineRecognizerSetConfig(
    recognizerHandle: number,
    configPtr: number,
  ): void
}

export interface OnlineTransducerModelConfig {
  encoder: string
  decoder: string
  joiner: string
}

export interface OnlineParaformerModelConfig {
  encoder: string
  decoder: string
}

export interface OnlineZipformer2CtcModelConfig {
  model: string
}

export interface OnlineNemoCtcModelConfig {
  model: string
}

export interface OnlineToneCtcModelConfig {
  model: string
}

export interface OnlineModelConfig {
  transducer?: OnlineTransducerModelConfig
  paraformer?: OnlineParaformerModelConfig
  zipformer2Ctc?: OnlineZipformer2CtcModelConfig
  nemoCtc?: OnlineNemoCtcModelConfig
  toneCtc?: OnlineToneCtcModelConfig
  tokens: string
  numThreads?: number
  provider?: string
  debug?: number
  modelType?: string
  modelingUnit?: string
  bpeVocab?: string
  tokensBuf?: string
  tokensBufSize?: number
  teleSpeechCtc?: string
}

export interface FeatureConfig {
  sampleRate?: number
  featureDim?: number
}

export interface OnlineCtcFstDecoderConfig {
  graph: string
  maxActive?: number
}

export interface HomophoneReplacerConfig {
  lexicon: string
  ruleFsts: string
}

export interface OnlineRecognizerConfig {
  featConfig?: FeatureConfig
  modelConfig: OnlineModelConfig
  decodingMethod?: string
  maxActivePaths?: number
  enableEndpoint?: number
  rule1MinTrailingSilence?: number
  rule2MinTrailingSilence?: number
  rule3MinUtteranceLength?: number
  hotwordsFile?: string
  hotwordsScore?: number
  ctcFstDecoderConfig?: OnlineCtcFstDecoderConfig
  ruleFsts?: string
  ruleFars?: string
  hotwordsBuf?: string
  hotwordsBufSize?: number
  hr?: HomophoneReplacerConfig
  blankPenalty?: number
}

export interface OfflineTransducerModelConfig {
  encoder: string
  decoder: string
  joiner: string
}

export interface OfflineParaformerModelConfig {
  model: string
}

export interface OfflineNemoCtcModelConfig {
  model: string
}

export interface OfflineWhisperModelConfig {
  encoder: string
  decoder: string
  language: string
  task: string
  tailPaddings?: number
}

export interface OfflineDolphinModelConfig {
  model: string
}

export interface OfflineZipformerCtcModelConfig {
  model: string
}

export interface OfflineWenetCtcModelConfig {
  model: string
}

export interface OfflineOmnilingualAsrCtcModelConfig {
  model: string
}

export interface OfflineMoonshineModelConfig {
  preprocessor: string
  encoder: string
  uncachedDecoder: string
  cachedDecoder: string
}

export interface OfflineFireRedAsrModelConfig {
  encoder: string
  decoder: string
}

export interface OfflineTdnnModelConfig {
  model: string
}

export interface OfflineSenseVoiceModelConfig {
  model: string
  language: string
  useInverseTextNormalization?: number
}

export interface OfflineCanaryModelConfig {
  encoder: string
  decoder: string
  srcLang: string
  tgtLang: string
  usePnc?: number
}

export interface OfflineLMConfig {
  model: string
  scale?: number
}

export interface OfflineModelConfig {
  transducer?: OfflineTransducerModelConfig
  paraformer?: OfflineParaformerModelConfig
  nemoCtc?: OfflineNemoCtcModelConfig
  whisper?: OfflineWhisperModelConfig
  dolphin?: OfflineDolphinModelConfig
  zipformerCtc?: OfflineZipformerCtcModelConfig
  wenetCtc?: OfflineWenetCtcModelConfig
  omnilingual?: OfflineOmnilingualAsrCtcModelConfig
  moonshine?: OfflineMoonshineModelConfig
  fireRedAsr?: OfflineFireRedAsrModelConfig
  tdnn?: OfflineTdnnModelConfig
  senseVoice?: OfflineSenseVoiceModelConfig
  canary?: OfflineCanaryModelConfig
  tokens: string
  numThreads?: number
  provider?: string
  debug?: number
  modelType?: string
  modelingUnit?: string
  bpeVocab?: string
  teleSpeechCtc?: string
}

export interface OfflineRecognizerConfig {
  featConfig?: FeatureConfig
  modelConfig: OfflineModelConfig
  decodingMethod?: string
  maxActivePaths?: number
  hotwordsFile?: string
  hotwordsScore?: number
  ruleFsts?: string
  ruleFars?: string
  lmConfig?: OfflineLMConfig
  hr?: HomophoneReplacerConfig
  blankPenalty?: number
}

export interface RecognitionResult {
  text: string
  [key: string]: unknown
}


