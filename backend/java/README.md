# Java 17/21+ 后端工程规范

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

承接 `backend/rules/core-principles.md`（`BE-101` 至 `BE-108`），适用于 Spring Boot 3 / Quarkus 企业级后端。

## 目录索引
- `backend/java/structure.md`：包结构与构造器注入
- `backend/java/style.md`：`record` DTO、不可变集合与复杂度红线
- `backend/java/error-handling.md`：`DomainException` 层级与 `@RestControllerAdvice`
- `backend/java/concurrency.md`：虚拟线程防 Pinning、线程池有界队列与数据库锁
- `backend/java/security.md`：Spring Security 过滤器 vs Service ABAC、防反序列化
- `backend/java/transaction.md`：`@Transactional` 自调用陷阱、`rollbackFor` 与 `afterCommit`
- `backend/java/testing.md`：纯 JUnit 单测与 Testcontainers 集成测试
- `backend/java/spring-boot/README.md`：Spring Boot 3 专属约束
- `backend/java/test/`：零依赖可运行 Java 17+ 参考切片（`javac` + `java`）
