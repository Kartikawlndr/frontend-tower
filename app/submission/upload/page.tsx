'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadExcelPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('submission');

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
          <span className="cursor-pointer hover:opacity-80">Normal User ▾</span>
        </div>
      </header>

      {/* BODY UTAMA (Sidebar Kiri & Konten Kanan) */}
      <div className="flex flex-1 min-h-0">
        
        {/* SIDEBAR KIRI */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-4">
          <nav className="space-y-1.5">
            {/* Dashboard */}
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>

            {/* Data Submission */}
            <button 
              onClick={() => router.push('/submission')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl bg-sky-50 text-[#0070ba] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Data Submission
            </button>

            {/* Tower Records */}
            <button 
              onClick={() => setActiveMenu('records')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Tower Records
            </button>

            {/* Account */}
            <button 
              onClick={() => setActiveMenu('account')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </button>

            {/* Log out */}
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

        {/* KONTEN UTAMA UPLOAD EXCEL */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <h1 className="text-xl font-bold text-slate-800">Data Submission / Upload Excel</h1>
         
          {/* KARTU UPLOAD FILE */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Upload file</h2>
            
            {/* Area Drag & Drop */}
            <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 text-sky-500 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-700">Drag and drop .xlsx file here</div>
              <div className="text-xs text-slate-400">or</div>
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 flex items-center gap-2">
                📂 Choose file
              </button>
            </div>

            {/* Pratinjau File yang Diunggah */}
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="text-blue-600">📄</span> tower-data.xlsx
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>1.2 MB</span>
                <button className="text-red-500 hover:text-red-700 font-bold">✕</button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">Each row is one tenant relationship. Rows are validated and checked for duplicates before saving.</p>
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shrink-0">
                📥 Download template
              </button>
            </div>
          </section>

          {/* KARTU EXCEL COLUMN GUIDE */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Excel column guide</h2>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3.5">No</th>
                    <th className="p-3.5">Field</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Rule</th>
                    <th className="p-3.5">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-500">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((row) => (
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

            {/* Tombol Aksi Bawah */}
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => router.push('/submission')}
                className="px-5 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-5 py-2.5 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm flex items-center gap-2">
                Upload / Submit
              </button>
            </div>
          </section>

        </main>
      </div>

    </div>
  );
}