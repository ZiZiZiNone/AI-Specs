/**
 * 零依赖 Node.js 18+ ESM 别名解析器：
 * 将 `@/` 映射至环境变量 `AI_SPEC_ALIAS_ROOT` 指向的源码目录，
 * 使前端参考切片在零第三方依赖下同时通过 `node --test` 与 `scripts/check-import-path.py`。
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const aliasRoot = process.env.AI_SPEC_ALIAS_ROOT;
    if (!aliasRoot) {
      throw new Error('AI_SPEC_ALIAS_ROOT environment variable is required to resolve @/ imports');
    }
    const target = path.resolve(aliasRoot, specifier.slice(2));
    return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
