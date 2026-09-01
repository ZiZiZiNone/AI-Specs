# 上传

UI→Logic→Upload Service。

## 流程
- UI：选择文件、展示进度与结果。
- Logic：文件校验（类型/大小/数量）、上传状态管理、结果回调。
- Upload Service：封装上传请求（分片/直传/凭证）。

## 规则
- 校验规则在 Logic，UI 不散落判断。
- 上传中/成功/失败/取消状态齐全。
- 大文件与并发由 Service 处理，UI 不感知细节。
