'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '@/context/AuthContext';
import { clientEnv } from '@/lib/env';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Form State Sign In
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Form State Sign Up
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  // Check email verification redirect parameters
  const verifiedParam = searchParams.get('verified');
  const errorParam = searchParams.get('error');
  const activeMessage =
    statusMessage ||
    (verifiedParam === 'true'
      ? {
          type: 'success' as const,
          text: 'Email Anda berhasil diverifikasi! Silakan masuk ke akun Anda.',
        }
      : verifiedParam === 'false'
      ? {
          type: 'error' as const,
          text: errorParam || 'Verifikasi email gagal atau token telah kedaluwarsa.',
        }
      : null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validasi Cloudflare Turnstile untuk Sign In
    if (
      clientEnv.turnstileSiteKey &&
      !captchaToken &&
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost'
    ) {
      setStatusMessage({
        type: 'error',
        text: 'Mohon selesaikan verifikasi Cloudflare terlebih dahulu!',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signInUsername,
          password: signInPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Autentikasi gagal.');
      }

      if (!data.user) throw new Error('Profil akun tidak dapat dimuat.');
      setUser(data.user);
      router.push(data.user.mustChangePassword ? '/set-password?mode=forced' : '/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage({
        type: 'error',
        text: error.message || 'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validasi Cloudflare Turnstile untuk Sign Up
    if (
      clientEnv.turnstileSiteKey &&
      !captchaToken &&
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost'
    ) {
      setStatusMessage({
        type: 'error',
        text: 'Mohon selesaikan verifikasi Cloudflare terlebih dahulu!',
      });
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'Kata sandi dan konfirmasi kata sandi tidak cocok!',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password: signUpPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Pendaftaran gagal.');
      }

      setStatusMessage({
        type: 'success',
        text: data.message || 'Pendaftaran berhasil! Silakan masuk.',
      });
      setIsSignUp(false);
      setSignInUsername(email);
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage({
        type: 'error',
        text: error.message || 'Terjadi kesalahan saat pendaftaran.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col justify-between p-4 md:p-6 text-slate-800 font-sans overflow-hidden">
      
      {/* HEADER / BAR ATAS */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between shrink-0 py-1 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center p-1 overflow-hidden">
            <img src="/Logodashboard.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800 block">INFRASTRUKTUR PASIF</span>
            <span className="text-[10px] text-slate-500 font-medium block">Portal Layanan Registrasi</span>
          </div>
        </div>
      </header>

      {/* KARTU KONTEN UTAMA */}
      <main className="max-w-5xl w-full mx-auto my-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 grid grid-cols-1 md:grid-cols-12 min-h-0 flex-1 max-h-[85vh]">
        
        {/* PANEL KIRI (BRANDING BIRU) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#005c99] via-[#0070ba] to-[#004a80] p-6 xl:p-8 text-white flex flex-col justify-between relative overflow-hidden select-none">        
          <div className="relative z-10 space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
              {isSignUp ? (
                <>
                  Mulai registrasi <br />
                  <span className="text-sky-300"> dengan mudah.</span>
                </>
              ) : (
                <>
                  Selamat Datang <br />
                  <span className="text-sky-300">Kembali</span>
                </>
              )}
            </h1>
            <p className="text-xs xl:text-sm text-sky-100/90 leading-relaxed max-w-xs pt-1 font-normal">
              {isSignUp 
                ? "Buat akun untuk mengajukan dan memantau registrasi infrastruktur pasif Anda dalam satu tempat."
                : "Masuk untuk melanjutkan pengajuan data registrasi infrastruktur pasif."}
            </p>
          </div>

          {/* ILUSTRASI SILUET MENARA TOWER */}
          <div className="relative z-10 my-auto py-2 flex justify-center items-center">
            <svg className="w-52 h-52 xl:w-64 xl:h-64 text-sky-200/35 transition-all duration-300" viewBox="0 0 200 200" fill="none" stroke="currentColor">
              <path d="M 10 160 Q 60 140, 100 160 T 190 150" strokeWidth="1.2" strokeDasharray="3 3" />
              <path d="M 20 170 Q 70 150, 120 170 T 200 160" strokeWidth="1" />
              
              <path d="M 100 30 L 70 180 M 100 30 L 130 180" strokeWidth="2" />
              <path d="M 80 80 L 120 80 M 75 120 L 125 120 M 72 150 L 128 150" strokeWidth="1.5" />
              <path d="M 80 80 L 125 120 M 120 80 L 75 120 M 75 120 L 128 150 M 125 120 L 72 150" strokeWidth="1" />
              <circle cx="100" cy="30" r="3" fill="currentColor" />

              <path d="M 50 70 L 30 180 M 50 70 L 70 180" strokeWidth="1.5" />
              <path d="M 40 110 L 60 110 M 35 145 L 65 145" strokeWidth="1" />
              <circle cx="50" cy="70" r="2.5" fill="currentColor" />

              <path d="M 150 70 L 130 180 M 150 70 L 170 180" strokeWidth="1.5" />
              <path d="M 140 110 L 160 110 M 135 145 L 165 145" strokeWidth="1" />
              <circle cx="150" cy="70" r="2.5" fill="currentColor" />

              <circle cx="160" cy="50" r="3" fill="#ffffff" className="animate-pulse" />
            </svg>
          </div>

          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-sky-400/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* PANEL KANAN (FORM DINAMIS) */}
        <div className="md:col-span-7 p-6 xl:p-8 flex flex-col justify-between overflow-y-auto">
          
          {/* JUDUL UTAMA FORM */}
          <div className="w-full max-w-md mx-auto pt-1">
            <h2 className="text-xl xl:text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSignUp ? 'Daftar Akun Baru' : 'Masuk'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSignUp ? 'Lengkapi data berikut untuk membuat akun baru.' : 'Silakan masukkan akun Anda untuk melanjutkan.'}
            </p>
          </div>

          {/* STATUS NOTIFICATION MESSAGE */}
          {activeMessage && (
            <div
              className={`w-full max-w-md mx-auto px-3.5 py-2.5 rounded-xl text-xs font-medium border ${
                activeMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {activeMessage.text}
            </div>
          )}

          {/* FORM CONTENT */}
          <div className="w-full max-w-md mx-auto my-auto py-2 space-y-3 text-xs">
            {!isSignUp ? (
              /* ================= FORM SIGN IN ================= */
              <form onSubmit={handleSignInSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block font-bold tracking-wider text-slate-600 text-[10px] uppercase">
                    EMAIL
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      required
                      value={signInUsername}
                      onChange={(e) => setSignInUsername(e.target.value)}
                      placeholder="Email"
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-800 placeholder:text-slate-400 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold tracking-wider text-slate-600 text-[10px] uppercase">
                    KATA SANDI
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Kata Sandi"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-800 placeholder:text-slate-400 transition-all text-xs"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  <div className="text-right pt-0.5">
                    <button type="button" className="text-sky-600 hover:text-[#0070ba] font-semibold text-[11px] hover:underline transition-colors">
                      Lupa Kata Sandi?
                    </button>
                  </div>
                </div>

                {/* CAPTCHA */}
                {clientEnv.turnstileSiteKey && (
                  <div className="flex justify-center my-1">
                    <Turnstile
                      siteKey={clientEnv.turnstileSiteKey}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#0070ba] hover:bg-[#005c99] active:bg-[#004a80] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md mt-1 disabled:opacity-50"
                >
                  <span>{loading ? 'MEMPROSES...' : 'MASUK'}</span>
                </button>
              </form>
            ) : (
              /* ================= FORM SIGN UP ================= */
              <form onSubmit={handleSignUpSubmit} className="space-y-2.5">
                <div className="space-y-1">
                  <label className="block font-bold tracking-wider text-slate-600 text-[10px] uppercase">
                    NAMA LENGKAP
                  </label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-800 placeholder:text-slate-400 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold tracking-wider text-slate-600 text-[10px] uppercase">
                    ALAMAT EMAIL
                  </label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-800 placeholder:text-slate-400 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block font-bold tracking-wider text-slate-600 text-[10px] uppercase">
                      KATA SANDI
                    </label>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Kata Sandi"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-800 placeholder:text-slate-400 transition-all text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold tracking-wider text-slate-600 text-[10px] uppercase">
                      KONFIRMASI SANDI
                    </label>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Konfirmasi Kata Sandi"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-slate-800 placeholder:text-slate-400 transition-all text-xs"
                    />
                  </div>
                </div>

                {clientEnv.turnstileSiteKey && (
                  <div className="flex justify-center my-1">
                    <Turnstile
                      siteKey={clientEnv.turnstileSiteKey}
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#0070ba] hover:bg-[#005c99] active:bg-[#004a80] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md mt-2 disabled:opacity-50"
                >
                  <span>{loading ? 'MENDAFTAR...' : 'DAFTAR AKUN'}</span>
                </button>
              </form>
            )}

            {/* NAVIGASI TOGGLE FORM */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px]">
              <span className="text-slate-500">
                {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
              </span>
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setStatusMessage(null);
                }}
                className="text-[#0070ba] font-bold hover:underline transition-all"
              >
                {isSignUp ? 'Masuk' : 'Daftar Akun Baru'}
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-5xl w-full mx-auto flex items-center justify-between shrink-0 text-[10px] text-slate-400 py-1 mt-2">
        <div>© 2026 Infrastruktur Pasif</div>
        <div>Portal Layanan Registrasi</div>
      </footer>

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-slate-50 flex items-center justify-center">Memuat...</div>}>
      <AuthContent />
    </Suspense>
  );
}
