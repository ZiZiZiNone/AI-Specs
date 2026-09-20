// 用户详情信息展示组件
// 职责：展示用户基本信息，不涉及数据加载

import React from 'react';
import type { User } from '../types/user.types';

interface UserDetailInfoProps {
  user: User;
  onEdit: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    user: '普通用户',
    guest: '访客',
  };
  return roleMap[role] || role;
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: '启用',
    inactive: '禁用',
  };
  return statusMap[status] || status;
}

export const UserDetailInfo: React.FC<UserDetailInfoProps> = ({ user, onEdit }) => {
  return (
    <div className="user-detail-info">
      <div className="detail-header">
        <h2>用户信息</h2>
        <button className="btn-edit" onClick={onEdit}>
          编辑
        </button>
      </div>

      <div className="detail-content">
        {user.avatar && (
          <div className="detail-avatar">
            <img src={user.avatar} alt={user.name} />
          </div>
        )}

        <div className="detail-fields">
          <div className="detail-field">
            <label>姓名</label>
            <div className="field-value">{user.name}</div>
          </div>

          <div className="detail-field">
            <label>邮箱</label>
            <div className="field-value">{user.email}</div>
          </div>

          <div className="detail-field">
            <label>手机号</label>
            <div className="field-value">{user.phone}</div>
          </div>

          <div className="detail-field">
            <label>角色</label>
            <div className="field-value">{formatRole(user.role)}</div>
          </div>

          <div className="detail-field">
            <label>状态</label>
            <div className="field-value">
              <span className={`status-badge status-${user.status}`}>
                {formatStatus(user.status)}
              </span>
            </div>
          </div>

          {user.department && (
            <div className="detail-field">
              <label>部门</label>
              <div className="field-value">{user.department}</div>
            </div>
          )}

          {user.remark && (
            <div className="detail-field">
              <label>备注</label>
              <div className="field-value">{user.remark}</div>
            </div>
          )}

          <div className="detail-field">
            <label>创建时间</label>
            <div className="field-value">{formatDate(user.createdAt)}</div>
          </div>

          {user.updatedAt && (
            <div className="detail-field">
              <label>更新时间</label>
              <div className="field-value">{formatDate(user.updatedAt)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
