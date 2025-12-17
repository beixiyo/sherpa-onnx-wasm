/**
 * TypeScript 类型定义文件 for sherpa-onnx-asr.js
 *
 * 提供 sherpa-onnx WebAssembly ASR 库的完整类型定义
 */

/**
 * Emscripten Module 对象的基础接口
 * 由 sherpa-onnx-wasm-main-asr.js 提供
 */
export interface SherpaOnnxModule {
  /** UTF8 字符串转 JavaScript 字符串 */
  UTF8ToString(ptr: number): string;

  /** 字符串转 UTF8 字节长度 */
  lengthBytesUTF8(str: string): number;

  /** 字符串转 UTF8 字节数组 */
  stringToUTF8(str: string, ptr: number, maxBytesToWrite: number): void;

  /** 分配内存 */
  _malloc(size: number): number;

  /** 释放内存 */
  _free(ptr: number): void;

  /** 复制堆内存 */
  _CopyHeap(src: number, len: number, dst: number): void;

  /** 设置值到内存 */
  setValue(ptr: number, value: number | string, type: string): void;

  /** 从内存获取值 */
  getValue(ptr: number, type: string): number;

  /** WASM 堆内存视图 */
  HEAPF32: Float32Array;
  HEAPU8: Uint8Array;
  HEAPU32: Uint32Array;

  /** 定位文件路径（Emscripten 标准接口） */
  locateFile?(path: string, scriptDirectory?: string): string;

  /** 设置状态信息（用于显示加载进度等） */
  setStatus?(status: string): void;

  /** 运行时初始化完成回调 */
  onRuntimeInitialized?(): void;

  /** WASM 函数接口 */
  _SherpaOnnxCreateOnlineRecognizer(configPtr: number): number;
  _SherpaOnnxDestroyOnlineRecognizer(handle: number): void;
  _SherpaOnnxCreateOnlineStream(recognizerHandle: number): number;
  _SherpaOnnxDestroyOnlineStream(handle: number): void;
  _SherpaOnnxOnlineStreamAcceptWaveform(handle: number, sampleRate: number, samplesPtr: number, n: number): void;
  _SherpaOnnxIsOnlineStreamReady(recognizerHandle: number, streamHandle: number): number;
  _SherpaOnnxDecodeOnlineStream(recognizerHandle: number, streamHandle: number): void;
  _SherpaOnnxOnlineStreamIsEndpoint(recognizerHandle: number, streamHandle: number): number;
  _SherpaOnnxOnlineStreamReset(recognizerHandle: number, streamHandle: number): void;
  _SherpaOnnxGetOnlineStreamResultAsJson(recognizerHandle: number, streamHandle: number): number;
  _SherpaOnnxDestroyOnlineStreamResultJson(ptr: number): void;

  _SherpaOnnxCreateOfflineRecognizer(configPtr: number): number;
  _SherpaOnnxDestroyOfflineRecognizer(handle: number): void;
  _SherpaOnnxCreateOfflineStream(recognizerHandle: number): number;
  _SherpaOnnxDestroyOfflineStream(handle: number): void;
  _SherpaOnnxAcceptWaveformOffline(handle: number, sampleRate: number, samplesPtr: number, n: number): void;
  _SherpaOnnxDecodeOfflineStream(recognizerHandle: number, streamHandle: number): void;
  _SherpaOnnxGetOfflineStreamResultAsJson(streamHandle: number): number;
  _SherpaOnnxDestroyOfflineStreamResultJson(ptr: number): void;
  _SherpaOnnxOfflineRecognizerSetConfig(recognizerHandle: number, configPtr: number): void;
}

/**
 * 在线 Transducer 模型配置
 */
export interface OnlineTransducerModelConfig {
  /** 编码器模型文件路径 */
  encoder: string;
  /** 解码器模型文件路径 */
  decoder: string;
  /** 连接器模型文件路径 */
  joiner: string;
}

/**
 * 在线 Paraformer 模型配置
 */
export interface OnlineParaformerModelConfig {
  /** 编码器模型文件路径 */
  encoder: string;
  /** 解码器模型文件路径 */
  decoder: string;
}

/**
 * 在线 Zipformer2 CTC 模型配置
 */
export interface OnlineZipformer2CtcModelConfig {
  /** 模型文件路径 */
  model: string;
}

/**
 * 在线 NeMo CTC 模型配置
 */
export interface OnlineNemoCtcModelConfig {
  /** 模型文件路径 */
  model: string;
}

/**
 * 在线 Tone CTC 模型配置
 */
export interface OnlineToneCtcModelConfig {
  /** 模型文件路径 */
  model: string;
}

/**
 * 在线模型配置
 */
export interface OnlineModelConfig {
  /** Transducer 模型配置 */
  transducer?: OnlineTransducerModelConfig;
  /** Paraformer 模型配置 */
  paraformer?: OnlineParaformerModelConfig;
  /** Zipformer2 CTC 模型配置 */
  zipformer2Ctc?: OnlineZipformer2CtcModelConfig;
  /** NeMo CTC 模型配置 */
  nemoCtc?: OnlineNemoCtcModelConfig;
  /** Tone CTC 模型配置 */
  toneCtc?: OnlineToneCtcModelConfig;
  /** 词汇表文件路径 */
  tokens: string;
  /** 线程数 */
  numThreads?: number;
  /** 执行提供者 ('cpu' | 'cuda' 等) */
  provider?: string;
  /** 调试模式 (0 或 1) */
  debug?: number;
  /** 模型类型 */
  modelType?: string;
  /** 建模单元 */
  modelingUnit?: string;
  /** BPE 词汇表文件路径 */
  bpeVocab?: string;
}

/**
 * 特征提取配置
 */
export interface FeatureConfig {
  /** 采样率（Hz），使用 toneCtc 时会被忽略 */
  sampleRate?: number;
  /** 特征维度，使用 toneCtc 时会被忽略 */
  featureDim?: number;
}

/**
 * CTC FST 解码器配置
 */
export interface OnlineCtcFstDecoderConfig {
  /** FST 图文件路径 */
  graph: string;
  /** 最大活跃状态数 */
  maxActive?: number;
}

/**
 * 同音字替换器配置
 */
export interface HomophoneReplacerConfig {
  /** 词典文件路径 */
  lexicon: string;
  /** 规则 FST 文件路径 */
  ruleFsts: string;
}

/**
 * 在线识别器配置
 */
export interface OnlineRecognizerConfig {
  /** 特征提取配置 */
  featConfig?: FeatureConfig;
  /** 模型配置 */
  modelConfig: OnlineModelConfig;
  /** 解码方法 ('greedy_search' | 'modified_beam_search' 等) */
  decodingMethod?: string;
  /** 最大活跃路径数 */
  maxActivePaths?: number;
  /** 是否启用端点检测 */
  enableEndpoint?: number;
  /** 规则1：最小尾随静音时长（秒） */
  rule1MinTrailingSilence?: number;
  /** 规则2：最小尾随静音时长（秒） */
  rule2MinTrailingSilence?: number;
  /** 规则3：最小话语长度（秒） */
  rule3MinUtteranceLength?: number;
  /** 热词文件路径 */
  hotwordsFile?: string;
  /** 热词分数 */
  hotwordsScore?: number;
  /** CTC FST 解码器配置 */
  ctcFstDecoderConfig?: OnlineCtcFstDecoderConfig;
  /** 规则 FST 文件路径 */
  ruleFsts?: string;
  /** 规则 FAR 文件路径 */
  ruleFars?: string;
}

/**
 * 识别结果
 */
export interface RecognitionResult {
  /** 识别的文本 */
  text: string;
  /** 其他可能的字段（根据实际返回结果） */
  [key: string]: any;
}

/**
 * 在线识别流
 * 用于实时流式识别
 */
export class OnlineStream {
  private handle: number;
  private Module: SherpaOnnxModule;
  private pointer: number | null;
  private n: number;

  constructor(handle: number, Module: SherpaOnnxModule);

  /**
   * 释放流资源
   */
  free(): void;

  /**
   * 接受音频波形数据
   * @param sampleRate 采样率（Hz）
   * @param samples 音频样本数组，范围 [-1, 1]
   */
  acceptWaveform(sampleRate: number, samples: Float32Array): void;

  /**
   * 标记输入完成
   */
  inputFinished(): void;
}

/**
 * 在线识别器
 * 用于实时流式语音识别
 */
export class OnlineRecognizer {
  private handle: number;
  private Module: SherpaOnnxModule;
  public config: OnlineRecognizerConfig;

  constructor(configObj: OnlineRecognizerConfig, Module: SherpaOnnxModule);

  /**
   * 释放识别器资源
   */
  free(): void;

  /**
   * 创建识别流
   * @returns 新的在线识别流
   */
  createStream(): OnlineStream;

  /**
   * 检查流是否准备好进行解码
   * @param stream 识别流
   * @returns 是否准备好
   */
  isReady(stream: OnlineStream): boolean;

  /**
   * 解码识别流
   * @param stream 识别流
   */
  decode(stream: OnlineStream): void;

  /**
   * 检查是否为端点（检测到静音等）
   * @param stream 识别流
   * @returns 是否为端点
   */
  isEndpoint(stream: OnlineStream): boolean;

  /**
   * 重置识别流
   * @param stream 识别流
   */
  reset(stream: OnlineStream): void;

  /**
   * 获取识别结果
   * @param stream 识别流
   * @returns 识别结果对象
   */
  getResult(stream: OnlineStream): RecognitionResult;
}

/**
 * 离线识别流
 * 用于离线批量识别
 */
export class OfflineStream {
  private handle: number;
  private Module: SherpaOnnxModule;

  constructor(handle: number, Module: SherpaOnnxModule);

  /**
   * 释放流资源
   */
  free(): void;

  /**
   * 接受音频波形数据
   * @param sampleRate 采样率（Hz）
   * @param samples 音频样本数组，范围 [-1, 1]
   */
  acceptWaveform(sampleRate: number, samples: Float32Array): void;
}

/**
 * 离线识别器配置
 */
export interface OfflineRecognizerConfig {
  /** 特征提取配置 */
  featConfig?: FeatureConfig;
  /** 模型配置 */
  modelConfig: OfflineModelConfig;
  /** 解码方法 */
  decodingMethod?: string;
  /** 最大活跃路径数 */
  maxActivePaths?: number;
  /** 热词文件路径 */
  hotwordsFile?: string;
  /** 热词分数 */
  hotwordsScore?: number;
  /** 规则 FST 文件路径 */
  ruleFsts?: string;
  /** 规则 FAR 文件路径 */
  ruleFars?: string;
  /** 语言模型配置 */
  lmConfig?: OfflineLMConfig;
  /** 同音字替换器配置 */
  hr?: HomophoneReplacerConfig;
}

/**
 * 离线模型配置
 */
export interface OfflineModelConfig {
  /** Transducer 模型配置 */
  transducer?: OfflineTransducerModelConfig;
  /** Paraformer 模型配置 */
  paraformer?: OfflineParaformerModelConfig;
  /** NeMo CTC 模型配置 */
  nemoCtc?: OfflineNemoCtcModelConfig;
  /** Whisper 模型配置 */
  whisper?: OfflineWhisperModelConfig;
  /** 其他模型配置... */
  /** 词汇表文件路径 */
  tokens: string;
  /** 线程数 */
  numThreads?: number;
  /** 执行提供者 */
  provider?: string;
  /** 调试模式 */
  debug?: number;
  /** 模型类型 */
  modelType?: string;
  /** 建模单元 */
  modelingUnit?: string;
  /** BPE 词汇表文件路径 */
  bpeVocab?: string;
}

/**
 * 离线 Transducer 模型配置
 */
export interface OfflineTransducerModelConfig {
  encoder: string;
  decoder: string;
  joiner: string;
}

/**
 * 离线 Paraformer 模型配置
 */
export interface OfflineParaformerModelConfig {
  model: string;
}

/**
 * 离线 NeMo CTC 模型配置
 */
export interface OfflineNemoCtcModelConfig {
  model: string;
}

/**
 * 离线 Whisper 模型配置
 */
export interface OfflineWhisperModelConfig {
  encoder: string;
  decoder: string;
  language: string;
  task: string;
  tailPaddings?: number;
}

/**
 * 离线语言模型配置
 */
export interface OfflineLMConfig {
  model: string;
  scale?: number;
}

/**
 * 离线识别器
 * 用于离线批量语音识别
 */
export class OfflineRecognizer {
  private handle: number;
  private Module: SherpaOnnxModule;
  public config: OfflineRecognizerConfig;

  constructor(configObj: OfflineRecognizerConfig, Module: SherpaOnnxModule);

  /**
   * 释放识别器资源
   */
  free(): void;

  /**
   * 设置配置
   * @param configObj 新的配置对象
   */
  setConfig(configObj: OfflineRecognizerConfig): void;

  /**
   * 创建识别流
   * @returns 新的离线识别流
   */
  createStream(): OfflineStream;

  /**
   * 解码识别流
   * @param stream 识别流
   */
  decode(stream: OfflineStream): void;

  /**
   * 获取识别结果
   * @param stream 识别流
   * @returns 识别结果对象
   */
  getResult(stream: OfflineStream): RecognitionResult;
}

/**
 * 创建在线识别器
 *
 * @param Module Emscripten Module 对象（由 sherpa-onnx-wasm-main-asr.js 提供）
 * @param myConfig 可选的配置对象，如果不提供则使用默认配置
 * @returns 在线识别器实例
 *
 * @example
 * ```typescript
 * // 等待 Module 初始化
 * Module.onRuntimeInitialized = function() {
 *   const recognizer = createOnlineRecognizer(Module);
 *   const stream = recognizer.createStream();
 *
 *   // 处理音频数据
 *   stream.acceptWaveform(16000, audioSamples);
 *
 *   if (recognizer.isReady(stream)) {
 *     recognizer.decode(stream);
 *     const result = recognizer.getResult(stream);
 *     console.log(result.text);
 *   }
 * };
 * ```
 */
export function createOnlineRecognizer(
  Module: SherpaOnnxModule,
  myConfig?: OnlineRecognizerConfig
): OnlineRecognizer;

/**
 * 全局声明，用于在浏览器环境中使用
 * 这些类型在浏览器环境中通过 sherpa-onnx-asr.js 脚本直接挂载到全局对象
 */
declare global {
  /**
   * Emscripten Module 对象（全局可用）
   * 由 sherpa-onnx-wasm-main-asr.js 初始化
   */
  var Module: SherpaOnnxModule;

  /**
   * 在线识别器类构造函数（全局可用）
   */
  var OnlineRecognizer: {
    new (configObj: OnlineRecognizerConfig, Module: SherpaOnnxModule): OnlineRecognizer;
  };

  /**
   * 在线识别流类构造函数（全局可用）
   */
  var OnlineStream: {
    new (handle: number, Module: SherpaOnnxModule): OnlineStream;
  };

  /**
   * 离线识别器类构造函数（全局可用）
   */
  var OfflineRecognizer: {
    new (configObj: OfflineRecognizerConfig, Module: SherpaOnnxModule): OfflineRecognizer;
  };

  /**
   * 离线识别流类构造函数（全局可用）
   */
  var OfflineStream: {
    new (handle: number, Module: SherpaOnnxModule): OfflineStream;
  };

  /**
   * 创建在线识别器函数（全局可用）
   */
  var createOnlineRecognizer: (
    Module: SherpaOnnxModule,
    myConfig?: OnlineRecognizerConfig
  ) => OnlineRecognizer;
}

