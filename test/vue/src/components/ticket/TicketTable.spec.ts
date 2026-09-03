// @vitest-environment jsdom
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Arco from '@arco-design/web-vue';
import TicketTable from '@/components/ticket/TicketTable.vue';
import type { SessionUser } from '@/types/Session.types';
import type { Ticket } from '@/types/Ticket.types';

/** 只测给定 props 渲染出什么与交互上报什么；断言 emit 载荷，不断言内部状态。 */

const adminUser: SessionUser = {
  id: 'u-admin',
  name: '管理员',
  permissions: ['ticket:create', 'ticket:edit', 'ticket:delete', 'ticket:close', 'ticket:assign'],
};

const row: Ticket = {
  id: 't-1',
  code: 'TK-0001',
  title: '登录失败',
  status: 'open',
  priority: 'high',
  assignee: null,
  createdAt: '2026-09-01T10:00:00',
  updatedAt: '2026-09-01T10:00:00',
};

function mountTable(user: SessionUser | null, rows: Ticket[] = [row]) {
  return mount(TicketTable, {
    props: { rows, user, sortBy: 'createdAt', sortOrder: 'desc' },
    // 组件库按真实插件挂载（不断言其内部行为，只借其渲染插槽内的业务按钮）
    global: { plugins: [Arco] },
  });
}

describe('TicketTable', () => {
  it('should_emit_remove_with_row_when_delete_clicked', async () => {
    const wrapper = mountTable(adminUser);
    await nextTick();
    await wrapper.find('[data-test="remove"]').trigger('click');
    expect(wrapper.emitted('remove')?.[0]).toEqual([row]);
  });

  it('should_hide_delete_button_when_user_lacks_permission', async () => {
    const wrapper = mountTable({ ...adminUser, permissions: ['ticket:edit'] });
    await nextTick();
    expect(wrapper.find('[data-test="remove"]').exists()).toBe(false);
  });
});
