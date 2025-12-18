export type RecorderCallbacks = {
  /**
   * 每次从麦克风获取到一段音频数据时回调
   */
  onSamples: (samples: Float32Array, sampleRate: number) => void
  /**
   * 发生错误时回调
   */
  onError?: (error: unknown) => void
}

/**
 * 基于 Web Audio API 的简单麦克风录音器
 * - 内部完成 getUserMedia / AudioContext 初始化
 * - 自动降采样到 16k Hz，方便直接送入 sherpa 识别器
 */
export class MicrophoneRecorder {
  private audioCtx: AudioContext | null = null
  private mediaStream: MediaStreamAudioSourceNode | null = null
  private scriptNode: ScriptProcessorNode | null = null
  private recordSampleRate = 16000

  private readonly callbacks: RecorderCallbacks

  constructor(callbacks: RecorderCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * 初始化音频上下文和麦克风流
   * - 不会开始推流，需调用 start() 才会真正录音
   */
  async init() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('当前浏览器不支持 getUserMedia')
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    if (!this.audioCtx) {
      this.audioCtx = new AudioContext({ sampleRate: 16000 })
    }

    this.recordSampleRate = this.audioCtx.sampleRate
    this.mediaStream = this.audioCtx.createMediaStreamSource(stream)

    const bufferSize = 4096
    const numberOfInputChannels = 1
    const numberOfOutputChannels = 1
    const ctx = this.audioCtx

    const node: ScriptProcessorNode =
      // createScriptProcessor 在部分浏览器上已废弃，这里保持向后兼容
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).createScriptProcessor
        ? ctx.createScriptProcessor(
            bufferSize,
            numberOfInputChannels,
            numberOfOutputChannels,
          )
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ctx as any).createJavaScriptNode(
            bufferSize,
            numberOfInputChannels,
            numberOfOutputChannels,
          )

    this.scriptNode = node

    node.onaudioprocess = (e: AudioProcessingEvent) => {
      try {
        const input = e.inputBuffer.getChannelData(0)
        const src = new Float32Array(input)
        const samples = downsampleBuffer(
          src,
          this.recordSampleRate,
          16000,
        )
        this.callbacks.onSamples(samples, 16000)
      } catch (err) {
        if (this.callbacks.onError) {
          this.callbacks.onError(err)
        }
      }
    }
  }

  /**
   * 开始把麦克风音频推入处理回调
   */
  start() {
    if (!this.mediaStream || !this.scriptNode || !this.audioCtx) {
      throw new Error('Recorder 尚未初始化，请先调用 init()')
    }
    this.mediaStream.connect(this.scriptNode)
    this.scriptNode.connect(this.audioCtx.destination)
  }

  /**
   * 停止推流，不会关闭麦克风权限
   */
  stop() {
    if (this.scriptNode && this.audioCtx && this.mediaStream) {
      this.scriptNode.disconnect(this.audioCtx.destination)
      this.mediaStream.disconnect(this.scriptNode)
    }
  }
}

function downsampleBuffer(
  buffer: Float32Array,
  recordSampleRate: number,
  exportSampleRate: number,
): Float32Array {
  if (exportSampleRate === recordSampleRate) {
    return buffer
  }

  const sampleRateRatio = recordSampleRate / exportSampleRate
  const newLength = Math.round(buffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)

  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]
      count++
    }
    result[offsetResult] = accum / count
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }

  return result
}


