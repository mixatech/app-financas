'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Mail, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full" style={{ background: '#f3e8ff' }}>
              <Mail className="h-10 w-10" style={{ color: '#7B2FBE' }} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Confirme seu e-mail</h1>
            <p className="text-gray-500 leading-relaxed">
              Enviamos um link de confirmação para{' '}
              <span className="font-semibold text-gray-700">{email}</span>.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3">
            <p className="text-sm font-semibold text-amber-800">Não encontrou o e-mail?</p>
            <ul className="space-y-2 text-sm text-amber-700">
              {[
                'Verifique sua caixa de entrada',
                'Confira a pasta de spam / lixo eletrônico',
                'O e-mail pode levar alguns minutos para chegar',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-400">
            Já confirmou?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: '#7B2FBE' }}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    )
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
            Organize as finanças da sua família de forma inteligente.
          </p>
          <ul className="space-y-3 text-gray-400 text-sm">
            {[
              'Grupos familiares com login individual',
              'Chat IA: registre gastos em linguagem natural',
              'Importe extratos PDF e CSV automaticamente',
              'Dashboard consolidado por membro',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#7B2FBE' }} />
                {item}
              </li>
            ))}
          </ul>
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

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Criar conta</h1>
          <p className="text-gray-500 mb-8">Gratuito. Sem cartão de crédito.</p>

          <form onSubmit={handleSignup} className="space-y-5">
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
                placeholder="Mínimo 6 caracteres"
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
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Após o cadastro, você receberá um e-mail para confirmar sua conta.
            <br />Verifique também a pasta de spam.
          </p>

          <p className="text-sm text-gray-400 text-center mt-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: '#7B2FBE' }}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
