import type { TicketAttachment } from '@/types/Ticket.types';

/**
 * 附件校验规则。按 patterns/upload.md，校验在 Logic，UI 只触发与展示。
 */

export const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;
export const MAX_ATTACHMENT_COUNT = 3;
export const ACCEPTED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export interface AttachmentCandidate {
  name: string;
  size: number;
  type: string;
}

export type AttachmentRejectReason = 'type' | 'size' | 'count';

export interface AttachmentCheckResult {
  isValid: boolean;
  reason?: AttachmentRejectReason;
  message?: string;
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
}

export function checkAttachment(
  file: AttachmentCandidate,
  existing: readonly TicketAttachment[],
): AttachmentCheckResult {
  if (existing.length >= MAX_ATTACHMENT_COUNT) {
    return {
      isValid: false,
      reason: 'count',
      message: `最多上传 ${MAX_ATTACHMENT_COUNT} 个附件，请先移除已有附件`,
    };
  }

  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
    return {
      isValid: false,
      reason: 'type',
      message: '仅支持 jpg、png、pdf 格式的附件',
    };
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      isValid: false,
      reason: 'size',
      message: `附件大小超过 ${formatMegabytes(MAX_ATTACHMENT_SIZE)}，请选择更小的文件`,
    };
  }

  return { isValid: true };
}

export function removeAttachment(
  attachments: readonly TicketAttachment[],
  id: string,
): TicketAttachment[] {
  return attachments.filter((item) => item.id !== id);
}
