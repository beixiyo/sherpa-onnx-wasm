import { createFileRecognizer } from './file-recognizer'

const fileInput = document.getElementById(
  'fileInput',
) as HTMLInputElement | null
const recognizeBtn = document.getElementById(
  'recognizeBtn',
) as HTMLButtonElement | null
const fileResultTextarea = document.getElementById(
  'fileResult',
) as HTMLTextAreaElement | null
const fileStatus = document.getElementById('fileStatus') as HTMLElement | null

if (!fileInput || !recognizeBtn || !fileResultTextarea || !fileStatus) {
  throw new Error('缺少必要的 DOM 元素，无法初始化文件识别功能')
}

let fileRecognizer: Awaited<ReturnType<typeof createFileRecognizer>> | null =
  null
let recognizerReady = false

/**
 * 将音频文件转换为 AudioBuffer
 */
async function fileToAudioBuffer(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext({ sampleRate: 16000 })
  return await audioContext.decodeAudioData(arrayBuffer)
}

/**
 * 重采样音频数据到目标采样率
 */
function resampleAudioBuffer(
  audioBuffer: AudioBuffer,
  targetSampleRate: number,
): Float32Array {
  const sourceSampleRate = audioBuffer.sampleRate
  if (sourceSampleRate === targetSampleRate) {
    return audioBuffer.getChannelData(0)
  }

  const ratio = sourceSampleRate / targetSampleRate
  const sourceData = audioBuffer.getChannelData(0)
  const targetLength = Math.round(sourceData.length / ratio)
  const targetData = new Float32Array(targetLength)

  for (let i = 0; i < targetLength; i++) {
    const sourceIndex = i * ratio
    const sourceIndexFloor = Math.floor(sourceIndex)
    const sourceIndexCeil = Math.min(
      sourceIndexFloor + 1,
      sourceData.length - 1,
    )
    const t = sourceIndex - sourceIndexFloor

    // 线性插值
    targetData[i] =
      sourceData[sourceIndexFloor] * (1 - t) +
      sourceData[sourceIndexCeil] * t
  }

  return targetData
}

async function main() {
  if (!recognizeBtn || !fileInput) {
    return
  }

  recognizeBtn.disabled = true
  fileInput.disabled = true

  if (fileStatus) {
    fileStatus.textContent = '正在加载识别器...'
  }

  try {
    // 等待一下，确保实时识别已经初始化完成（如果它也在初始化）
    // 这样可以复用同一个 Module 实例
    await new Promise((resolve) => setTimeout(resolve, 100))

    fileRecognizer = await createFileRecognizer({
      loader: {
        wasmScriptUrl: '/sherpa-onnx-wasm-main-asr.js',
      },
    })
    recognizerReady = true

    recognizeBtn.disabled = false
    fileInput.disabled = false

    if (fileStatus) {
      fileStatus.textContent = '识别器已就绪，请选择音频文件'
    }
  } catch (error) {
    console.error('初始化识别器失败:', error)
    console.error('错误详情:', error)

    // 检查是否是函数不存在的问题
    if (error instanceof Error && error.message.includes('not a function')) {
      if (fileStatus) {
        fileStatus.textContent = 'WASM 文件可能不支持离线识别功能。请检查 WASM 文件是否包含离线识别函数。'
      }
    } else {
      if (fileStatus) {
        fileStatus.textContent = `初始化失败: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}

fileInput.addEventListener('change', async (e) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  if (!recognizerReady || !fileRecognizer) {
    if (fileStatus) {
      fileStatus.textContent = '识别器尚未就绪，请稍候...'
    }
    return
  }

  // 检查文件类型
  if (!file.type.startsWith('audio/')) {
    if (fileStatus) {
      fileStatus.textContent = '请选择音频文件'
    }
    return
  }

  recognizeBtn.disabled = true
  fileInput.disabled = true

  if (fileStatus) {
    fileStatus.textContent = '正在处理音频文件...'
  }

  try {
    // 读取并解码音频文件
    const audioBuffer = await fileToAudioBuffer(file)

    if (fileStatus) {
      fileStatus.textContent = '正在识别中...'
    }

    // 重采样到 16000 Hz（如果需要）
    const samples = resampleAudioBuffer(audioBuffer, 16000)

    // 识别
    const result = fileRecognizer.recognizeSamples(samples, 16000)

    // 显示结果
    fileResultTextarea.value = result || '(未识别到文本)'

    if (fileStatus) {
      fileStatus.textContent = `识别完成 (文件: ${file.name}, 时长: ${audioBuffer.duration.toFixed(2)}秒)`
    }
  } catch (error) {
    console.error('识别失败:', error)
    if (fileStatus) {
      fileStatus.textContent = `识别失败: ${error instanceof Error ? error.message : String(error)}`
    }
    fileResultTextarea.value = ''
  } finally {
    recognizeBtn.disabled = false
    fileInput.disabled = false
  }
})

recognizeBtn.addEventListener('click', async () => {
  const file = fileInput.files?.[0]

  if (!file) {
    if (fileStatus) {
      fileStatus.textContent = '请先选择音频文件'
    }
    return
  }

  // 触发 change 事件处理逻辑
  fileInput.dispatchEvent(new Event('change'))
})

void main()

