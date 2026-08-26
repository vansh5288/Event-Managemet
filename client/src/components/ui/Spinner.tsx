interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-blue-600 border-t-transparent ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

