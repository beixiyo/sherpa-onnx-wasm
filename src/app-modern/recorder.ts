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
  private workletNode: AudioWorkletNode | null = null
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

    // 使用 AudioWorklet 替代已弃用的 createScriptProcessor
    try {
      // 加载 AudioWorklet 处理器
      // 在 Vite 中，worklet 文件需要作为 URL 导入
      const workletModule = await import(
        './audio-processor.worklet.js?url'
      )
      const workletUrl =
        typeof workletModule === 'string'
          ? workletModule
          : (workletModule.default as string)
      await this.audioCtx.audioWorklet.addModule(workletUrl)

      // 创建 AudioWorkletNode
      this.workletNode = new AudioWorkletNode(this.audioCtx, 'audio-processor', {
        processorOptions: {
          sampleRate: this.recordSampleRate,
          targetSampleRate: 16000,
        },
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
      })

      // 监听来自 worklet 的消息
      this.workletNode.port.onmessage = (e) => {
        if (e.data.type === 'audio') {
          try {
            this.callbacks.onSamples(e.data.samples, e.data.sampleRate)
          } catch (err) {
            if (this.callbacks.onError) {
              this.callbacks.onError(err)
            }
          }
        }
      }
    } catch (err) {
      // 如果 AudioWorklet 不支持，回退到 ScriptProcessorNode（已弃用但可用）
      if (this.callbacks.onError) {
        this.callbacks.onError(
          new Error(
            'AudioWorklet 不支持，请使用现代浏览器。错误: ' +
              (err instanceof Error ? err.message : String(err)),
          ),
        )
      }
      throw err
    }
  }

  /**
   * 开始把麦克风音频推入处理回调
   */
  start() {
    if (!this.mediaStream || !this.workletNode || !this.audioCtx) {
      throw new Error('Recorder 尚未初始化，请先调用 init()')
    }
    this.mediaStream.connect(this.workletNode)
    // 连接到 destination 以保持音频图活跃（输出静音）
    this.workletNode.connect(this.audioCtx.destination)
  }

  /**
   * 停止推流，不会关闭麦克风权限
   */
  stop() {
    if (this.workletNode && this.audioCtx && this.mediaStream) {
      this.workletNode.disconnect(this.audioCtx.destination)
      this.mediaStream.disconnect(this.workletNode)
    }
  }
}

