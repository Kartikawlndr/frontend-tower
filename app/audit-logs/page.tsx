'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function AuditLogsPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('audit-logs');

  // Jika user adalah Normal User, tampilkan Access Denied (403)
  if (role === 'Normal User') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-[#0070ba] text-white px-6 flex items-center justify-between shadow-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden p-1">
              <img src="/Logodashboard.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-base tracking-wide">Infrastruktur Pasif</span>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-lg text-xs font-medium">
            {role}
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-4">
            <nav className="space-y-1.5">
              <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Dashboard</button>
              <button onClick={() => router.push('/submission')} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Data Submission</button>
              <button onClick={() => router.push('/records')} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Tower Records</button>
              <button onClick={() => router.push('/account')} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Account</button>
            </nav>
          </aside>

          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 max-w-md w-full">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">🔒</div>
              <h2 className="text-lg font-bold text-red-600">403 - Access denied</h2>
              <p className="text-xs text-slate-500">Your role ({role}) cannot open: Audit Logs</p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-[#0070ba] text-white px-6 flex items-center justify-between shadow-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden p-1">
            <img src="/Logodashboard.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-base tracking-wide">Infrastruktur Pasif</span>
        </div>
        <div className="bg-white/10 px-3 py-1 rounded-lg text-xs font-medium">
          {role}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* SIDEBAR KIRI */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-4">
          <nav className="space-y-1.5">
            <button 
              onClick={() => { setActiveMenu('dashboard'); router.push('/dashboard'); }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>

            <button 
              onClick={() => { setActiveMenu('submission'); router.push('/submission'); }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl bg-sky-50 text-[#0070ba] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Data Submission
            </button>

            <button 
              onClick={() => { setActiveMenu('records'); router.push('/records');}}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Tower Records
            </button>

            {(role === 'Web Manager' || role === 'Super Admin') && (
            <button 
              onClick={() => { setActiveMenu('audit-logs'); router.push('/audit-logs'); }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Audit Logs
            </button>
            )}

            {/* User Accounts (Hanya untuk Super Admin) */}
            {role === 'Super Admin' && (
              <button 
                onClick={() => { setActiveMenu('user_management'); router.push('/user_management'); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                User Management
              </button>
            )}

            <button 
              onClick={() => { setActiveMenu('account'); router.push('/account'); }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </button>

            <button 
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors pt-4 border-t border-slate-100 mt-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </nav>

          <div className="text-[11px] text-slate-400 px-3 space-y-0.5">
            <div>App version 0.1</div>
            <div>Copyright</div>
            <div className="pt-2 text-slate-500 font-medium">‹ Collapse menu</div>
          </div>
        </aside>

        {/* Konten Audit Logs */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <h1 className="text-xl font-bold text-slate-800">Audit Logs</h1>
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">System activities and history logs</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-500">
                  {[1, 2, 3, 4].map((row) => (
                    <tr key={row} className="hover:bg-slate-50">
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}