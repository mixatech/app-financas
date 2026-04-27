import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFamilyGroup } from './actions'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'

const mockCreateClient = vi.mocked(createClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)

describe('createFamilyGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(),
    } as never)

    const result = await createFamilyGroup('Família Teste', 'Mylena')

    expect(result).toEqual({ error: 'Sessão expirada. Faça login novamente.' })
  })

  it('returns success when group and member are created', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'group-1' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsertGroup = vi.fn().mockReturnValue({ select: mockSelect })
    const mockInsertMember = vi.fn().mockResolvedValue({ error: null })

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as never)

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({ insert: mockInsertGroup })
        .mockReturnValueOnce({ insert: mockInsertMember }),
    } as never)

    const result = await createFamilyGroup('Família Teste', 'Mylena')

    expect(result).toEqual({ success: true })
    expect(mockInsertGroup).toHaveBeenCalledWith({
      name: 'Família Teste',
      created_by: 'user-1',
    })
  })

  it('returns error when family group DB insert fails', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Permissão negada' } })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsertGroup = vi.fn().mockReturnValue({ select: mockSelect })

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as never)

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: mockInsertGroup }),
    } as never)

    const result = await createFamilyGroup('Família Teste', 'Mylena')

    expect(result).toEqual({ error: 'Permissão negada' })
  })

  it('trims whitespace from groupName before inserting', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'group-1' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsertGroup = vi.fn().mockReturnValue({ select: mockSelect })
    const mockInsertMember = vi.fn().mockResolvedValue({ error: null })

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as never)

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({ insert: mockInsertGroup })
        .mockReturnValueOnce({ insert: mockInsertMember }),
    } as never)

    await createFamilyGroup('  Família Teste  ', 'Mylena')

    expect(mockInsertGroup).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Família Teste' })
    )
  })
})
