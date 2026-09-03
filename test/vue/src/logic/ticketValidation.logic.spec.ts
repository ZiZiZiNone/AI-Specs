import { describe, expect, it } from 'vitest';
import type { TicketFormValues } from '@/types/Ticket.types';
import {
  createEmptyFormValues,
  resolveFirstErrorField,
  resolveVisibleFields,
  toSubmitPayload,
  validateField,
  validateForm,
} from '@/logic/ticketValidation.logic';

function validValues(): TicketFormValues {
  return {
    ...createEmptyFormValues(),
    code: 'TK-000123',
    title: '导出报表缺少上月数据',
    assigneeId: 'u-01',
    contactPhone: '13800138000',
    description: '选择上月区间导出后，文件中只有本月数据。',
  };
}

describe('ticketValidation.logic', () => {
  it('should_pass_when_all_required_fields_are_valid', () => {
    expect(validateForm(validValues())).toEqual({});
  });

  it('should_reject_malformed_code_and_phone', () => {
    const errors = validateForm({
      ...validValues(),
      code: 'TK-12',
      contactPhone: '12800138000',
    });

    expect(errors.code).toBeTruthy();
    expect(errors.contactPhone).toBeTruthy();
  });

  it('should_report_required_before_format_when_field_is_empty', () => {
    const error = validateField({ ...validValues(), code: '' }, 'code');
    expect(error).toBe('请输入工单编号');
  });

  it('should_skip_validation_for_hidden_dependent_field', () => {
    const hidden = { ...validValues(), needsFollowUp: false, followUpAt: null };
    expect(resolveVisibleFields(hidden)).not.toContain('followUpAt');
    expect(validateForm(hidden).followUpAt).toBeUndefined();
  });

  it('should_require_dependent_field_once_it_becomes_visible', () => {
    const visible = { ...validValues(), needsFollowUp: true, followUpAt: null };
    expect(resolveVisibleFields(visible)).toContain('followUpAt');
    expect(validateForm(visible).followUpAt).toBeTruthy();
  });

  it('should_pick_first_error_by_visual_order_not_object_key_order', () => {
    const errors = validateForm({
      ...validValues(),
      code: '',
      title: '',
      contactPhone: '',
    });
    expect(resolveFirstErrorField(errors)).toBe('code');
  });

  it('should_trim_values_and_drop_hidden_field_residue_in_payload', () => {
    const payload = toSubmitPayload({
      ...validValues(),
      title: '  标题两侧有空格  ',
      needsFollowUp: false,
      followUpAt: '2026-05-01T00:00:00.000Z',
    });

    expect(payload.title).toBe('标题两侧有空格');
    expect(payload.followUpAt).toBeNull();
  });

  it('should_treat_whitespace_only_string_as_empty', () => {
    expect(validateField({ ...validValues(), title: '     ' }, 'title')).toBe('请输入标题');
  });
});
