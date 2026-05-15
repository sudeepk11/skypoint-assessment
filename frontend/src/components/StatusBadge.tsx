import React from 'react';
import type { ApplicationStatus, JobStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus | JobStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50',
  },
  reviewing: {
    label: 'Reviewing',
    className: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50',
  },
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',
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
