import type { Ticket, TicketListQuery } from '@/types/Ticket.types';
import { comparePriority } from '@/logic/ticketPriority.logic';
import { mockDb } from './mockDb';

/** 假后端的列表筛选/排序/分页。真实后端由服务端完成，这里只为跑通链路。 */

function matchesQuery(item: Ticket, query: TicketListQuery): boolean {
  if (query.status && item.status !== query.status) return false;
  if (query.priority && item.priority !== query.priority) return false;
  if (query.assigneeId && item.assignee?.id !== query.assigneeId) return false;

  if (query.keyword) {
    const keyword = query.keyword.toLowerCase();
    const haystack = `${item.code} ${item.title}`.toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }
  return true;
}

function compareBy(a: Ticket, b: Ticket, field: TicketListQuery['sortBy']): number {
  if (field === 'priority') return comparePriority(a.priority, b.priority);
  if (field === 'code') return a.code.localeCompare(b.code);
  return a.createdAt.localeCompare(b.createdAt);
}

export function queryTickets(query: TicketListQuery): {
  list: Ticket[];
  total: number;
} {
  const matched = mockDb
    .listTickets()
    .map(mockDb.toListItem)
    .filter((item) => matchesQuery(item, query));

  const direction: number = query.sortOrder === 'asc' ? 1 : -1;
  matched.sort((a, b) => compareBy(a, b, query.sortBy) * direction);

  const start = (query.page - 1) * query.pageSize;
  return {
    list: matched.slice(start, start + query.pageSize),
    total: matched.length,
  };
}
