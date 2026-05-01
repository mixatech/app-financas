'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
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
            <h1 className="text-2xl font-bold text-gray-900">Verifique seu e-mail</h1>
            <p className="text-gray-500 leading-relaxed">
              Enviamos um link para redefinir sua senha para{' '}
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
            <Link href="/auth/login" className="font-semibold" style={{ color: '#7B2FBE' }}>
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12" style={{ background: 'linear-gradient(135deg, #18181b 0%, #3b0764 100%)' }}>
        <div>
          <Image src="/logo-escrita-branco.png" alt="Finxa" height={28} width={90} />
        </div>
        <div className="space-y-4">
          <p className="text-white text-3xl font-bold leading-snug">
            Recupere o acesso à sua conta.
          </p>
          <p className="text-gray-400 text-base leading-relaxed">
            Enviaremos um link seguro para você redefinir sua senha.
          </p>
        </div>
        <p className="text-gray-600 text-sm">© 2025 Finxa · Mixa. Todos os direitos reservados.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Image src="/logo-escrita-branco.png" alt="Finxa" height={24} width={80} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Esqueceu a senha?</h1>
          <p className="text-gray-500 mb-8">Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white font-semibold rounded-xl transition-opacity disabled:opacity-60"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-6">
            Lembrou a senha?{' '}
            <Link href="/auth/login" className="font-semibold" style={{ color: '#7B2FBE' }}>
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
