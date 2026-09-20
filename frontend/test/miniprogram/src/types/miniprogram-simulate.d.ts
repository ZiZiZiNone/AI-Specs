/** miniprogram-simulate 最小类型垫片：仅覆盖本工程用到的签名（v1.6.2 实测）。 */
declare module 'miniprogram-simulate' {
  export interface SimulateInstance {
    onInput(event: { detail: { value: string } }): void
    onClear(): void
    triggerEvent(name: string, detail: unknown): void
  }
  export interface SimulateComponent {
    attach(parent: unknown): void
    detach(): void
    setData(data: Record<string, unknown>): void
    addEventListener(eventName: string, handler: (event: Event) => void): void
    removeEventListener(eventName: string, handler: (event: Event) => void): void
    dom: Element
    instance: SimulateInstance
  }
  export function load(componentPath: string, tagName?: string, options?: Record<string, unknown>): string
  export function render(id: string, properties?: Record<string, unknown>): SimulateComponent
  const simulate: { load: typeof load; render: typeof render }
  export default simulate
}
