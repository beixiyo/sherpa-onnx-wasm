# Sherpa-ONNX Wasm

- **完整 Wasm 资源文件下载** https://www.123865.com/s/fthDVv-PshAh?pwd=FhTK#

- 基于 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20.tar.bz2 编译的 wasm 示例
- 详见 https://k2-fsa.github.io/sherpa/onnx/wasm/install-emscripten.html

---

## 现代化模块化架构

在保留官方示例文件的前提下，项目新增了一套模块化的 TypeScript 封装，方便逐步迁移到「像正常 npm 包一样使用」的方式

### 目录结构

```
src/
├── sherpa-wasm-loader/         # wasm loader 模块
│   ├── loader.ts               # 核心加载逻辑：动态加载官方 wasm、配置 Module、IndexedDB 缓存
│   ├── types.ts                # 类型定义：WasmLoaderOptions、WasmLoaderInitResult
│   └── index.ts                # 统一导出
│
├── sherpa-onnx-asr-ts/         # TypeScript 类型和 API 封装
│   ├── types.ts                # 所有类型定义（SherpaOnnxModule、OnlineRecognizerConfig 等）
│   ├── config.ts               # 配置结构转换逻辑
│   ├── online.ts               # OnlineRecognizer、OnlineStream 类
│   ├── offline.ts              # OfflineRecognizer、OfflineStream 类
│   └── index.ts                # 统一导出
│
└── app-modern/                 # 现代化应用入口
    ├── recognizer.ts           # 高层流式识别封装（createStreamingRecognizer）
    ├── recorder.ts             # 麦克风录音封装（MicrophoneRecorder）
    └── index.ts                # 应用入口，组合所有模块
```

### 模块职责说明

| 模块 | 职责 | 何时调用 |
|------|------|---------|
| **`sherpa-wasm-loader`** | 负责加载官方生成的 wasm 文件，配置 Module，提供 IndexedDB 缓存 | 应用启动时调用一次 `initWasmLoader()` |
| **`sherpa-onnx-asr-ts`** | 提供完整的 TypeScript 类型和 API 封装（OnlineRecognizer、OnlineStream 等） | 创建识别器时使用 |
| **`app-modern/recognizer`** | 高层封装，管理流式识别的生命周期（pushSamples、endpoint、reset） | 需要流式识别功能时调用 `createStreamingRecognizer()` |
| **`app-modern/recorder`** | 封装浏览器录音 API，提供音频数据回调 | 需要录音功能时使用 `MicrophoneRecorder` |
| **`app-modern/index`** | 应用入口，组合所有模块，处理 UI 交互 | 页面加载时执行 |

### 调用流程图

```
页面加载 (index.html)
  │
  └─> app-modern/index.ts (main 函数)
        │
        ├─> createStreamingRecognizer()
        │     │
        │     └─> initWasmLoader()  ←─ sherpa-wasm-loader/loader.ts
        │           │
        │           ├─> patchFetchOnce()  ←─ 拦截 .wasm/.data 请求，做 IndexedDB 缓存
        │           │
        │           ├─> 创建 Module 对象，配置 locateFile / setStatus
        │           │
        │           ├─> loadScript('sherpa-onnx-wasm-main-asr.js')  ←─ 动态加载官方 loader
        │           │
        │           └─> 等待 Module.onRuntimeInitialized()
        │                 │
        │                 └─> 返回 { Module }
        │
        ├─> createOnlineRecognizer(Module, config?)  ←─ sherpa-onnx-asr-ts/online.ts
        │     │
        │     └─> 返回 OnlineRecognizer 实例
        │
        └─> new MicrophoneRecorder()  ←─ app-modern/recorder.ts
              │
              ├─> recorder.init()  ←─ 申请 getUserMedia，初始化 AudioContext
              │
              └─> recorder.start()  ←─ 开始录音，回调 onSamples
                    │
                    └─> streamingRecognizer.pushSamples(samples, sampleRate)
                          │
                          └─> 返回 { partialText, finalTexts }
```

### 关键 API 说明

#### 1. `initWasmLoader(options?)`

**职责：** 初始化 wasm loader，动态加载官方生成的 `sherpa-onnx-wasm-main-asr.js`

**调用时机：** 应用启动时调用一次（内部会缓存 Promise，多次调用返回同一个实例）

**参数：**
```ts
type WasmLoaderOptions = {
  cacheWasm?: boolean      // 是否缓存到 IndexedDB，默认 true
  cachePrefix?: string     // 缓存 key 前缀，默认 'sherpa-wasm:'
  wasmScriptUrl?: string   // wasm loader 脚本路径，默认 'sherpa-onnx-wasm-main-asr.js'
}
```

**返回：**
```ts
type WasmLoaderInitResult = {
  Module: SherpaOnnxModule  // 初始化完成的 Module 对象
}
```

**示例：**
```ts
import { initWasmLoader } from './sherpa-wasm-loader'

const { Module } = await initWasmLoader({
  cacheWasm: true,
  cachePrefix: 'sherpa-v1:',
  wasmScriptUrl: 'sherpa-onnx-wasm-main-asr.js',  // 自定义 wasm loader 脚本路径
})
```

[自定义文件路径详见](#3-文件加载方式)

#### 2. `createStreamingRecognizer(options?)`

**职责：** 创建高层流式识别器，封装 `OnlineRecognizer` + `OnlineStream` 的生命周期管理

**调用时机：** 需要开始识别时调用

**参数：**
```ts
type StreamingRecognizerOptions = {
  loader?: WasmLoaderOptions        // wasm loader 配置
  config?: OnlineRecognizerConfig   // 识别器配置（可选，不传用默认）
}
```

**返回：**
```ts
type StreamingRecognizer = {
  recognizer: OnlineRecognizer
  pushSamples(samples: Float32Array, sampleRate: number): StreamingRecognizerUpdate
  reset(): void
}
```

**示例：**
```ts
import { createStreamingRecognizer } from './app-modern/recognizer'

const streaming = await createStreamingRecognizer({
  loader: { cacheWasm: true },
  config: { /* 可选的自定义配置 */ },
})

const update = streaming.pushSamples(samples, 16000)
console.log(update.partialText)    // 当前增量结果
console.log(update.finalTexts)     // 已确认的完整句子列表
```

### 使用方法

在 TypeScript 项目中使用：

```typescript
// 导入类型
import type { 
  OnlineRecognizer, 
  OnlineStream, 
  OnlineRecognizerConfig,
  createOnlineRecognizer 
} from './sherpa-onnx-asr';

// 或者直接使用全局类型（浏览器环境）
declare const Module: SherpaOnnxModule;

Module.onRuntimeInitialized = function() {
  const recognizer = createOnlineRecognizer(Module);
  const stream = recognizer.createStream();
  
  // 现在有完整的类型提示和自动补全
  stream.acceptWaveform(16000, audioSamples);
  
  if (recognizer.isReady(stream)) {
    recognizer.decode(stream);
    const result = recognizer.getResult(stream);
    console.log(result.text); // TypeScript 知道 result 有 text 属性
  }
};
```

## 文件路径配置规则

### 文件加载机制说明

#### 1. `locateFile` 的调用者

`Module.locateFile` 由 **Emscripten 生成的 `sherpa-onnx-wasm-main-asr.js`** 内部调用：

- **加载 `.wasm` 文件时**：Emscripten 调用 `locateFile("sherpa-onnx-wasm-main-asr.wasm")`
- **加载 `.data` 文件时**：Emscripten 调用 `Module["locateFile"]("sherpa-onnx-wasm-main-asr.data", "")`

**调用链：**
```
sherpa-onnx-wasm-main-asr.js (Emscripten 生成)
  └─> 内部 locateFile() 函数
        └─> Module["locateFile"](path, scriptDirectory)  ← 你定义的函数
```

#### 2. `locateFile` 参数说明

```ts
Module.locateFile = (path: string, scriptDirectory: string = '') => string
```

- **`path`**：文件名（如 `"sherpa-onnx-wasm-main-asr.wasm"`），**总是会被传递**
- **`scriptDirectory`**：wasm loader 脚本所在目录，默认空字符串
- **返回值**：完整的文件 URL 路径

#### 3. 文件加载方式

| 文件类型 | 加载方式 | 说明 |
|---------|---------|------|
| **wasm loader JS** | `<script>` 标签 | 原始 JS：HTML 中硬编码；TS 版本：动态创建 script 标签 |
| **.wasm 文件** | `fetch` / `XMLHttpRequest` | 二进制文件，不能用 script 标签 |
| **.data 文件** | `XMLHttpRequest` | 二进制数据文件，不能用 script 标签 |

### 自定义文件路径

#### 方式1：原始 JS 代码（`app-asr.js`）

```javascript
Module = {};

// 自定义 .wasm 和 .data 文件路径
Module.locateFile = function(path, scriptDirectory = '') {
  if (path.endsWith('.wasm')) {
    return '/custom/path/sherpa-onnx-wasm-main-asr.wasm';
  }
  if (path.endsWith('.data')) {
    return '/custom/path/sherpa-onnx-wasm-main-asr.data';
  }
  // 其他文件使用默认路径
  return scriptDirectory + path;
};
```

#### 方式2：TS 代码（`src/sherpa-wasm-loader/loader.ts`）

```typescript
import { initWasmLoader } from './sherpa-wasm-loader'

// 情况A：所有文件在同一目录（只需配置 wasmScriptUrl）
const { Module } = await initWasmLoader({
  wasmScriptUrl: '/custom/path/sherpa-onnx-wasm-main-asr.js',
  // .wasm 和 .data 会自动在 /custom/path/ 目录查找，无需配置 locateFile
})

// 情况B：.wasm 和 .data 文件在不同目录（需要额外配置 locateFile）
const { Module } = await initWasmLoader({
  wasmScriptUrl: '/custom/path/sherpa-onnx-wasm-main-asr.js',
})

// 必须在 initWasmLoader 之后立即配置 locateFile
Module.locateFile = (path: string, scriptDirectory: string = '') => {
  if (path.endsWith('.wasm')) {
    return '/other/path/sherpa-onnx-wasm-main-asr.wasm'  // 自定义 .wasm 路径
  }
  if (path.endsWith('.data')) {
    return '/other/path/sherpa-onnx-wasm-main-asr.data'  // 自定义 .data 路径
  }
  return scriptDirectory + path  // 其他文件使用默认路径
}
```

## 注意事项

- 所有处理都在浏览器本地完成，无需服务器
- 需要浏览器支持 WebAssembly 和 Web Audio API
- 首次加载需要下载WASM和数据文件（约190MB）
- 模型文件通过虚拟文件系统（MEMFS）访问
- **路径配置必须在 `sherpa-onnx-wasm-main-asr.js` 加载之前完成**（原始 JS）或在 `initWasmLoader` 之后立即配置（TS 版本）

---

## 原始 ASR 项目文件说明

本文档简要说明项目中每个文件的作用和依赖关系

```bash
1. sherpa-onnx-asr.js 加载
   └─> 定义函数和类（不创建 Module）

2. app-asr.js 加载
   └─> Module = {}  ← 创建全局 Module
   └─> 配置 Module.locateFile、Module.setStatus 等

3. sherpa-onnx-wasm-main-asr.js 加载
   └─> 检查 typeof Module != "undefined"  ← 发现 Module 已存在
   └─> 使用已存在的 Module（不会覆盖）
   └─> 初始化 WASM，调用 Module.onRuntimeInitialized()
```

## 文件列表

### 1. `index.html`
**作用：** 应用入口文件，提供用户界面和页面结构

**主要功能：**
- 定义页面UI（按钮、文本区域等）
- 按顺序加载JavaScript文件
- 显示识别状态和结果

**依赖：**
- `sherpa-onnx-asr.js`
- `app-asr.js`
- `sherpa-onnx-wasm-main-asr.js`

---

### 2. `app-asr.js`
**作用：** 应用主逻辑文件，处理音频录制和语音识别

**主要功能：**
- 初始化音频上下文和麦克风输入
- 处理音频数据采集和降采样
- 创建和管理识别器实例
- 处理UI交互（开始/停止/清除按钮）
- 实时显示识别结果
- 音频录制和WAV文件生成

**依赖：**
- `sherpa-onnx-asr.js`（使用 `createOnlineRecognizer` 函数）
- `sherpa-onnx-wasm-main-asr.js`（通过 `Module` 对象访问WASM功能）

**关键函数：**
- `createOnlineRecognizer()` - 创建在线识别器
- `downsampleBuffer()` - 音频降采样
- `toWav()` - 生成WAV文件

---

### 3. `sherpa-onnx-asr.js`
**作用：** sherpa-onnx 的 JavaScript 包装库，提供高级API接口

**主要功能：**
- 封装WASM底层调用
- 提供 `OnlineRecognizer` 和 `OfflineRecognizer` 类
- 提供配置初始化函数（`initSherpaOnnxOnlineRecognizerConfig` 等）
- 内存管理和配置释放

**依赖：**
- `sherpa-onnx-wasm-main-asr.js`（通过 `Module` 对象调用WASM函数）

**关键类：**
- `OnlineRecognizer` - 在线语音识别器
- `OnlineStream` - 在线识别流
- `OfflineRecognizer` - 离线语音识别器
- `OfflineStream` - 离线识别流

**类型定义：**
- `sherpa-onnx-asr.d.ts` - TypeScript 类型定义文件，提供完整的API类型提示

---

### 4. `sherpa-onnx-wasm-main-asr.js`
**作用：** Emscripten 编译的 WASM 加载器和运行时

**主要功能：**
- 加载和初始化 WebAssembly 模块
- 加载数据文件（`.data` 文件，包含模型文件）
- 提供 `Module` 对象，暴露WASM函数给JavaScript
- 文件系统模拟（MEMFS）
- 提供底层C函数接口（如 `_SherpaOnnxCreateOnlineRecognizer`）

**依赖：**
- `sherpa-onnx-wasm-main-asr.wasm`（WebAssembly二进制文件）
- `sherpa-onnx-wasm-main-asr.data`（数据文件，包含模型：encoder.onnx, decoder.onnx, joiner.onnx, tokens.txt）

**关键导出：**
- `Module` 对象
- WASM函数（如 `_SherpaOnnxCreateOnlineRecognizer`）

---

### 5. `sherpa-onnx-wasm-main-asr.wasm`
**作用：** WebAssembly 二进制文件，包含编译后的 sherpa-onnx 核心代码

**主要功能：**
- 执行语音识别算法
- 运行ONNX模型推理
- 处理音频特征提取和识别

**依赖：** 无（由浏览器直接加载）

---

### 6. `sherpa-onnx-wasm-main-asr.data`
**作用：** 数据文件，包含预加载的模型文件

**包含内容：**
- `encoder.onnx` - 编码器模型
- `decoder.onnx` - 解码器模型
- `joiner.onnx` - 连接器模型
- `tokens.txt` - 词汇表文件

**依赖：** 无（由 `sherpa-onnx-wasm-main-asr.js` 加载）

---

## 依赖关系图

```
index.html
  ├── sherpa-onnx-asr.js
  │     └── sherpa-onnx-wasm-main-asr.js
  │           ├── sherpa-onnx-wasm-main-asr.wasm
  │           └── sherpa-onnx-wasm-main-asr.data
  │
  ├── app-asr.js
  │     ├── sherpa-onnx-asr.js (使用 createOnlineRecognizer)
  │     └── sherpa-onnx-wasm-main-asr.js (使用 Module)
  │
  └── sherpa-onnx-wasm-main-asr.js
        ├── sherpa-onnx-wasm-main-asr.wasm
        └── sherpa-onnx-wasm-main-asr.data
```

## 执行流程

1. **页面加载** (`index.html`)
   - 浏览器加载HTML并解析

2. **脚本加载顺序**（按HTML中的顺序）：
   - `sherpa-onnx-asr.js` - 定义API类
   - `app-asr.js` - 定义应用逻辑
   - `sherpa-onnx-wasm-main-asr.js` - 加载WASM和数据文件

3. **初始化过程**：
   - WASM模块加载并初始化
   - 数据文件（模型）加载到虚拟文件系统
   - `Module.onRuntimeInitialized` 回调触发
   - `app-asr.js` 创建识别器实例

4. **运行时**：
   - 用户点击"Start"按钮
   - 开始采集麦克风音频
   - 音频数据实时发送到识别器
   - 识别结果实时显示在文本区域

