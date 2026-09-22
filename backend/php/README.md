# PHP 规范入口

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。

基准见 `common/principles.md`「单向依赖原则」与 `backend/README.md`「分层原则（PHP / Go 共用）」。框架差异见 `backend/README.md`「现有子目录」。

## 规则

- 先读 `common/principles.md`，再读本目录对应主题，最后按需读 `backend/php/laravel/` 差异文件；可运行切片见 `backend/php/test/`。
- 无 Laravel 差异主题不进入框架目录取规则。
- 全目录统一依赖链，方向见 `backend/README.md`「分层原则（PHP / Go 共用）」。
- 控制器只做组装转发，见 `common/principles.md`「薄入口原则」。
- 业务逻辑不得接收传输对象，不得使用静态门面，依赖经构造注入。
- 所有逻辑单元必须可单测，不起服务，不连真实库。

## 检查清单

- [ ] 读取顺序为通用先于 PHP 先于 Laravel
- [ ] 依赖链无跳层与反向
- [ ] 逻辑可脱离传输对象单测
- [ ] 无静态门面与全局单例
- [ ] 未套用其他技术栈规则
- [ ] 框架目录无重复语言级结论
