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

## 框架差异

涉及 Laravel 时再进入 `backend/php/laravel/`，无对应文件即无差异：

- `backend/php/laravel/README.md`：二级目录入口与差异证明规则
- `backend/php/laravel/structure.md`：控制器、服务、仓储、表单请求与资源的 Laravel 落点
- `backend/php/laravel/config.md`：配置收敛专属文件、敏感键只读环境
- `backend/php/laravel/error-handling.md`：异常处理器集中映射、队列异常独立
- `backend/php/laravel/logging.md`：容器注入日志接口、通道划分与队列标识
- `backend/php/laravel/testing.md`：替身仓储单测、内存库特性测试、外部伪造

## 检查清单

- [ ] 读取顺序为通用先于 PHP 先于 Laravel
- [ ] 依赖链无跳层与反向
- [ ] 逻辑可脱离传输对象单测
- [ ] 无静态门面与全局单例
- [ ] 未套用其他技术栈规则
- [ ] 框架目录无重复语言级结论
