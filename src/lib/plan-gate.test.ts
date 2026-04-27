import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./usage', () => ({
  getCurrentPeriod: vi.fn().mockReturnValue('2026-04'),
  getOwnerUserId: vi.fn().mockResolvedValue('owner-123'),
  getUsage: vi.fn(),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { checkAiFeature } from './plan-gate'
import { getUsage } from './usage'
import { createAdminClient } from '@/lib/supabase/admin'

function mockSubscription(plan: string) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: { plan, status: 'active' },
    error: null,
  })
  ;(createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
  })
}

describe('checkAiFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('blocks free plan users from ai_chat', async () => {
    mockSubscription('free')
    const result = await checkAiFeature('user-123', 'ai_chat')
    expect(result).toEqual({ allowed: false, reason: 'upgrade_required' })
  })

  it('blocks pro user who hit ai_chat limit', async () => {
    mockSubscription('pro')
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ai_chats_used: 30,
      pdf_imports_used: 0,
    })
    const result = await checkAiFeature('user-123', 'ai_chat')
    expect(result).toEqual({ allowed: false, reason: 'limit_reached' })
  })

  it('allows pro user within ai_chat limit', async () => {
    mockSubscription('pro')
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ai_chats_used: 15,
      pdf_imports_used: 0,
    })
    const result = await checkAiFeature('user-123', 'ai_chat')
    expect(result).toEqual({ allowed: true })
  })

  it('allows family plan unlimited pdf_import', async () => {
    mockSubscription('family')
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ai_chats_used: 0,
      pdf_imports_used: 999,
    })
    const result = await checkAiFeature('user-123', 'pdf_import')
    expect(result).toEqual({ allowed: true })
  })
})
