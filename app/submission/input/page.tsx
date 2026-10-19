'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplicationFormPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('submission');
  const [tenants, setTenants] = useState(['', '']); // Default 2 tenant sesuai gambar

  const addTenant = () => {
    setTenants([...tenants, '']);
  };

  const removeTenant = (index: number) => {
    const updated = tenants.filter((_, i) => i !== index);
    setTenants(updated);
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

        {/* KONTEN UTAMA APPLICATION FORM */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <h1 className="text-xl font-bold text-slate-800">Data Submission / Application Form</h1>
        
          {/* 2. TOWER IDENTITY */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Tower identity</h2>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kode/ID menara *</label>
                <input type="text" placeholder="Enter tower ID" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
                <span className="text-[11px] text-slate-400 mt-1 block">Max 50 characters</span>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nama pemilik menara telekomunikasi *</label>
                <input type="text" placeholder="Enter owner name" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
                <span className="text-[11px] text-slate-400 mt-1 block">Max 50 characters</span>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Tahun pembangunan *</label>
                <div className="relative">
                  <input type="text" placeholder="YYYY" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
                  <span className="absolute right-3 top-2.5 text-slate-400">📅</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">1900 to current year</span>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Jenis menara telekomunikasi *</label>
                <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#0070ba] text-slate-500">
                  <option>Select type</option>
                  <option>Greenfield</option>
                  <option>Rooftop</option>
                </select>
              </div>
            </div>
          </section>

          {/* 3. TENANTS */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Tenants</h2>
            <p className="text-xs text-slate-500">Each row represents one tenant relationship</p>

            <div className="space-y-3">
              {tenants.map((_, index) => (
                <div key={index} className="space-y-1">
                  <label className="block text-xs text-slate-700 font-medium">
                    Penyelenggara jaringan telekomunikasi (tenant {index + 1}) *
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="Enter tenant name" 
                      className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0070ba]" 
                    />
                    {tenants.length > 1 && (
                      <button 
                        onClick={() => removeTenant(index)}
                        className="px-3 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1 shrink-0"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block">Max 50 characters</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button 
                onClick={addTenant}
                className="px-4 py-2 bg-sky-50 text-[#0070ba] border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition-colors flex items-center gap-1.5"
              >
                + Add tenant
              </button>
            </div>
          </section>

          {/* 4. LOCATION */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Location</h2>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Longitude (degree) *</label>
                <input type="text" placeholder="e.g. 106.816666" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
                <span className="text-[11px] text-slate-400 mt-1 block">95 to 141, 6 decimals</span>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Latitude (degree) *</label>
                <input type="text" placeholder="e.g. -6.200000" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
                <span className="text-[11px] text-slate-400 mt-1 block">-11 to 6, 6 decimals</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-medium mb-1">Alamat *</label>
              <input type="text" placeholder="Enter address" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
              <span className="text-[11px] text-slate-400 mt-1 block">Max 50 characters</span>
            </div>
          </section>

          {/* 5. SPECIFICATION */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Specification</h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Tinggi menara (AGL, meter) *</label>
                <input type="text" placeholder="e.g. 42" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
                <span className="text-[11px] text-slate-400 mt-1 block">Max 3 digits</span>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kapasitas maksimal *</label>
                <input type="text" placeholder="Enter value" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kapasitas disewakan *</label>
                <input type="text" placeholder="Enter value" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kapasitas digunakan sendiri *</label>
                <input type="text" placeholder="Enter value" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0070ba]" />
              </div>
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="flex justify-end gap-3 pt-6">
              <button 
                onClick={() => router.push('/submission')}
                className="px-5 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-5 py-2.5 bg-amber-400 text-slate-900 rounded-lg text-xs font-semibold hover:bg-amber-500 transition-colors shadow-sm flex items-center gap-1.5">
                💾 Save as draft
              </button>
              <button className="px-5 py-2.5 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm flex items-center gap-1.5">
                📤 Submit
              </button>
            </div>
          </section>

        </main>
      </div>

    </div>
  );
}