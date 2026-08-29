export const BRAND = {
  name: 'ORBÍTICA',
  product: 'LOYALTY',
  tagline: 'Infraestructura de fidelización digital SaaS',
  company: 'Orbítica Studio',
  colors: {
    black: '#0A0A0A',
    charcoal: '#1A1B1F',
    silver: '#CFCFD4',
    lightGray: '#E5E6EA',
    accentBlue: '#0EA5FF',
    accentBlueHover: '#0091EA',
    cardDark: '#121316',
    borderSubtle: '#27282D',
    borderGlow: 'rgba(14, 165, 255, 0.3)',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
} as const;

export const ROLES = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;
