'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function DashboardPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('dashboard');


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
            {/* Dashboard */}
            <button 
              onClick={() => { setActiveMenu('dashboard'); router.push('/dashboard'); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                activeMenu === 'dashboard' 
                  ? 'bg-sky-50 text-[#0070ba]' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>

            {/* Data Submission */}
            <button
              onClick={() => { setActiveMenu('submission'); router.push('/submission'); }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Data Submission
            </button>

            {/* Tower Records */}
            <button 
              onClick={() => { setActiveMenu('records'); router.push('/records');}}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Tower Records
            </button>

            {/* Audit Logs (Hanya untuk Web Manager & Super Admin) */}
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

            {/* Account */}
            <button 
              onClick={() => { setActiveMenu('account'); router.push('/account'); }}
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

          {/* Footer Versi Aplikasi */}
          <div className="text-[11px] text-slate-400 px-3 space-y-0.5">
            <div>App version 0.1</div>
            <div>Copyright</div>
          </div>
        </aside>

        {/* KONTEN UTAMA DASHBOARD */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>

          {/* KARTU QUERY DATA (FILTER) */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Query data</h2>
            
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Kode/ID menara</label>
                <input type="text" placeholder="Search" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Nama pemilik menara</label>
                <input type="text" placeholder="Search" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Penyelenggara penyewa</label>
                <input type="text" placeholder="Search" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Jenis menara</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>All</option>
                  <option>Greenfield</option>
                  <option>Rooftop</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tahun dari</label>
                <input type="text" placeholder="YYYY" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tahun sampai</label>
                <input type="text" placeholder="YYYY" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tinggi min (m)</label>
                <input type="text" defaultValue="0" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tinggi max (m)</label>
                <input type="text" defaultValue="999" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Longitude dari</label>
                <input type="text" defaultValue="95.000000" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Longitude sampai</label>
                <input type="text" defaultValue="141.000000" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Latitude dari</label>
                <input type="text" defaultValue="-11.000000" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Latitude sampai</label>
                <input type="text" defaultValue="6.000000" className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
            {/* Tombol Reset */}
            <button className="px-4 py-2 border border-[#0070ba] text-[#0070ba] rounded-lg text-xs font-semibold hover:bg-sky-50 transition-colors flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>

            {/* Tombol Search */}
            <button className="px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors flex items-center gap-2 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
            </div>
          </section>

          {/* KARTU TOWER MAP (PETA) */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Tower map</h2>
            
            <div className="w-full h-72 bg-[#f0f8ff] rounded-xl border border-slate-200 flex flex-col justify-between p-4 relative overflow-hidden shadow-inner">
              {/* Teks Keterangan Atas */}
              <div className="text-xs text-slate-500 font-medium z-10">Map: tower locations (Indonesia)</div>
              
              {/* Simulasi Pin Peta yang Lebih Tersebar */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full relative text-blue-600">
                  <span className="absolute top-16 left-24 text-lg">📍</span>
                  <span className="absolute top-28 left-44 text-lg">📍</span>
                  <span className="absolute top-20 left-72 text-lg">📍</span>
                  <span className="absolute top-36 left-[38%] text-lg">📍</span>
                  <span className="absolute top-24 left-[52%] text-lg">📍</span>
                  <span className="absolute top-44 left-[58%] text-lg">📍</span>
                  <span className="absolute top-32 left-[68%] text-lg">📍</span>
                  <span className="absolute top-20 left-[82%] text-lg">📍</span>
                  <span className="absolute top-40 left-[88%] text-lg">📍</span>
                </div>
              </div>

              {/* Tombol Zoom Kontrol Kanan Atas */}
              <div className="absolute top-4 right-4 flex flex-col bg-white border border-slate-200 rounded-md shadow-sm z-10 overflow-hidden">
                <button className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 border-b border-slate-200 font-bold text-sm">+</button>
                <button className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold text-sm">-</button>
              </div>

              {/* Teks Keterangan Bawah */}
              <div className="text-[11px] text-slate-400 z-10">Click a pin to open the tower detail popup</div>
            </div>
          </section>

          {/* KARTU TOWER DATA (TABEL) */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">Tower data</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50">Configure columns</button>
                <button className="px-3 py-1.5 bg-sky-500 text-white rounded-md text-xs font-medium hover:bg-sky-600">Download</button>
                <button className="px-3 py-1.5 bg-sky-500 text-white rounded-md text-xs font-medium hover:bg-sky-600">Export</button>
              </div>
            </div>

            {/* TEKS SCOPE DINAMIS SESUAI ROLE */}
            <div className="text-xs text-slate-500">
              {role === 'Normal User' ? 'Showing your own records' : 'Showing all records'}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Kode/ID</th>
                    <th className="p-3">Pemilik</th>
                    <th className="p-3">Tahun</th>
                    <th className="p-3">Penyewa</th>
                    <th className="p-3">Longitude</th>
                    <th className="p-3">Latitude</th>
                    <th className="p-3">Alamat</th>
                    <th className="p-3">Jenis</th>
                    <th className="p-3">Tinggi (m)</th>
                    <th className="p-3">Kap. maks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-500">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="hover:bg-slate-50">
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                      <td className="p-3">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
              <div>Showing 1-10 of 0</div>
              <div className="flex items-center gap-3">
                <span>Rows per page</span>
                <select className="border border-slate-300 rounded px-2 py-1 bg-white">
                  <option>10</option>
                  <option>20</option>
                </select>
                <div className="flex items-center gap-1">
                  <button className="px-2 py-1 border rounded disabled:opacity-50">&lt;</button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded font-medium">1</button>
                  <button className="px-3 py-1 border rounded hover:bg-slate-50">2</button>
                  <button className="px-3 py-1 border rounded hover:bg-slate-50">3</button>
                  <button className="px-2 py-1 border rounded hover:bg-slate-50">&gt;</button>
                </div>
              </div>
            </div>

          </section>

        </main>
      </div>

    </div>
  );
}