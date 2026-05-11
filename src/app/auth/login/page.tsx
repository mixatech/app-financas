'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirectTo = searchParams.get('redirect') ?? '/dashboard'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailNotConfirmed(false)
    setResendSuccess(false)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setEmailNotConfirmed(true)
        setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam).')
      } else {
        setError('E-mail ou senha inválidos. Verifique seus dados e tente novamente.')
      }
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleResend() {
    setResendLoading(true)
    setResendSuccess(false)

    const res = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setResendLoading(false)

    if (res.ok) {
      setResendSuccess(true)
      setError('')
      setEmailNotConfirmed(false)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erro ao reenviar e-mail. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12" style={{ background: 'linear-gradient(135deg, #18181b 0%, #3b0764 100%)' }}>
        <div>
          <Image src="/logo-escrita-branco.png" alt="Finxa" unoptimized height={28} width={90} />
        </div>
        <div className="space-y-4">
          <p className="text-white text-3xl font-bold leading-snug">
            Controle financeiro inteligente para você e para toda família.
          </p>
          <p className="text-gray-400 text-base leading-relaxed">
            Gerencie receitas, despesas e o orçamento da família em um só lugar — com IA que entende sua linguagem.
          </p>
        </div>
        <p className="text-gray-600 text-sm">© 2025 Finxa · Mixa. Todos os direitos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Image src="/logo-escrita-branco.png" alt="Finxa" unoptimized height={24} width={80} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Entrar</h1>
          <p className="text-gray-500 mb-8">Bem-vindo de volta. Acesse sua conta.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                E-mail de confirmação reenviado! Verifique sua caixa de entrada (e o spam).
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl space-y-2">
                <p>{error}</p>
                {emailNotConfirmed && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="font-semibold underline disabled:opacity-50"
                    style={{ color: '#7B2FBE' }}
                  >
                    {resendLoading ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                  </button>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-gray-200 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</Label>
                <Link href="/auth/forgot-password" className="text-xs font-medium" style={{ color: '#7B2FBE' }}>
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-gray-200 rounded-xl"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white font-semibold rounded-xl transition-opacity disabled:opacity-60"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-6">
            Não tem conta?{' '}
            <Link
              href={redirectTo !== '/dashboard' ? `/auth/signup?redirect=${encodeURIComponent(redirectTo)}` : '/auth/signup'}
              className="font-semibold"
              style={{ color: '#7B2FBE' }}
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
