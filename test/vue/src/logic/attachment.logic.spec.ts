import { describe, expect, it } from 'vitest';
import type { TicketAttachment } from '@/types/Ticket.types';
import {
  MAX_ATTACHMENT_SIZE,
  checkAttachment,
  removeAttachment,
} from '@/logic/attachment.logic';
import { resolveListState, resolvePagedState } from '@/logic/uiState.logic';

const existing = (count: number): TicketAttachment[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `a-${i}`,
    name: `file-${i}.png`,
    size: 1024,
    url: 'blob:x',
  }));

describe('attachment.logic', () => {
  it('should_accept_supported_type_within_size_limit', () => {
    const result = checkAttachment({ name: 'a.png', size: 1024, type: 'image/png' }, []);
    expect(result.isValid).toBe(true);
  });

  it('should_reject_unsupported_type', () => {
    const result = checkAttachment(
      { name: 'a.exe', size: 1024, type: 'application/x-msdownload' },
      [],
    );
    expect(result.reason).toBe('type');
  });

  it('should_reject_file_above_size_limit', () => {
    const result = checkAttachment(
      { name: 'a.png', size: MAX_ATTACHMENT_SIZE + 1, type: 'image/png' },
      [],
    );
    expect(result.reason).toBe('size');
  });

  it('should_accept_file_exactly_at_size_limit', () => {
    const result = checkAttachment(
      { name: 'a.png', size: MAX_ATTACHMENT_SIZE, type: 'image/png' },
      [],
    );
    expect(result.isValid).toBe(true);
  });

  it('should_check_count_before_type_so_message_is_actionable', () => {
    const result = checkAttachment(
      { name: 'a.exe', size: 1024, type: 'application/x-msdownload' },
      existing(3),
    );
    expect(result.reason).toBe('count');
  });

  it('should_remove_only_the_targeted_attachment', () => {
    expect(removeAttachment(existing(3), 'a-1').map((item) => item.id)).toEqual([
      'a-0',
      'a-2',
    ]);
  });
});

describe('uiState.logic', () => {
  it('should_report_empty_for_empty_first_page', () => {
    expect(resolveListState([])).toBe('empty');
    expect(resolvePagedState([], 1)).toBe('empty');
  });

  it('should_stay_success_when_a_later_page_returns_empty', () => {
    expect(resolvePagedState([], 3)).toBe('success');
  });
});
