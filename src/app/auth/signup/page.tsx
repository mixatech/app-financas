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
            <div className="bg-green-100 p-4 rounded-full">
              <Mail className="h-10 w-10 text-green-600" />
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
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                Verifique sua <strong>caixa de entrada</strong>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                Confira a pasta de <strong>spam / lixo eletrônico</strong>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                O e-mail pode levar alguns minutos para chegar
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-400">
            Já confirmou?{' '}
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gray-950 p-12">
        <div className="flex items-center gap-2.5">
          <div className="bg-green-500 text-white p-2 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FinançasPRO</span>
        </div>
        <div className="space-y-4">
          <p className="text-white text-3xl font-bold leading-snug">
            Comece a organizar sua vida financeira hoje.
          </p>
          <ul className="space-y-3 text-gray-400 text-sm">
            {[
              'Registre receitas e despesas em segundos',
              'Visualize gráficos e resumos mensais',
              'Filtre por categoria e período',
              '100% seguro — seus dados são só seus',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-gray-600 text-sm">© 2025 FinançasPRO. Todos os direitos reservados.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-bold text-gray-900 text-lg">FinançasPRO</span>
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
                className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
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
                className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
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
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
