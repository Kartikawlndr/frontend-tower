'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

export default function DataSubmissionPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('submission');
  const [submissionMethod, setSubmissionMethod] = useState('excel');


  // Tambahkan fungsi handleContinue di sini
  const handleContinue = () => {
    if (submissionMethod === 'excel') {
      router.push('/submission/upload');
    } else {
      router.push('/submission/input');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* HEADER ATAS UTAMA */}
      <header className="h-16 bg-[#0070ba] text-white px-6 flex items-center justify-between shadow-md shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden p-1">
            <img 
              src="/Logodashboard.png" 
              alt="Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <span className="font-bold text-base tracking-wide">Infrastruktur Pasif</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="bg-white/10 px-3 py-1 rounded-lg text-xs">
            {role}
          </span>
        </div>
      </header>

      {/* BODY UTAMA (Sidebar Kiri & Konten Kanan) */}
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

        {/* KONTEN UTAMA DATA SUBMISSION */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <h1 className="text-xl font-bold text-slate-800">Data Submission</h1>

          {/* KARTU CHOOSE SUBMISSION METHOD */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-800">Choose submission method</h2>
            
            <div className="space-y-4">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${submissionMethod === 'excel' ? 'border-[#0070ba] bg-sky-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                <input 
                  type="radio" 
                  name="method" 
                  checked={submissionMethod === 'excel'} 
                  onChange={() => setSubmissionMethod('excel')}
                  className="mt-1 text-[#0070ba] focus:ring-[#0070ba]" 
                />
                <div>
                  <div className="text-sm font-bold text-slate-800">Upload Excel</div>
                  <div className="text-xs text-slate-500 mt-0.5">Submit many towers at once using an .xlsx file</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${submissionMethod === 'form' ? 'border-[#0070ba] bg-sky-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                <input 
                  type="radio" 
                  name="method" 
                  checked={submissionMethod === 'form'} 
                  onChange={() => setSubmissionMethod('form')}
                  className="mt-1 text-[#0070ba] focus:ring-[#0070ba]" 
                />
                <div>
                  <div className="text-sm font-bold text-slate-800">Application Form</div>
                  <div className="text-xs text-slate-500 mt-0.5">Fill in one tower at a time using a form</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleContinue}
                className="px-5 py-2.5 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors flex items-center gap-2 shadow-sm"
              >
                Continue
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

          {/* KARTU TABEL YOUR RECENT SUBMISSIONS */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Your recent submissions</h2>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3.5">Registration No.</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-500">
                  {/* Contoh data dummy dengan status berbeda (Failed / Successful) */}
                  {[
                    { regNo: 'REG-0001', date: '12/10/2026', method: 'Upload Excel', status: 'Failed' },
                    { regNo: 'REG-0002', date: '13/10/2026', method: 'Application Form', status: 'Successful' },
                    { regNo: 'REG-0003', date: '14/10/2026', method: 'Upload Excel', status: 'Successful' },
                  ].map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-medium text-slate-800">{item.regNo}</td>
                      <td className="p-3.5">{item.date}</td>
                      <td className="p-3.5">{item.method}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          item.status === 'Successful' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button 
                          onClick={() => {
                            // Mengarahkan ke halaman detail dengan membawa status sesuai baris yang diklik
                            const targetStatus = item.status.toLowerCase(); // 'failed' atau 'successful'
                            router.push(`/submission/validation?status=${targetStatus}`);
                          }}
                          className="text-[#0070ba] font-medium hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

            {/* TOMBOL VIEW ALL HISTORY */}
            <div className="flex justify-end pt-2">
              <Link 
                href="/submission/history"
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                View all history
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

        </main>
      </div>

    </div>
  );
}