<script setup lang="ts">
import type { TableChangeExtra, TableData, TableSortable } from '@arco-design/web-vue';
import type {
  SortOrder,
  Ticket,
  TicketPriority,
  TicketSortField,
} from '@/types/Ticket.types';
import type { SessionUser } from '@/types/Session.types';
import { STATUS_COLORS, STATUS_LABELS, resolveToggleTarget } from '@/logic/ticketStatus.logic';
import { PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_OPTIONS } from '@/logic/ticketPriority.logic';
import { resolveTicketRowAbility } from '@/logic/ticketPermission.logic';

/**
 * 工单表格。只渲染数据与列配置，所有行为通过回调上报（patterns/table.md）。
 * 权限与状态判定调用 Logic，不在模板里写条件表达式。
 */
interface Props {
  rows: Ticket[];
  loading?: boolean;
  pendingId?: string;
  user: SessionUser | null;
  sortBy: TicketSortField;
  sortOrder: SortOrder;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pendingId: '',
});

const emit = defineEmits<{
  view: [id: string];
  edit: [id: string];
  remove: [row: Ticket];
  toggleStatus: [row: Ticket];
  changePriority: [row: Ticket, priority: TicketPriority];
  sortChange: [sortBy: TicketSortField, sortOrder: SortOrder];
}>();

function abilityOf(row: Ticket) {
  return resolveTicketRowAbility(props.user, row);
}

function sortableOf(field: TicketSortField): TableSortable {
  return {
    sortDirections: ['ascend', 'descend'],
    defaultSortOrder:
      props.sortBy === field ? (props.sortOrder === 'asc' ? 'ascend' : 'descend') : '',
    sorter: true,
  };
}

function handleSort(_data: TableData[], extra: TableChangeExtra): void {
  const field = extra.sorter?.field as TicketSortField | undefined;
  if (!field) return;
  emit('sortChange', field, extra.sorter?.direction === 'ascend' ? 'asc' : 'desc');
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>

<template>
  <a-table
    :data="rows"
    :loading="loading"
    :pagination="false"
    row-key="id"
    :bordered="false"
    @change="handleSort"
  >
    <template #columns>
      <a-table-column title="工单编号" data-index="code" :width="130" :sortable="sortableOf('code')">
        <template #cell="{ record }">
          <a-link @click="emit('view', (record as Ticket).id)">{{ (record as Ticket).code }}</a-link>
        </template>
      </a-table-column>

      <a-table-column title="标题" data-index="title" :ellipsis="true" :tooltip="true" />

      <a-table-column title="状态" :width="100">
        <template #cell="{ record }">
          <a-tag :color="STATUS_COLORS[(record as Ticket).status]">
            {{ STATUS_LABELS[(record as Ticket).status] }}
          </a-tag>
        </template>
      </a-table-column>

      <a-table-column title="优先级" :width="130" :sortable="sortableOf('priority')">
        <template #cell="{ record }">
          <a-select
            v-if="abilityOf(record as Ticket).canChangePriority"
            :model-value="(record as Ticket).priority"
            :options="[...PRIORITY_OPTIONS]"
            size="mini"
            class="!w-24"
            @update:model-value="
              emit('changePriority', record as Ticket, $event as TicketPriority)
            "
          />
          <a-tag v-else :color="PRIORITY_COLORS[(record as Ticket).priority]">
            {{ PRIORITY_LABELS[(record as Ticket).priority] }}
          </a-tag>
        </template>
      </a-table-column>

      <a-table-column title="处理人" :width="110">
        <template #cell="{ record }">
          <span :class="(record as Ticket).assignee ? '' : 'text-[var(--color-text-3)]'">
            {{ (record as Ticket).assignee?.name ?? '未分派' }}
          </span>
        </template>
      </a-table-column>

      <a-table-column
        title="创建时间"
        :width="160"
        :sortable="sortableOf('createdAt')"
      >
        <template #cell="{ record }">{{ formatDateTime((record as Ticket).createdAt) }}</template>
      </a-table-column>

      <a-table-column title="操作" :width="210" fixed="right">
        <template #cell="{ record }">
          <div class="flex items-center gap-1">
            <a-button type="text" size="mini" @click="emit('view', (record as Ticket).id)">
              详情
            </a-button>
            <a-button
              v-if="abilityOf(record as Ticket).canEdit"
              type="text"
              size="mini"
              @click="emit('edit', (record as Ticket).id)"
            >
              编辑
            </a-button>
            <a-button
              v-if="
                abilityOf(record as Ticket).canClose || abilityOf(record as Ticket).canReopen
              "
              type="text"
              size="mini"
              :loading="pendingId === (record as Ticket).id"
              @click="emit('toggleStatus', record as Ticket)"
            >
              {{ resolveToggleTarget((record as Ticket).status) === 'closed' ? '关闭' : '重开' }}
            </a-button>
            <a-button
              v-if="abilityOf(record as Ticket).canDelete"
              type="text"
              size="mini"
              status="danger"
              data-test="remove"
              @click="emit('remove', record as Ticket)"
            >
              删除
            </a-button>
          </div>
        </template>
      </a-table-column>
    </template>
  </a-table>
</template>
