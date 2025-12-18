import { createStreamingRecognizer } from './recognizer'
import { MicrophoneRecorder } from './recorder'

const startBtn = document.getElementById('startBtn') as HTMLButtonElement
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement
const soundClips = document.getElementById('sound-clips') as HTMLElement
const resultsTextarea = document.getElementById('results') as HTMLTextAreaElement

if (!startBtn || !stopBtn || !clearBtn || !soundClips || !resultsTextarea) {
  throw new Error('缺少必要的 DOM 元素，无法初始化 app-modern')
}

let lastResult = ''
let resultList: string[] = []

function getDisplayResult() {
  let i = 0
  let ans = ''
  for (const s of resultList) {
    if (s === '') {
      continue
    }
    ans += `${i}: ${s}\n`
    i += 1
  }

  if (lastResult.length > 0) {
    ans += `${i}: ${lastResult}\n`
  }

  return ans
}

let leftchannel: Int16Array[] = []

let recognizerReady = false

const recorder = new MicrophoneRecorder({
  onSamples: (samples, sampleRate) => {
    if (!recognizerReady || !streaming) {
      return
    }

    if (!streamingRecognizer) {
      return
    }

    const update = streamingRecognizer.pushSamples(samples, sampleRate)
    lastResult = update.partialText
    resultList = update.finalTexts

    resultsTextarea.value = getDisplayResult()
    resultsTextarea.scrollTop = resultsTextarea.scrollHeight

    const buf = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) {
      let s = samples[i]
      if (s >= 1) {
        s = 1
      } else if (s <= -1) {
        s = -1
      }
      // 与官方代码保持一致：虽然修改后 samples 未被使用，但保持行为一致
      samples[i] = s
      buf[i] = s * 32767
    }

    leftchannel.push(buf)
  },
  onError: (err) => {
    // 简单打印错误，避免吞掉异常
    // eslint-disable-next-line no-console
    console.error('Recorder error', err)
  },
})

let streamingRecognizer:
  | Awaited<ReturnType<typeof createStreamingRecognizer>>
  | null = null
let streaming = false

async function main() {
  startBtn.disabled = true
  stopBtn.disabled = true

  const statusElement = document.getElementById('status')
  if (statusElement) {
    statusElement.textContent = 'Loading (modern runtime)...'
  }

  streamingRecognizer = await createStreamingRecognizer()
  recognizerReady = true

  await recorder.init()

  startBtn.disabled = false

  if (statusElement) {
    statusElement.textContent = ''
  }

  clearBtn.onclick = () => {
    resultList = []
    // 注意：官方代码不清空 lastResult，保持行为一致
    resultsTextarea.value = getDisplayResult()
    resultsTextarea.scrollTop = resultsTextarea.scrollHeight
  }

  startBtn.onclick = () => {
    if (!recognizerReady) {
      return
    }
    streaming = true
    leftchannel = []

    recorder.start()

    stopBtn.disabled = false
    startBtn.disabled = true
  }

  stopBtn.onclick = () => {
    streaming = false

    recorder.stop()

    stopBtn.disabled = true
    startBtn.disabled = false

    createAudioClip()
  }
}

function createAudioClip() {
  if (!leftchannel.length) {
    return
  }

  const clipName = new Date().toISOString()

  const clipContainer = document.createElement('article')
  const clipLabel = document.createElement('p')
  const audio = document.createElement('audio')
  const deleteButton = document.createElement('button')

  clipContainer.classList.add('clip')
  audio.setAttribute('controls', '')
  deleteButton.textContent = 'Delete'
  deleteButton.className = 'delete'

  clipLabel.textContent = clipName

  clipContainer.appendChild(audio)
  clipContainer.appendChild(clipLabel)
  clipContainer.appendChild(deleteButton)
  soundClips.appendChild(clipContainer)

  audio.controls = true
  const samples = flatten(leftchannel)
  const blob = toWav(samples, 16000)

  leftchannel = []
  const audioURL = window.URL.createObjectURL(blob)
  audio.src = audioURL

  deleteButton.onclick = (e) => {
    const target = e.target as HTMLElement
    const parent = target.parentNode
    if (parent && parent.parentNode) {
      parent.parentNode.removeChild(parent)
    }
  }

  clipLabel.onclick = () => {
    const existingName = clipLabel.textContent ?? ''
    const newClipName = window.prompt(
      'Enter a new name for your sound clip?',
      existingName,
    )
    if (newClipName === null) {
      clipLabel.textContent = existingName
    } else {
      clipLabel.textContent = newClipName
    }
  }
}

function flatten(listOfSamples: Int16Array[]) {
  let n = 0
  for (let i = 0; i < listOfSamples.length; i++) {
    n += listOfSamples[i].length
  }

  const ans = new Int16Array(n)

  let offset = 0
  for (let i = 0; i < listOfSamples.length; i++) {
    ans.set(listOfSamples[i], offset)
    offset += listOfSamples[i].length
  }

  return ans
}

function toWav(samples: Int16Array, sampleRate: number) {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buf)

  // http://soundfile.sapp.org/doc/WaveFormat/
  view.setUint32(0, 0x46464952, true)
  view.setUint32(4, 36 + samples.length * 2, true)
  view.setUint32(8, 0x45564157, true)

  view.setUint32(12, 0x20746d66, true)
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  view.setUint32(36, 0x61746164, true)
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true)
    offset += 2
  }

  return new Blob([view], { type: 'audio/wav' })
}

void main()


