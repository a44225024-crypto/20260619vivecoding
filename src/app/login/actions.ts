'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_DOMAIN = 'seon.co.kr'

function isAllowedDomain(email: string) {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!isAllowedDomain(email)) {
    redirect(`/login?error=${encodeURIComponent(`@${ALLOWED_DOMAIN} 이메일만 가입할 수 있습니다.`)}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=' + encodeURIComponent('가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요.'))
}

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  const origin = (await headers()).get('origin')

  if (!isAllowedDomain(email)) {
    redirect(`/login?error=${encodeURIComponent(`@${ALLOWED_DOMAIN} 이메일만 로그인할 수 있습니다.`)}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=' + encodeURIComponent('로그인 링크를 이메일로 보냈습니다. 메일함을 확인해주세요.'))
}
