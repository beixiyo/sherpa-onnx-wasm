# Sherpa-ONNX Wasm

**完整 Wasm 资源文件** https://www.123865.com/s/fthDVv-PshAh?pwd=FhTK#

基于 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-bilingual-zh-en-2023-02-20.tar.bz2 编译的 wasm 示例

详见 https://k2-fsa.github.io/sherpa/onnx/wasm/install-emscripten.html

## TypeScript 类型定义

项目提供了完整的 TypeScript 类型定义文件 `sherpa-onnx-asr.d.ts`，包含：

- **接口定义**：所有配置对象的类型（`OnlineRecognizerConfig`、`OnlineModelConfig` 等）
- **类定义**：`OnlineRecognizer`、`OnlineStream`、`OfflineRecognizer`、`OfflineStream`
- **函数定义**：`createOnlineRecognizer` 函数签名
- **全局类型**：`Module` 对象和全局可用的类

## ASR 项目文件说明

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

---

## 现代化模块化架构

在保留官方示例文件的前提下，项目新增了一套模块化的 TypeScript 封装，方便逐步迁移到「像正常 npm 包一样使用」的方式。

### 目录结构

```
src/
├── sherpa-wasm-loader/          # wasm loader 模块
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
└── app-modern/                  # 现代化应用入口
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
})
```

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

### 渐进式替换步骤

1. **保留旧逻辑，先做并行验证**
   - 不改动现有 `index.html`、`app-asr.js`，先确认新模块能编译通过：
     - `pnpm dev` / `pnpm build`
   - 如果构建无误，说明 `sherpa-runtime.ts` 和 `app-modern/*` 代码结构是健康的。

2. **切换入口为模块化版本（推荐在本地分支上尝试）**
   - 修改 `index.html`，用 Vite 模块入口替换旧脚本：
     ```html
     <!-- 注释掉旧的全局脚本 -->
     <!--
     <script src="./src/sherpa-onnx-asr.js"></script>
     <script src="./src/app-asr.js"></script>
     <script src="./src/sherpa-onnx-wasm-main-asr.js"></script>
     -->

     <!-- 新的模块化入口，只保留 wasm loader 由 runtime 动态加载 -->
     <script type="module" src="/src/app-modern/index.ts"></script>
     ```
   - 这一步之后，页面会使用 `sherpa-runtime` + `app-modern` 这套逻辑，按钮 / 文本框 / 录音播放区保持不变。

3. **验证功能一致性**
   - 打开页面，依次测试：
     - **模型加载与状态展示**：`#status` 文本从 Loading → 空
     - **开始录音 / 停止录音**：Start / Stop 按钮是否正常使能
     - **实时识别结果**：文本区域是否实时滚动更新
     - **清除按钮**：是否清空历史结果
     - **录音片段列表**：停止录音后是否生成可播放的音频条目（含重命名 / 删除）

4. **按需启用 / 调整 wasm 缓存**
   - 如需控制 IndexedDB 缓存策略，可在创建识别器时传入 `loader` 配置：
     ```ts
     import { createStreamingRecognizer } from './app-modern/recognizer'

     const streaming = await createStreamingRecognizer({
       loader: {
         cacheWasm: true,          // 是否缓存 .wasm / .data
         cachePrefix: 'sherpa-v1:', // 区分不同模型版本
         wasmScriptUrl: 'sherpa-onnx-wasm-main-asr.js',
       },
     })
     ```
   - `app-modern/index.ts` 默认开启缓存且使用通用前缀，可后续按业务需要抽取成自定义入口。

5. **最终裁剪旧代码（可选）**
   - 当确认模块化版本稳定后，可以：
     - 删除 `app-asr.js` 及相关 README 段落
     - 仅保留：
       - `sherpa-onnx-wasm-main-asr.{js,wasm,data}`（官方生成，不改动）
       - `sherpa-runtime.ts` + `sherpa-onnx-asr-ts/*` + `app-modern/*`

这样，你可以在不动官方生成 wasm 产物的前提下，逐步把业务逻辑全部迁移到现代化、类型完备的模块化入口上。

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

在 JavaScript 项目中使用（通过 JSDoc）：

```javascript
/// <reference path="./sherpa-onnx-asr.d.ts" />

Module.onRuntimeInitialized = function() {
  /** @type {OnlineRecognizer} */
  const recognizer = createOnlineRecognizer(Module);
  // 现在也有类型提示
};
```

## 注意事项

- 所有处理都在浏览器本地完成，无需服务器
- 需要浏览器支持 WebAssembly 和 Web Audio API
- 首次加载需要下载WASM和数据文件（约190MB）
- 模型文件通过虚拟文件系统（MEMFS）访问
- 使用 TypeScript 时，确保 `sherpa-onnx-asr.d.ts` 在同一目录下，IDE 会自动识别类型定义

