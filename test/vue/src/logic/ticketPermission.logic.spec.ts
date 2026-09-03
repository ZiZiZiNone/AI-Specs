import { describe, expect, it } from 'vitest';
import type { SessionUser } from '@/types/Session.types';
import { canAssign, resolveTicketRowAbility } from '@/logic/ticketPermission.logic';
import { canTransition, resolveToggleTarget } from '@/logic/ticketStatus.logic';
import { requiresPriorityConfirm } from '@/logic/ticketPriority.logic';

const fullAccess: SessionUser = {
  id: 'u-01',
  name: '测试用户',
  permissions: ['ticket:create', 'ticket:edit', 'ticket:delete', 'ticket:close', 'ticket:assign'],
};

const readOnly: SessionUser = { id: 'u-09', name: '只读用户', permissions: [] };

describe('ticketPermission.logic', () => {
  it('should_deny_everything_when_user_is_absent', () => {
    const ability = resolveTicketRowAbility(null, { status: 'open' });
    expect(Object.values(ability).every((value) => value === false)).toBe(true);
  });

  it('should_deny_everything_for_user_without_permissions', () => {
    const ability = resolveTicketRowAbility(readOnly, { status: 'open' });
    expect(Object.values(ability).every((value) => value === false)).toBe(true);
  });

  it('should_hide_close_and_show_reopen_for_closed_ticket', () => {
    const ability = resolveTicketRowAbility(fullAccess, { status: 'closed' });
    expect(ability.canClose).toBe(false);
    expect(ability.canReopen).toBe(true);
  });

  it('should_block_edit_on_closed_ticket_even_with_permission', () => {
    expect(resolveTicketRowAbility(fullAccess, { status: 'closed' }).canEdit).toBe(false);
    expect(canAssign(fullAccess, 'closed')).toBe(false);
  });

  it('should_allow_delete_regardless_of_status', () => {
    expect(resolveTicketRowAbility(fullAccess, { status: 'closed' }).canDelete).toBe(true);
  });
});

describe('ticketStatus.logic', () => {
  it('should_reject_transition_from_closed_to_processing', () => {
    expect(canTransition('closed', 'processing')).toBe(false);
    expect(canTransition('closed', 'open')).toBe(true);
  });

  it('should_reject_reverting_processing_to_open', () => {
    expect(canTransition('processing', 'open')).toBe(false);
  });

  it('should_resolve_toggle_target_by_current_status', () => {
    expect(resolveToggleTarget('open')).toBe('closed');
    expect(resolveToggleTarget('processing')).toBe('closed');
    expect(resolveToggleTarget('closed')).toBe('open');
  });
});

describe('ticketPriority.logic', () => {
  it('should_require_confirm_only_when_escalating_to_urgent', () => {
    expect(requiresPriorityConfirm('low', 'urgent')).toBe(true);
    expect(requiresPriorityConfirm('urgent', 'urgent')).toBe(false);
    expect(requiresPriorityConfirm('urgent', 'low')).toBe(false);
  });
});
