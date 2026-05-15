import React from 'react';
import type { ApplicationStatus, JobStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus | JobStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  reviewing: {
    label: 'Reviewing',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
