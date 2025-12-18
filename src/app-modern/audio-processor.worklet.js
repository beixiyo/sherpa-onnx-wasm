/**
 * AudioWorklet 处理器，用于实时处理音频数据
 * 替代已弃用的 ScriptProcessorNode
 */
class AudioProcessorWorklet extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.sampleRate = 16000
    this.targetSampleRate = 16000
    if (options.processorOptions) {
      this.sampleRate = options.processorOptions.sampleRate || 16000
      this.targetSampleRate = options.processorOptions.targetSampleRate || 16000
    }
    this.port.onmessage = (e) => {
      if (e.data.type === 'config') {
        this.sampleRate = e.data.sampleRate || 16000
        this.targetSampleRate = e.data.targetSampleRate || 16000
      }
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (input && input.length > 0) {
      const inputChannel = input[0]
      if (inputChannel && inputChannel.length > 0) {
        // 降采样处理
        const downsampled = this.downsample(
          inputChannel,
          this.sampleRate,
          this.targetSampleRate,
        )
        // 发送处理后的数据到主线程
        this.port.postMessage({
          type: 'audio',
          samples: downsampled,
          sampleRate: this.targetSampleRate,
        })
      }
    }
    // 输出静音（因为我们只需要处理输入）
    if (outputs[0] && outputs[0].length > 0) {
      outputs[0][0].fill(0)
      if (outputs[0].length > 1) {
        outputs[0][1].fill(0)
      }
    }
    return true
  }

  downsample(buffer, recordSampleRate, exportSampleRate) {
    if (exportSampleRate === recordSampleRate) {
      return buffer
    }

    const sampleRateRatio = recordSampleRate / exportSampleRate
    const newLength = Math.round(buffer.length / sampleRateRatio)
    const result = new Float32Array(newLength)

    let offsetResult = 0
    let offsetBuffer = 0
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round(
        (offsetResult + 1) * sampleRateRatio,
      )
      let accum = 0
      let count = 0
      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i]
        count++
      }
      result[offsetResult] = accum / count
      offsetResult++
      offsetBuffer = nextOffsetBuffer
    }

    return result
  }
}

registerProcessor('audio-processor', AudioProcessorWorklet)

