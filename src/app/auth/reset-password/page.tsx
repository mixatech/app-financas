'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setReady(true)
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
      setReady(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12" style={{ background: 'linear-gradient(135deg, #18181b 0%, #3b0764 100%)' }}>
        <div>
          <Image src="/logo-escrita-branco.png" alt="Finxa" unoptimized height={28} width={90} />
        </div>
        <div className="space-y-4">
          <p className="text-white text-3xl font-bold leading-snug">
            Defina uma nova senha.
          </p>
          <p className="text-gray-400 text-base leading-relaxed">
            Escolha uma senha segura para proteger sua conta.
          </p>
        </div>
        <p className="text-gray-600 text-sm">© 2025 Finxa · Mixa. Todos os direitos reservados.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Image src="/logo-escrita-branco.png" alt="Finxa" unoptimized height={24} width={80} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Nova senha</h1>
          <p className="text-gray-500 mb-8">Escolha uma senha com pelo menos 6 caracteres.</p>

          {!ready ? (
            <p className="text-gray-400 text-sm">Verificando link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}{' '}
                  {error.includes('expirado') && (
                    <Link href="/auth/forgot-password" className="font-semibold underline">
                      Solicitar novo link
                    </Link>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-gray-200 rounded-xl"
                  required
                  disabled={!!error}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-11 border-gray-200 rounded-xl"
                  required
                  disabled={!!error}
                />
              </div>
              {!error && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-white font-semibold rounded-xl transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              )}
            </form>
          )}

          <p className="text-sm text-gray-400 text-center mt-6">
            <Link href="/auth/login" className="font-semibold" style={{ color: '#7B2FBE' }}>
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
