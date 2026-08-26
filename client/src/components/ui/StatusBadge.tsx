type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, string> = {
  primary: 'bg-blue-50 text-blue-600',
  success: 'bg-green-50 text-green-600',
  warning: 'bg-yellow-50 text-yellow-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-cyan-50 text-cyan-600',
  neutral: 'bg-gray-100 text-gray-600',
};

// Map common status strings to variants
const statusVariantMap: Record<string, BadgeVariant> = {
  published: 'primary',
  confirmed: 'primary',
  active: 'success',
  ongoing: 'success',
  completed: 'success',
  checked_in: 'success',
  success: 'success',
  paid: 'success',
  verified: 'success',
  pending: 'warning',
  awaiting: 'warning',
  waitlisted: 'warning',
  draft: 'neutral',
  refunded: 'info',
  cancelled: 'danger',
  failed: 'danger',
  rejected: 'danger',
  expired: 'danger',
  inactive: 'danger',
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariantMap[status.toLowerCase()] || 'neutral';
  const display = status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${variantMap[resolvedVariant]}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {display}
    </span>
  );
}

