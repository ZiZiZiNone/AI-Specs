# scripts

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

可执行的校验脚本。本库无运行时，不启动任何服务。

- `scripts/check-citations.py`：引用可验伪校验（COM-011）：条款级编号、位置式引用、引文逐行比对
- `scripts/check-import-path.py`：导入路径校验（`frontend/rules/import-path.md` 的可执行形态）
