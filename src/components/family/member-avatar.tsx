interface MemberAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { outer: 'w-7 h-7', text: 'text-xs' },
  md: { outer: 'w-9 h-9', text: 'text-sm' },
  lg: { outer: 'w-12 h-12', text: 'text-base' },
}

export function MemberAvatar({ name, color, size = 'md' }: MemberAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const { outer, text } = sizes[size]

  return (
    <div
      className={`${outer} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      <span className={text}>{initials}</span>
    </div>
  )
}
