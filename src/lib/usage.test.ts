import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentPeriod, getOwnerUserId } from './usage'

describe('getCurrentPeriod', () => {
  it('returns YYYY-MM format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15'))
    expect(getCurrentPeriod()).toBe('2026-04')
    vi.useRealTimers()
  })
})

describe('getOwnerUserId', () => {
  it('returns userId itself when user has no family', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    const result = await getOwnerUserId('user-123', mockSupabase as any)
    expect(result).toBe('user-123')
  })

  it('returns admin user_id when user belongs to a family', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { family_groups: { created_by: 'admin-456' } },
        error: null,
      }),
    }
    const result = await getOwnerUserId('user-123', mockSupabase as any)
    expect(result).toBe('admin-456')
  })
})
