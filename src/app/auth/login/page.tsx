'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos. Verifique seus dados e tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12" style={{ background: '#0D0D0D' }}>
        <div className="flex items-center gap-2.5">
          <div className="text-white p-2 rounded-xl" style={{ background: 'var(--brand-gradient)' }}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FamilyFinance</span>
        </div>
        <div className="space-y-4">
          <p className="text-white text-3xl font-bold leading-snug">
            Controle financeiro inteligente para toda a família.
          </p>
          <p className="text-gray-400 text-base leading-relaxed">
            Gerencie receitas, despesas e o orçamento da família em um só lugar — com IA que entende sua linguagem.
          </p>
        </div>
        <p className="text-gray-600 text-sm">© 2025 FamilyFinance · Mixa. Todos os direitos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="text-white p-1.5 rounded-lg" style={{ background: 'var(--brand-gradient)' }}>
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-bold text-gray-900 text-lg">FamilyFinance</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Entrar</h1>
          <p className="text-gray-500 mb-8">Bem-vindo de volta. Acesse sua conta.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
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
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Senha</Label>
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
            <Link href="/auth/signup" className="font-semibold" style={{ color: '#7B2FBE' }}>
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
