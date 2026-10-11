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

`assets/walkthrough.gif` is a 25.1-second edited sequence of nine sampled native-app frames with held intervals. It introduces setup, preferences, task background, and local document previews. Playback is opt-in; a still appears initially. The supporting stills are `conversation.jpg`, `preferences.jpg`, `background.jpg`, and `document.jpg`.

`assets/walkthrough.gif` 是由九帧原生应用画面组成的 25.1 秒剪辑，展示初始设置、偏好、任务背景和本地文档预览。点击播放后开始，初始显示静态画面。

## Published task-image checksums / 公开任务图片校验

Original capture bytes are preserved; only filenames change. All three captures are lossless 1188 × 848 PNG images, exported directly by Electron capturePage().toPNG() at zoom factor 1. The application uses bundled Inter Variable and Noto Sans SC Variable fonts. The website preserves these image bytes and presents them without a rotated or simulated title bar.

- `process-read.png`: `f9e0130e3f2ab531e854dc5737bcd0b15479a7d6a945acc08ef7a89f416001da`
- `process-work.png`: `4d280a26c4dadb9e0ab09461ae0fcc95d7c6f39b7927e2c497568d9987231826`
- `process-result.png`: `fd3f3a0db126abbc7823d28dbad0f2f38e6538e95c0d3d187872178faa369a5f`
