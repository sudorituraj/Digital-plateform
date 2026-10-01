import { cn } from '../../lib/cn'

const AVATARS = {
  doctor: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#docGrad)" />
      <defs>
        <linearGradient id="docGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="38" r="18" fill="#0EA5E9" opacity="0.2" />
      <ellipse cx="60" cy="95" rx="28" ry="22" fill="#0EA5E9" opacity="0.15" />
      <path d="M60 56c-6 0-10.5 4.5-10.5 10s4.5 10 10.5 10 10.5-4.5 10.5-10-4.5-10-10.5-10z" fill="#0EA5E9" opacity="0.3" />
      <circle cx="60" cy="56" r="3" fill="#0EA5E9" />
    </svg>
  ),
  pregnantWoman: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#pregGrad)" />
      <defs>
        <linearGradient id="pregGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="36" r="16" fill="#F472B6" opacity="0.2" />
      <ellipse cx="60" cy="98" rx="32" ry="28" fill="#F472B6" opacity="0.15" />
      <ellipse cx="60" cy="98" rx="22" ry="16" fill="#F472B6" opacity="0.25" />
      <path d="M50 40c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" fill="#F472B6" opacity="0.3" />
    </svg>
  ),
  teenGirl: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#teenGrad)" />
      <defs>
        <linearGradient id="teenGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="38" r="18" fill="#A855F7" opacity="0.2" />
      <ellipse cx="60" cy="95" rx="26" ry="20" fill="#A855F7" opacity="0.15" />
      <path d="M48 42h24M48 50h16M48 58h8" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="52" cy="36" r="2.5" fill="#A855F7" />
      <circle cx="68" cy="36" r="2.5" fill="#A855F7" />
      <path d="M52 44q4 4 8 0" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  heartMonitor: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#heartGrad)" />
      <defs>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d="M25 60h10M105 60h-10M60 25v10M60 105v-10" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M20 60c0 0 12-15 20-15 8 0 8 15 8 15 0 0 12-15 20-15 8 0 8 15 8 15 0 0 12-15 20-15" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
      <circle cx="60" cy="60" r="8" fill="#EF4444" opacity="0.2" />
    </svg>
  ),
  stethoscope: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#stethGrad)" />
      <defs>
        <linearGradient id="stethGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d="M30 30c20-10 40-10 60 0" stroke="#10B981" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="30" cy="30" r="12" stroke="#10B981" strokeWidth="3" fill="none" opacity="0.5" />
      <circle cx="90" cy="30" r="12" stroke="#10B981" strokeWidth="3" fill="none" opacity="0.5" />
      <circle cx="60" cy="85" r="14" stroke="#10B981" strokeWidth="3" fill="none" opacity="0.5" />
      <path d="M60 42v43" stroke="#10B981" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#calGrad)" />
      <defs>
        <linearGradient id="calGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect x="35" y="30" width="50" height="40" rx="4" stroke="#3B82F6" strokeWidth="2.5" fill="none" opacity="0.5" />
      <path d="M45 30v-8M75 30v-8" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <path d="M45 42h30M45 50h20M45 58h10" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#shieldGrad)" />
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d="M60 25L95 45c0 15-15 30-35 35S25 60 25 45L60 25z" stroke="#8B5CF6" strokeWidth="2.5" fill="none" opacity="0.5" />
      <path d="M60 35v20M50 45h20" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
  award: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#awardGrad)" />
      <defs>
        <linearGradient id="awardGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d="M60 25L80 55L100 55L85 70L90 90L60 80L30 90L35 70L20 55L40 55Z" stroke="#F59E0B" strokeWidth="2.5" fill="none" opacity="0.5" />
      <circle cx="60" cy="60" r="12" stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.4" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="url(#famGrad)" />
      <defs>
        <linearGradient id="famGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <circle cx="45" cy="45" r="12" fill="#14B8A6" opacity="0.25" />
      <circle cx="75" cy="45" r="12" fill="#14B8A6" opacity="0.25" />
      <ellipse cx="60" cy="95" rx="28" ry="20" fill="#14B8A6" opacity="0.15" />
      <path d="M45 53c0 5 4 9 9 9s9-4 9-9" stroke="#14B8A6" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M75 53c0 5-4 9-9 9s-9-4-9-9" stroke="#14B8A6" strokeWidth="2" fill="none" opacity="0.5" />
    </svg>
  ),
}

export function AvatarIllustration({ name, size = 120, className }) {
  const avatar = AVATARS[name]
  if (!avatar) return null
  return (
    <div className={cn('flex-shrink-0', className)} style={{ width: size, height: size }}>
      {avatar}
    </div>
  )
}

export function AvatarList() {
  return Object.keys(AVATARS)
}