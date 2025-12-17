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

