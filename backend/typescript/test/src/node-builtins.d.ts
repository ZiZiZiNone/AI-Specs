declare module 'node:test' {
  export default function test(name: string, fn: () => void | Promise<void>): void;
}
declare module 'node:assert/strict' {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    throws(fn: () => unknown, matcher?: (err: unknown) => boolean): void;
  };
  export default assert;
}
declare module 'node:crypto' {
  const crypto: {
    createHash(alg: string): { update(data: string): { digest(enc: string): string } };
  };
  export default crypto;
}
