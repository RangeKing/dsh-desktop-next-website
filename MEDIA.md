# Product capture notes / 产品录制说明

The images show the actual DSH Desktop Next Linux Electron application. The task story uses sample materials and controlled demonstration events to present the client's reading, execution-record, and delivery-review experience. It is a product workflow demonstration, rather than evidence of a live model run or a performance benchmark.

画面来自实际运行的 DSH Desktop Next Linux Electron 客户端。任务故事使用样例资料和受控演示事件，展示资料读取、执行记录与交付审阅体验。这是产品操作流程演示，而非实时模型执行或性能测试记录。

## Task story / 任务故事

- `assets/process-read.png`: source-reading stage / 资料读取阶段
- `assets/process-work.png`: execution records / 执行记录
- `assets/process-result.png`: delivered-document review / 交付文档审阅

The task is “Product interviews to a launch brief.” Reading and progress records are controlled demonstration events. The delivered Word document is a sample file opened through the actual local Office-to-PDF preview path.

演示任务为「产品访谈到上线简报」。读取与过程记录由受控演示事件提供；交付 Word 文档为样例文件，经实际本地 Office 转 PDF 预览链路打开。

Capture date: October 10, 2026. These are app screenshots, not generated interface mockups. Sample content is prepared for this demonstration; account screens, credentials, personal documents, and application source are excluded.

录制日期：2026 年 10 月 10 日。图片为客户端截图，使用专门准备的演示内容。公开素材仅呈现应用画面与样例内容。

## Workspace walkthrough / 工作空间演示

`assets/walkthrough.gif` is an 18.28-second edited sequence made from 13 new-font native PNG frames: reading, nine consecutive action-focus frames, delivered files, Word preview, and spreadsheet preview. Reading and result stills are held for inspection; focus frames preserve their recorded cadence with a final hold. GIF palette quantization is applied at the original 1188 × 848 size. Playback is opt-in; a new preferences capture appears initially.

`assets/walkthrough.gif` 来自新版字体的 13 帧原生 PNG 画面，长 18.28 秒，展示读取、行动定位、交付文件、Word 与表格预览。动图保留原始 1188 × 848 尺寸，使用 GIF 调色板编码；点击播放后开始，初始显示新的偏好设置截图。

The supporting `preferences.png` and `background.png` are original native PNG captures of the updated application. The background panel shows a manually entered demonstration goal. The document section reuses the lossless `process-result.png` capture. Old JPEG captures have been removed.

偏好设置和任务背景均使用更新后客户端的原生 PNG；背景面板展示手动填写的演示目标。文档区复用无损的交付预览截图。

## Published task-image checksums / 公开任务图片校验

Original capture bytes are preserved; only filenames change. All three captures are lossless 1188 × 848 PNG images, exported directly by Electron capturePage().toPNG() at zoom factor 1. The application uses bundled Inter Variable and Noto Sans SC Variable fonts. The website preserves these image bytes and presents them without a rotated or simulated title bar.

- `process-read.png`: `f9e0130e3f2ab531e854dc5737bcd0b15479a7d6a945acc08ef7a89f416001da`
- `process-work.png`: `4d280a26c4dadb9e0ab09461ae0fcc95d7c6f39b7927e2c497568d9987231826`
- `process-result.png`: `fd3f3a0db126abbc7823d28dbad0f2f38e6538e95c0d3d187872178faa369a5f`

- `walkthrough.gif`: `300971c9117db4f4b3611b3e4a8de02ebcbaee0f96b4ea9ba80869e083c9975b`

## Extensions / 扩展

The extension gallery previews 0.2.0 in the actual Linux Electron client and its running official Harness. These are original, lossless native PNG captures, published without cropping, recoloring, or an added window bar. The currently available download remains v0.1.1.

扩展图集展示实际 Linux Electron 客户端中的 0.2.0 预览功能，使用原生无损 PNG，保持完整画面与原始比例。当前可下载版本仍为 v0.1.1。

- `extensions-plugins.png`: actual installed/optional runtime bundle inventory. The selected developer-tools bundle is not enabled in this capture. Official plugin interfaces open in the Compatibility workspace, using the same Harness profile; this inventory image does not show an individual plugin interface.
- `extensions-skills.png`: the imported, self-authored `fixture-review` Skill. Its complete directory was imported and read by the official resolver.
- `extensions-mcp.png`: self-authored “Demo local tools,” validated and mounted through the actual local MCP/runtime path. The tool is an in-memory echo fixture.

插件图展示真实运行时清单，所选「开发者工具」在截图中未启用。官方插件界面在沿用同一 Harness 配置的兼容工作区中打开；清单图并非单个插件界面的截图。Skills 图展示实际导入并由官方解析器读取的自编 `fixture-review`；MCP 图展示经过真实本地链路验证、挂载的自编演示回声工具。

Verification scope: OAuth is covered by local mock-provider tests. Real provider authorization has not been verified. Native public-network discovery could not be completed in the verification environment; these captures do not establish community-package compatibility or end-to-end public service connectivity.

验证范围：OAuth 已通过本地模拟服务测试，真实服务商授权尚未验证。验收环境中的原生公网社区查询未完成；这些截图不代表社区包兼容性或公网服务全链路验证。

### Extension asset fingerprints / 扩展素材指纹

- `extensions-plugins.png`: 980 × 680 · SHA-256 `5c1d229c857d512f035271e0cda9c5075d3b4931112563fcabd855fba60a76fb`
- `extensions-skills.png`: 1188 × 848 · SHA-256 `4fb9f1688358f23c6754e9152197c9d69188da8ccddd4765212d2e0503e946d6`
- `extensions-mcp.png`: 1188 × 848 · SHA-256 `a292c3c5a351e45c2aaed1e72cb3901b477041f436a29fde2fd992260d4fa9ab`
