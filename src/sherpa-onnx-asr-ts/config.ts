/**
 * 这里包含 sherpa-onnx 的各种配置结构到 C 接口结构体的转换逻辑
 * 完全按照原始 js 实现迁移，只是补充了类型
 */

import type {
  FeatureConfig,
  HomophoneReplacerConfig,
  OfflineLMConfig,
  OfflineModelConfig,
  OfflineRecognizerConfig,
  OnlineCtcFstDecoderConfig,
  OnlineModelConfig,
  OnlineRecognizerConfig,
  SherpaOnnxModule,
} from './types'

type PtrConfig = {
  ptr: number
  buffer?: number
  [key: string]: unknown
}

export function freeConfig(config: PtrConfig, Module: SherpaOnnxModule) {
  if ('buffer' in config && typeof config.buffer === 'number') {
    Module._free(config.buffer)
  }

  const keys: Array<keyof PtrConfig> = [
    'config',
    'transducer',
    'paraformer',
    'zipformer2Ctc',
    'feat',
    'model',
    'nemoCtc',
    'toneCtc',
    'whisper',
    'fireRedAsr',
    'dolphin',
    'zipformerCtc',
    'wenetCtc',
    'omnilingual',
    'moonshine',
    'tdnn',
    'senseVoice',
    'canary',
    'lm',
    'ctcFstDecoder',
    'hr',
  ]

  for (const key of keys) {
    const value = config[key]
    if (value && typeof value === 'object') {
      freeConfig(value as PtrConfig, Module)
    }
  }

  Module._free(config.ptr)
}

// ---------------------- 在线模型相关 ---------------------- //

export function initSherpaOnnxOnlineTransducerModelConfig(
  config: NonNullable<OnlineModelConfig['transducer']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const encoderLen = Module.lengthBytesUTF8(config.encoder || '') + 1
  const decoderLen = Module.lengthBytesUTF8(config.decoder || '') + 1
  const joinerLen = Module.lengthBytesUTF8(config.joiner || '') + 1

  const n = encoderLen + decoderLen + joinerLen

  const buffer = Module._malloc(n)

  const len = 3 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(config.encoder || '', buffer + offset, encoderLen)
  offset += encoderLen

  Module.stringToUTF8(config.decoder || '', buffer + offset, decoderLen)
  offset += decoderLen

  Module.stringToUTF8(config.joiner || '', buffer + offset, joinerLen)

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += encoderLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')
  offset += decoderLen

  Module.setValue(ptr + 8, buffer + offset, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOnlineParaformerModelConfig(
  config: NonNullable<OnlineModelConfig['paraformer']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const encoderLen = Module.lengthBytesUTF8(config.encoder || '') + 1
  const decoderLen = Module.lengthBytesUTF8(config.decoder || '') + 1

  const n = encoderLen + decoderLen
  const buffer = Module._malloc(n)

  const len = 2 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(config.encoder || '', buffer + offset, encoderLen)
  offset += encoderLen

  Module.stringToUTF8(config.decoder || '', buffer + offset, decoderLen)

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += encoderLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOnlineZipformer2CtcModelConfig(
  config: NonNullable<OnlineModelConfig['zipformer2Ctc']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1
  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOnlineNemoCtcModelConfig(
  config: NonNullable<OnlineModelConfig['nemoCtc']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1
  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOnlineToneCtcModelConfig(
  config: NonNullable<OnlineModelConfig['toneCtc']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1
  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxFeatureConfig(
  config: FeatureConfig,
  Module: SherpaOnnxModule,
): PtrConfig {
  const len = 2 * 4
  const ptr = Module._malloc(len)

  Module.setValue(ptr, config.sampleRate || 16000, 'i32')
  Module.setValue(ptr + 4, config.featureDim || 80, 'i32')

  return { ptr, len }
}

export function initSherpaOnnxHomophoneReplacerConfig(
  config: HomophoneReplacerConfig,
  Module: SherpaOnnxModule,
): PtrConfig {
  const len = 3 * 4
  const ptr = Module._malloc(len)

  const dictDir = ''

  const dictDirLen = Module.lengthBytesUTF8(dictDir) + 1
  const lexiconLen = Module.lengthBytesUTF8(config.lexicon || '') + 1
  const ruleFstsLen = Module.lengthBytesUTF8(config.ruleFsts || '') + 1

  const bufferLen = dictDirLen + lexiconLen + ruleFstsLen

  const buffer = Module._malloc(bufferLen)
  let offset = 0
  Module.stringToUTF8(dictDir, buffer + offset, dictDirLen)
  offset += dictDirLen

  Module.stringToUTF8(config.lexicon || '', buffer + offset, lexiconLen)
  offset += lexiconLen

  Module.stringToUTF8(config.ruleFsts || '', buffer + offset, ruleFstsLen)
  offset += ruleFstsLen

  Module.setValue(ptr, buffer, 'i8*')
  Module.setValue(ptr + 4, buffer + dictDirLen, 'i8*')
  Module.setValue(ptr + 8, buffer + dictDirLen + lexiconLen, 'i8*')

  return { ptr, len, buffer }
}

export function initSherpaOnnxOnlineCtcFstDecoderConfig(
  config: OnlineCtcFstDecoderConfig,
  Module: SherpaOnnxModule,
): PtrConfig {
  const len = 2 * 4
  const ptr = Module._malloc(len)

  const graphLen = Module.lengthBytesUTF8(config.graph || '') + 1
  const buffer = Module._malloc(graphLen)
  Module.stringToUTF8(config.graph || '', buffer, graphLen)

  Module.setValue(ptr, buffer, 'i8*')
  Module.setValue(ptr + 4, config.maxActive || 3000, 'i32')
  return { ptr, len, buffer }
}

export function initSherpaOnnxOnlineModelConfig(
  config: OnlineModelConfig,
  Module: SherpaOnnxModule,
): PtrConfig & {
  transducer: PtrConfig
  paraformer: PtrConfig
  zipformer2Ctc: PtrConfig
  nemoCtc: PtrConfig
  toneCtc: PtrConfig
} {
  if (!config.transducer) {
    config.transducer = { encoder: '', decoder: '', joiner: '' }
  }

  if (!config.paraformer) {
    config.paraformer = { encoder: '', decoder: '' }
  }

  if (!config.zipformer2Ctc) {
    config.zipformer2Ctc = { model: '' }
  }

  if (!config.nemoCtc) {
    config.nemoCtc = { model: '' }
  }

  if (!config.toneCtc) {
    config.toneCtc = { model: '' }
  }

  if (!('tokensBuf' in config)) {
    config.tokensBuf = ''
  }

  if (!('tokensBufSize' in config)) {
    config.tokensBufSize = 0
  }

  const transducer = initSherpaOnnxOnlineTransducerModelConfig(
    config.transducer,
    Module,
  )

  const paraformer = initSherpaOnnxOnlineParaformerModelConfig(
    config.paraformer,
    Module,
  )

  const zipformer2Ctc = initSherpaOnnxOnlineZipformer2CtcModelConfig(
    config.zipformer2Ctc,
    Module,
  )

  const nemoCtc = initSherpaOnnxOnlineNemoCtcModelConfig(config.nemoCtc, Module)

  const toneCtc = initSherpaOnnxOnlineToneCtcModelConfig(
    config.toneCtc,
    Module,
  )

  const len =
    transducer.len +
    paraformer.len +
    zipformer2Ctc.len +
    9 * 4 +
    nemoCtc.len +
    toneCtc.len

  const ptr = Module._malloc(len)

  let offset = 0
  Module._CopyHeap(transducer.ptr, transducer.len, ptr + offset)
  offset += transducer.len

  Module._CopyHeap(paraformer.ptr, paraformer.len, ptr + offset)
  offset += paraformer.len

  Module._CopyHeap(zipformer2Ctc.ptr, zipformer2Ctc.len, ptr + offset)
  offset += zipformer2Ctc.len

  const tokensLen = Module.lengthBytesUTF8(config.tokens || '') + 1
  const providerLen = Module.lengthBytesUTF8(config.provider || 'cpu') + 1
  const modelTypeLen = Module.lengthBytesUTF8(config.modelType || '') + 1
  const modelingUnitLen =
    Module.lengthBytesUTF8(config.modelingUnit || '') + 1
  const bpeVocabLen = Module.lengthBytesUTF8(config.bpeVocab || '') + 1
  const tokensBufLen = Module.lengthBytesUTF8(config.tokensBuf || '') + 1

  const bufferLen =
    tokensLen +
    providerLen +
    modelTypeLen +
    modelingUnitLen +
    bpeVocabLen +
    tokensBufLen
  const buffer = Module._malloc(bufferLen)

  offset = 0
  Module.stringToUTF8(config.tokens || '', buffer, tokensLen)
  offset += tokensLen

  Module.stringToUTF8(
    config.provider || 'cpu',
    buffer + offset,
    providerLen,
  )
  offset += providerLen

  Module.stringToUTF8(
    config.modelType || '',
    buffer + offset,
    modelTypeLen,
  )
  offset += modelTypeLen

  Module.stringToUTF8(
    config.modelingUnit || '',
    buffer + offset,
    modelingUnitLen,
  )
  offset += modelingUnitLen

  Module.stringToUTF8(config.bpeVocab || '', buffer + offset, bpeVocabLen)
  offset += bpeVocabLen

  Module.stringToUTF8(config.tokensBuf || '', buffer + offset, tokensBufLen)
  offset += tokensBufLen

  offset = transducer.len + paraformer.len + zipformer2Ctc.len
  Module.setValue(ptr + offset, buffer, 'i8*')
  offset += 4

  Module.setValue(ptr + offset, config.numThreads || 1, 'i32')
  offset += 4

  Module.setValue(ptr + offset, buffer + tokensLen, 'i8*')
  offset += 4

  Module.setValue(ptr + offset, config.debug ?? 1, 'i32')
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + tokensLen + providerLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + tokensLen + providerLen + modelTypeLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer +
      tokensLen +
      providerLen +
      modelTypeLen +
      modelingUnitLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer +
      tokensLen +
      providerLen +
      modelTypeLen +
      modelingUnitLen +
      bpeVocabLen,
    'i8*',
  )
  offset += 4

  Module.setValue(ptr + offset, config.tokensBufSize || 0, 'i32')
  offset += 4

  Module._CopyHeap(nemoCtc.ptr, nemoCtc.len, ptr + offset)
  offset += nemoCtc.len

  Module._CopyHeap(toneCtc.ptr, toneCtc.len, ptr + offset)
  offset += toneCtc.len

  return {
    buffer,
    ptr,
    len,
    transducer,
    paraformer,
    zipformer2Ctc,
    nemoCtc,
    toneCtc,
  }
}

export function initSherpaOnnxOnlineRecognizerConfig(
  config: OnlineRecognizerConfig,
  Module: SherpaOnnxModule,
): PtrConfig & {
  feat: PtrConfig
  model: ReturnType<typeof initSherpaOnnxOnlineModelConfig>
  ctcFstDecoder: PtrConfig
  hr: PtrConfig
} {
  if (!config.featConfig) {
    config.featConfig = {
      sampleRate: 16000,
      featureDim: 80,
    }
  }

  if (!config.ctcFstDecoderConfig) {
    config.ctcFstDecoderConfig = {
      graph: '',
      maxActive: 3000,
    }
  }

  if (!('hotwordsBuf' in config)) {
    config.hotwordsBuf = ''
  }

  if (!('hotwordsBufSize' in config)) {
    config.hotwordsBufSize = 0
  }

  if (!config.hr) {
    config.hr = {
      lexicon: '',
      ruleFsts: '',
    }
  }

  const feat = initSherpaOnnxFeatureConfig(config.featConfig, Module)
  const model = initSherpaOnnxOnlineModelConfig(config.modelConfig, Module)
  const ctcFstDecoder = initSherpaOnnxOnlineCtcFstDecoderConfig(
    config.ctcFstDecoderConfig,
    Module,
  )
  const hr = initSherpaOnnxHomophoneReplacerConfig(config.hr, Module)

  const len =
    feat.len + model.len + 8 * 4 + ctcFstDecoder.len + 5 * 4 + hr.len
  const ptr = Module._malloc(len)

  let offset = 0
  Module._CopyHeap(feat.ptr, feat.len, ptr + offset)
  offset += feat.len

  Module._CopyHeap(model.ptr, model.len, ptr + offset)
  offset += model.len

  const decodingMethodLen =
    Module.lengthBytesUTF8(config.decodingMethod || 'greedy_search') + 1
  const hotwordsFileLen =
    Module.lengthBytesUTF8(config.hotwordsFile || '') + 1
  const ruleFstsFileLen =
    Module.lengthBytesUTF8(config.ruleFsts || '') + 1
  const ruleFarsFileLen =
    Module.lengthBytesUTF8(config.ruleFars || '') + 1
  const hotwordsBufLen =
    Module.lengthBytesUTF8(config.hotwordsBuf || '') + 1
  const bufferLen =
    decodingMethodLen +
    hotwordsFileLen +
    ruleFstsFileLen +
    ruleFarsFileLen +
    hotwordsBufLen
  const buffer = Module._malloc(bufferLen)

  offset = 0
  Module.stringToUTF8(
    config.decodingMethod || 'greedy_search',
    buffer,
    decodingMethodLen,
  )
  offset += decodingMethodLen

  Module.stringToUTF8(
    config.hotwordsFile || '',
    buffer + offset,
    hotwordsFileLen,
  )
  offset += hotwordsFileLen

  Module.stringToUTF8(
    config.ruleFsts || '',
    buffer + offset,
    ruleFstsFileLen,
  )
  offset += ruleFstsFileLen

  Module.stringToUTF8(
    config.ruleFars || '',
    buffer + offset,
    ruleFarsFileLen,
  )
  offset += ruleFarsFileLen

  Module.stringToUTF8(
    config.hotwordsBuf || '',
    buffer + offset,
    hotwordsBufLen,
  )
  offset += hotwordsBufLen

  offset = feat.len + model.len
  Module.setValue(ptr + offset, buffer, 'i8*')
  offset += 4

  Module.setValue(ptr + offset, config.maxActivePaths || 4, 'i32')
  offset += 4

  Module.setValue(ptr + offset, config.enableEndpoint || 0, 'i32')
  offset += 4

  Module.setValue(
    ptr + offset,
    config.rule1MinTrailingSilence || 2.4,
    'float',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    config.rule2MinTrailingSilence || 1.2,
    'float',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    config.rule3MinUtteranceLength || 20,
    'float',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + decodingMethodLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    config.hotwordsScore || 1.5,
    'float',
  )
  offset += 4

  Module._CopyHeap(ctcFstDecoder.ptr, ctcFstDecoder.len, ptr + offset)
  offset += ctcFstDecoder.len

  Module.setValue(
    ptr + offset,
    buffer + decodingMethodLen + hotwordsFileLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + decodingMethodLen + hotwordsFileLen + ruleFstsFileLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    config.blankPenalty || 0,
    'float',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer +
      decodingMethodLen +
      hotwordsFileLen +
      ruleFstsFileLen +
      ruleFarsFileLen,
    'i8*',
  )
  offset += 4

  Module.setValue(ptr + offset, config.hotwordsBufSize || 0, 'i32')
  offset += 4

  Module._CopyHeap(hr.ptr, hr.len, ptr + offset)
  offset += hr.len

  return {
    buffer,
    ptr,
    len,
    feat,
    model,
    ctcFstDecoder,
    hr,
  }
}

// ---------------------- 离线模型相关 ---------------------- //

export function initSherpaOnnxOfflineTransducerModelConfig(
  config: NonNullable<OfflineModelConfig['transducer']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const encoderLen = Module.lengthBytesUTF8(config.encoder || '') + 1
  const decoderLen = Module.lengthBytesUTF8(config.decoder || '') + 1
  const joinerLen = Module.lengthBytesUTF8(config.joiner || '') + 1

  const n = encoderLen + decoderLen + joinerLen

  const buffer = Module._malloc(n)

  const len = 3 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(config.encoder || '', buffer + offset, encoderLen)
  offset += encoderLen

  Module.stringToUTF8(config.decoder || '', buffer + offset, decoderLen)
  offset += decoderLen

  Module.stringToUTF8(config.joiner || '', buffer + offset, joinerLen)

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += encoderLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')
  offset += decoderLen

  Module.setValue(ptr + 8, buffer + offset, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineParaformerModelConfig(
  config: NonNullable<OfflineModelConfig['paraformer']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1

  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineNemoEncDecCtcModelConfig(
  config: NonNullable<OfflineModelConfig['nemoCtc']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1

  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineDolphinModelConfig(
  config: NonNullable<OfflineModelConfig['dolphin']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1

  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineZipformerCtcModelConfig(
  config: NonNullable<OfflineModelConfig['zipformerCtc']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1

  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineWenetCtcModelConfig(
  config: NonNullable<OfflineModelConfig['wenetCtc']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1

  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineOmnilingualAsrCtcModelConfig(
  config: NonNullable<OfflineModelConfig['omnilingual']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1

  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineWhisperModelConfig(
  config: NonNullable<OfflineModelConfig['whisper']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const encoderLen = Module.lengthBytesUTF8(config.encoder || '') + 1
  const decoderLen = Module.lengthBytesUTF8(config.decoder || '') + 1
  const languageLen = Module.lengthBytesUTF8(config.language || '') + 1
  const taskLen = Module.lengthBytesUTF8(config.task || '') + 1

  const n = encoderLen + decoderLen + languageLen + taskLen
  const buffer = Module._malloc(n)

  const len = 5 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(config.encoder || '', buffer + offset, encoderLen)
  offset += encoderLen

  Module.stringToUTF8(config.decoder || '', buffer + offset, decoderLen)
  offset += decoderLen

  Module.stringToUTF8(config.language || '', buffer + offset, languageLen)
  offset += languageLen

  Module.stringToUTF8(config.task || '', buffer + offset, taskLen)

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += encoderLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')
  offset += decoderLen

  Module.setValue(ptr + 8, buffer + offset, 'i8*')
  offset += languageLen

  Module.setValue(ptr + 12, buffer + offset, 'i8*')
  offset += taskLen

  Module.setValue(ptr + 16, config.tailPaddings || 2000, 'i32')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineCanaryModelConfig(
  config: NonNullable<OfflineModelConfig['canary']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const encoderLen = Module.lengthBytesUTF8(config.encoder || '') + 1
  const decoderLen = Module.lengthBytesUTF8(config.decoder || '') + 1
  const srcLangLen = Module.lengthBytesUTF8(config.srcLang || '') + 1
  const tgtLangLen = Module.lengthBytesUTF8(config.tgtLang || '') + 1

  const n = encoderLen + decoderLen + srcLangLen + tgtLangLen
  const buffer = Module._malloc(n)

  const len = 5 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(config.encoder || '', buffer + offset, encoderLen)
  offset += encoderLen

  Module.stringToUTF8(config.decoder || '', buffer + offset, decoderLen)
  offset += decoderLen

  Module.stringToUTF8(config.srcLang || '', buffer + offset, srcLangLen)
  offset += srcLangLen

  Module.stringToUTF8(config.tgtLang || '', buffer + offset, tgtLangLen)
  offset += tgtLangLen

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += encoderLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')
  offset += decoderLen

  Module.setValue(ptr + 8, buffer + offset, 'i8*')
  offset += srcLangLen

  Module.setValue(ptr + 12, buffer + offset, 'i8*')
  offset += tgtLangLen

  Module.setValue(ptr + 16, config.usePnc ?? 1, 'i32')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineMoonshineModelConfig(
  config: NonNullable<OfflineModelConfig['moonshine']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const preprocessorLen =
    Module.lengthBytesUTF8(config.preprocessor || '') + 1
  const encoderLen = Module.lengthBytesUTF8(config.encoder || '') + 1
  const uncachedDecoderLen =
    Module.lengthBytesUTF8(config.uncachedDecoder || '') + 1
  const cachedDecoderLen =
    Module.lengthBytesUTF8(config.cachedDecoder || '') + 1

  const n =
    preprocessorLen + encoderLen + uncachedDecoderLen + cachedDecoderLen
  const buffer = Module._malloc(n)

  const len = 4 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(
    config.preprocessor || '',
    buffer + offset,
    preprocessorLen,
  )
  offset += preprocessorLen

  Module.stringToUTF8(config.encoder || '', buffer + offset, encoderLen)
  offset += encoderLen

  Module.stringToUTF8(
    config.uncachedDecoder || '',
    buffer + offset,
    uncachedDecoderLen,
  )
  offset += uncachedDecoderLen

  Module.stringToUTF8(
    config.cachedDecoder || '',
    buffer + offset,
    cachedDecoderLen,
  )
  offset += cachedDecoderLen

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += preprocessorLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')
  offset += encoderLen

  Module.setValue(ptr + 8, buffer + offset, 'i8*')
  offset += uncachedDecoderLen

  Module.setValue(ptr + 12, buffer + offset, 'i8*')
  offset += cachedDecoderLen

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineFireRedAsrModelConfig(
  config: NonNullable<OfflineModelConfig['fireRedAsr']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const encoderLen = Module.lengthBytesUTF8(config.encoder || '') + 1
  const decoderLen = Module.lengthBytesUTF8(config.decoder || '') + 1

  const n = encoderLen + decoderLen
  const buffer = Module._malloc(n)

  const len = 2 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(config.encoder || '', buffer + offset, encoderLen)
  offset += encoderLen

  Module.stringToUTF8(config.decoder || '', buffer + offset, decoderLen)
  offset += decoderLen

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += encoderLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')
  offset += decoderLen

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineTdnnModelConfig(
  config: NonNullable<OfflineModelConfig['tdnn']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1
  const buffer = Module._malloc(n)

  const len = 1 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)

  Module.setValue(ptr, buffer, 'i8*')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineSenseVoiceModelConfig(
  config: NonNullable<OfflineModelConfig['senseVoice']>,
  Module: SherpaOnnxModule,
): PtrConfig {
  const modelLen = Module.lengthBytesUTF8(config.model || '') + 1
  const languageLen = Module.lengthBytesUTF8(config.language || '') + 1

  const n = modelLen + languageLen
  const buffer = Module._malloc(n)

  const len = 3 * 4
  const ptr = Module._malloc(len)

  let offset = 0
  Module.stringToUTF8(config.model || '', buffer + offset, modelLen)
  offset += modelLen

  Module.stringToUTF8(config.language || '', buffer + offset, languageLen)
  offset += languageLen

  offset = 0
  Module.setValue(ptr, buffer + offset, 'i8*')
  offset += modelLen

  Module.setValue(ptr + 4, buffer + offset, 'i8*')
  offset += languageLen

  Module.setValue(
    ptr + 8,
    config.useInverseTextNormalization ?? 0,
    'i32',
  )

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineLMConfig(
  config: OfflineLMConfig,
  Module: SherpaOnnxModule,
): PtrConfig {
  const n = Module.lengthBytesUTF8(config.model || '') + 1
  const buffer = Module._malloc(n)

  const len = 2 * 4
  const ptr = Module._malloc(len)

  Module.stringToUTF8(config.model || '', buffer, n)
  Module.setValue(ptr, buffer, 'i8*')
  Module.setValue(ptr + 4, config.scale || 1, 'float')

  return { buffer, ptr, len }
}

export function initSherpaOnnxOfflineModelConfig(
  config: OfflineModelConfig,
  Module: SherpaOnnxModule,
): PtrConfig & {
  transducer: PtrConfig
  paraformer: PtrConfig
  nemoCtc: PtrConfig
  whisper: PtrConfig
  tdnn: PtrConfig
  senseVoice: PtrConfig
  moonshine: PtrConfig
  fireRedAsr: PtrConfig
  dolphin: PtrConfig
  zipformerCtc: PtrConfig
  canary: PtrConfig
  wenetCtc: PtrConfig
  omnilingual: PtrConfig
} {
  if (!config.transducer) {
    config.transducer = {
      encoder: '',
      decoder: '',
      joiner: '',
    }
  }

  if (!config.paraformer) {
    config.paraformer = {
      model: '',
    }
  }

  if (!config.nemoCtc) {
    config.nemoCtc = {
      model: '',
    }
  }

  if (!config.dolphin) {
    config.dolphin = {
      model: '',
    }
  }

  if (!config.zipformerCtc) {
    config.zipformerCtc = {
      model: '',
    }
  }

  if (!config.wenetCtc) {
    config.wenetCtc = {
      model: '',
    }
  }

  if (!config.omnilingual) {
    config.omnilingual = {
      model: '',
    }
  }

  if (!config.whisper) {
    config.whisper = {
      encoder: '',
      decoder: '',
      language: '',
      task: '',
      tailPaddings: -1,
    }
  }

  if (!config.moonshine) {
    config.moonshine = {
      preprocessor: '',
      encoder: '',
      uncachedDecoder: '',
      cachedDecoder: '',
    }
  }

  if (!config.fireRedAsr) {
    config.fireRedAsr = {
      encoder: '',
      decoder: '',
    }
  }

  if (!config.tdnn) {
    config.tdnn = {
      model: '',
    }
  }

  if (!config.senseVoice) {
    config.senseVoice = {
      model: '',
      language: '',
      useInverseTextNormalization: 0,
    }
  }

  if (!config.canary) {
    config.canary = {
      encoder: '',
      decoder: '',
      srcLang: '',
      tgtLang: '',
      usePnc: 1,
    }
  }

  const transducer = initSherpaOnnxOfflineTransducerModelConfig(
    config.transducer,
    Module,
  )

  const paraformer = initSherpaOnnxOfflineParaformerModelConfig(
    config.paraformer,
    Module,
  )

  const nemoCtc = initSherpaOnnxOfflineNemoEncDecCtcModelConfig(
    config.nemoCtc,
    Module,
  )

  const whisper = initSherpaOnnxOfflineWhisperModelConfig(
    config.whisper,
    Module,
  )

  const tdnn = initSherpaOnnxOfflineTdnnModelConfig(config.tdnn, Module)

  const senseVoice = initSherpaOnnxOfflineSenseVoiceModelConfig(
    config.senseVoice,
    Module,
  )

  const moonshine = initSherpaOnnxOfflineMoonshineModelConfig(
    config.moonshine,
    Module,
  )

  const fireRedAsr = initSherpaOnnxOfflineFireRedAsrModelConfig(
    config.fireRedAsr,
    Module,
  )

  const dolphin = initSherpaOnnxOfflineDolphinModelConfig(
    config.dolphin,
    Module,
  )

  const zipformerCtc = initSherpaOnnxOfflineZipformerCtcModelConfig(
    config.zipformerCtc,
    Module,
  )

  const canary = initSherpaOnnxOfflineCanaryModelConfig(
    config.canary,
    Module,
  )

  const wenetCtc = initSherpaOnnxOfflineWenetCtcModelConfig(
    config.wenetCtc,
    Module,
  )

  const omnilingual = initSherpaOnnxOfflineOmnilingualAsrCtcModelConfig(
    config.omnilingual,
    Module,
  )

  const len =
    transducer.len +
    paraformer.len +
    nemoCtc.len +
    whisper.len +
    tdnn.len +
    8 * 4 +
    senseVoice.len +
    moonshine.len +
    fireRedAsr.len +
    dolphin.len +
    zipformerCtc.len +
    canary.len +
    wenetCtc.len +
    omnilingual.len

  const ptr = Module._malloc(len)

  let offset = 0
  Module._CopyHeap(transducer.ptr, transducer.len, ptr + offset)
  offset += transducer.len

  Module._CopyHeap(paraformer.ptr, paraformer.len, ptr + offset)
  offset += paraformer.len

  Module._CopyHeap(nemoCtc.ptr, nemoCtc.len, ptr + offset)
  offset += nemoCtc.len

  Module._CopyHeap(whisper.ptr, whisper.len, ptr + offset)
  offset += whisper.len

  Module._CopyHeap(tdnn.ptr, tdnn.len, ptr + offset)
  offset += tdnn.len

  const tokensLen = Module.lengthBytesUTF8(config.tokens || '') + 1
  const providerLen = Module.lengthBytesUTF8(config.provider || 'cpu') + 1
  const modelTypeLen = Module.lengthBytesUTF8(config.modelType || '') + 1
  const modelingUnitLen =
    Module.lengthBytesUTF8(config.modelingUnit || '') + 1
  const bpeVocabLen = Module.lengthBytesUTF8(config.bpeVocab || '') + 1
  const teleSpeechCtcLen =
    Module.lengthBytesUTF8(config.teleSpeechCtc || '') + 1

  const bufferLen =
    tokensLen +
    providerLen +
    modelTypeLen +
    modelingUnitLen +
    bpeVocabLen +
    teleSpeechCtcLen

  const buffer = Module._malloc(bufferLen)

  offset = 0
  Module.stringToUTF8(config.tokens, buffer, tokensLen)
  offset += tokensLen

  Module.stringToUTF8(
    config.provider || 'cpu',
    buffer + offset,
    providerLen,
  )
  offset += providerLen

  Module.stringToUTF8(
    config.modelType || '',
    buffer + offset,
    modelTypeLen,
  )
  offset += modelTypeLen

  Module.stringToUTF8(
    config.modelingUnit || '',
    buffer + offset,
    modelingUnitLen,
  )
  offset += modelingUnitLen

  Module.stringToUTF8(config.bpeVocab || '', buffer + offset, bpeVocabLen)
  offset += bpeVocabLen

  Module.stringToUTF8(
    config.teleSpeechCtc || '',
    buffer + offset,
    teleSpeechCtcLen,
  )
  offset += teleSpeechCtcLen

  offset =
    transducer.len + paraformer.len + nemoCtc.len + whisper.len + tdnn.len
  Module.setValue(ptr + offset, buffer, 'i8*')
  offset += 4

  Module.setValue(ptr + offset, config.numThreads || 1, 'i32')
  offset += 4

  Module.setValue(ptr + offset, config.debug ?? 1, 'i32')
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + tokensLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + tokensLen + providerLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + tokensLen + providerLen + modelTypeLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer +
      tokensLen +
      providerLen +
      modelTypeLen +
      modelingUnitLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer +
      tokensLen +
      providerLen +
      modelTypeLen +
      modelingUnitLen +
      bpeVocabLen,
    'i8*',
  )
  offset += 4

  Module._CopyHeap(senseVoice.ptr, senseVoice.len, ptr + offset)
  offset += senseVoice.len

  Module._CopyHeap(moonshine.ptr, moonshine.len, ptr + offset)
  offset += moonshine.len

  Module._CopyHeap(fireRedAsr.ptr, fireRedAsr.len, ptr + offset)
  offset += fireRedAsr.len

  Module._CopyHeap(dolphin.ptr, dolphin.len, ptr + offset)
  offset += dolphin.len

  Module._CopyHeap(zipformerCtc.ptr, zipformerCtc.len, ptr + offset)
  offset += zipformerCtc.len

  Module._CopyHeap(canary.ptr, canary.len, ptr + offset)
  offset += canary.len

  Module._CopyHeap(wenetCtc.ptr, wenetCtc.len, ptr + offset)
  offset += wenetCtc.len

  Module._CopyHeap(omnilingual.ptr, omnilingual.len, ptr + offset)
  offset += omnilingual.len

  return {
    buffer,
    ptr,
    len,
    transducer,
    paraformer,
    nemoCtc,
    whisper,
    tdnn,
    senseVoice,
    moonshine,
    fireRedAsr,
    dolphin,
    zipformerCtc,
    canary,
    wenetCtc,
    omnilingual,
  }
}

export function initSherpaOnnxOfflineRecognizerConfig(
  config: OfflineRecognizerConfig,
  Module: SherpaOnnxModule,
): PtrConfig & {
  feat: PtrConfig
  model: ReturnType<typeof initSherpaOnnxOfflineModelConfig>
  lm: PtrConfig
  hr: PtrConfig
} {
  if (!config.featConfig) {
    config.featConfig = {
      sampleRate: 16000,
      featureDim: 80,
    }
  }

  if (!config.lmConfig) {
    config.lmConfig = {
      model: '',
      scale: 1.0,
    }
  }

  if (!config.hr) {
    config.hr = {
      lexicon: '',
      ruleFsts: '',
    }
  }

  const feat = initSherpaOnnxFeatureConfig(config.featConfig, Module)
  const model = initSherpaOnnxOfflineModelConfig(config.modelConfig, Module)
  const lm = initSherpaOnnxOfflineLMConfig(config.lmConfig, Module)
  const hr = initSherpaOnnxHomophoneReplacerConfig(config.hr, Module)

  const len = feat.len + model.len + lm.len + 7 * 4 + hr.len
  const ptr = Module._malloc(len)

  let offset = 0
  Module._CopyHeap(feat.ptr, feat.len, ptr + offset)
  offset += feat.len

  Module._CopyHeap(model.ptr, model.len, ptr + offset)
  offset += model.len

  Module._CopyHeap(lm.ptr, lm.len, ptr + offset)
  offset += lm.len

  const decodingMethodLen =
    Module.lengthBytesUTF8(config.decodingMethod || 'greedy_search') + 1
  const hotwordsFileLen =
    Module.lengthBytesUTF8(config.hotwordsFile || '') + 1
  const ruleFstsLen =
    Module.lengthBytesUTF8(config.ruleFsts || '') + 1
  const ruleFarsLen =
    Module.lengthBytesUTF8(config.ruleFars || '') + 1
  const bufferLen =
    decodingMethodLen +
    hotwordsFileLen +
    ruleFstsLen +
    ruleFarsLen
  const buffer = Module._malloc(bufferLen)

  offset = 0
  Module.stringToUTF8(
    config.decodingMethod || 'greedy_search',
    buffer,
    decodingMethodLen,
  )
  offset += decodingMethodLen

  Module.stringToUTF8(
    config.hotwordsFile || '',
    buffer + offset,
    hotwordsFileLen,
  )
  offset += hotwordsFileLen

  Module.stringToUTF8(
    config.ruleFsts || '',
    buffer + offset,
    ruleFstsLen,
  )
  offset += ruleFstsLen

  Module.stringToUTF8(
    config.ruleFars || '',
    buffer + offset,
    ruleFarsLen,
  )
  offset += ruleFarsLen

  offset = feat.len + model.len + lm.len

  Module.setValue(ptr + offset, buffer, 'i8*')
  offset += 4

  Module.setValue(ptr + offset, config.maxActivePaths || 4, 'i32')
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + decodingMethodLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    config.hotwordsScore || 1.5,
    'float',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + decodingMethodLen + hotwordsFileLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    buffer + decodingMethodLen + hotwordsFileLen + ruleFstsLen,
    'i8*',
  )
  offset += 4

  Module.setValue(
    ptr + offset,
    config.blankPenalty || 0,
    'float',
  )
  offset += 4

  Module._CopyHeap(hr.ptr, hr.len, ptr + offset)
  offset += hr.len

  return {
    buffer,
    ptr,
    len,
    feat,
    model,
    lm,
    hr,
  }
}


