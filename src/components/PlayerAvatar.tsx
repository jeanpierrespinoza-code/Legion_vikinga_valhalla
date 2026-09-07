interface PlayerAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-sm',
};

export function PlayerAvatar({ name, photoUrl, size = 'md', className = '' }: PlayerAvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover border-2 ${className}`}
        style={{ borderColor: 'var(--color-primary, #c9a227)' }}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-500/70 border-2 ${className}`}
      style={{ borderColor: 'var(--color-primary, #c9a227)' }}
    >
      {initials || '?'}
    </div>
  );
}
