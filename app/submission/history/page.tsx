'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmissionHistoryPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('submission');

  // State untuk filter pencarian
  const [regNumber, setRegNumber] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('All');

  const handleReset = () => {
    setRegNumber('');
    setDateFrom('');
    setDateTo('');
    setStatus('All');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ regNumber, dateFrom, dateTo, status });
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
          <span className="cursor-pointer hover:opacity-80">Normal User ▾</span>
        </div>
      </header>

      {/* BODY UTAMA */}
      <div className="flex flex-1 min-h-0">
        
        {/* SIDEBAR KIRI */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-4">
          <nav className="space-y-1.5">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>

            <button 
              onClick={() => setActiveMenu('submission')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl bg-sky-50 text-[#0070ba] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Data Submission
            </button>

            <button 
              onClick={() => setActiveMenu('records')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Tower Records
            </button>

            <button 
              onClick={() => setActiveMenu('account')}
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

        {/* KONTEN UTAMA */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
             
          <h1 className="text-xl font-bold text-slate-800">
            Submission History
          </h1>

          {/* KARTU FILTER */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Filter</h2>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Registration Number */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Registration number</label>
                  <input 
                    type="text" 
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="Search" 
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba] text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date from</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="DD/MM/YYYY" 
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba] text-slate-700 placeholder:text-slate-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs pointer-events-none">📅</span>
                  </div>
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date to</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="DD/MM/YYYY" 
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba] text-slate-700 placeholder:text-slate-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs pointer-events-none">📅</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba] text-slate-700 bg-white"
                  >
                    <option value="All">All</option>
                    <option value="Registered">Registered</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

            {/* TOMBOL ACTION FILTER */}
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-[#0070ba] text-[#0070ba] hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#0070ba] hover:bg-[#005c99] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </form> 
        </section>

          {/* KARTU TABEL SUBMISSIONS */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Submissions</h2>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3.5">Registration No.</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Rows</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-500">
                  {[...Array(8)].map((_, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">-</td>
                      <td className="p-3.5">
                        <button 
                        onClick={() => router.push('/submission/history/detail')}
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

            {/* PAGINATION & FOOTER TABEL */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-500">
              <div>Showing 1-10 of 0</div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select className="border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none">
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button className="p-1.5 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
                    ‹
                  </button>
                  <button className="w-7 h-7 bg-[#0070ba] text-white font-medium rounded">
                    1
                  </button>
                  <button className="w-7 h-7 hover:bg-slate-100 rounded text-slate-700 font-medium">
                    2
                  </button>
                  <button className="w-7 h-7 hover:bg-slate-100 rounded text-slate-700 font-medium">
                    3
                  </button>
                  <button className="p-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50">
                    ›
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* TOMBOL KEMBALI KE DATA SUBMISSION */}
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => router.push('/submission')}
              className="px-4 py-2 border border-[#0070ba] text-[#0070ba] rounded-lg text-xs font-semibold hover:bg-sky-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className="text-sm font-bold">&lt;</span>
              <span>Back to Submission</span>
            </button>
          </div>

        </main>
      </div>

    </div>
  );
}