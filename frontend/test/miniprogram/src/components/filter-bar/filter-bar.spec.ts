/** @jest-environment jsdom */
/* 组件测试（miniprogram-simulate v1.6.2：load 走文件真实管线 + compiler simulate；
   方法经组件实例调用，上报经真实 triggerEvent 捕获；模板条件渲染经真实 DOM 断言。
   模板事件绑定（bindinput/bindtap）属框架机制，不在此测）。 */
import { beforeAll, describe, expect, jest, test } from '@jest/globals'
import * as path from 'path'
import simulate from 'miniprogram-simulate'

let componentId = ''

function renderBar(keyword: string) {
  const comp = simulate.render(componentId, { keyword })
  comp.attach(document.createElement('parent-wrapper'))
  return comp
}

function captureChange(comp: ReturnType<typeof renderBar>) {
  const onChange = jest.fn()
  comp.addEventListener('change', (event: Event) => {
    onChange((event as CustomEvent).detail)
  })
  return onChange
}

describe('filter-bar', () => {
  beforeAll(() => {
    componentId = simulate.load(path.join(__dirname, 'filter-bar'), 'filter-bar', {
      compiler: 'simulate',
    })
  })

  test('should_emit_change_with_keyword_when_input', () => {
    const comp = renderBar('')
    const onChange = captureChange(comp)
    comp.instance.onInput({ detail: { value: 'abc' } })
    expect(onChange).toHaveBeenCalledWith({ keyword: 'abc' })
  })

  test('should_emit_change_with_empty_when_cleared', () => {
    const comp = renderBar('abc')
    const onChange = captureChange(comp)
    const button = comp.dom.querySelector('wx-button')
    if (!button) throw new Error('clear button not rendered')
    comp.instance.onClear()
    expect(onChange).toHaveBeenCalledWith({ keyword: '' })
  })
})
