'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function UserManagement() {
  const { role } = useAuth();
  const router = useRouter();
  
  // State untuk navigasi tampilan view: 'list' | 'create' | 'edit'
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [activeMenu, setActiveMenu] = useState('user_management');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Jika user bukan Super Admin, tampilkan halaman Akses Ditolak (403)
  if (role !== 'Super Admin') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
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

        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 max-w-md w-full">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">🔒</div>
            <h2 className="text-lg font-bold text-red-600">403 - Access denied</h2>
            <p className="text-xs text-slate-500">Your role ({role}) cannot open: User Management, Create user accounts, Assign roles</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
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
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="bg-white/10 px-3 py-1 rounded-lg text-xs">
            {role}
          </span>
        </div>
      </header>

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
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {(role === 'Super Admin' || role === 'Web') && (
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

            {/* User Management (Hanya untuk Super Admin) */}
            {role === 'Super Admin' && (
              <button 
                onClick={() => { setActiveMenu('user_management'); router.push('/user_management'); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl bg-sky-50 text-[#0070ba] transition-colors"
              >
                <svg className="w-5 h-5 text-[#0070ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl pt-4 border-t border-slate-100 mt-4 transition-colors"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </nav>

          <div className="text-xs text-slate-400 space-y-1 pt-4 border-t border-slate-100">
            <button className="hover:underline flex items-center gap-2">‹ Collapse menu</button>
            <p>App version 0.1</p>
            <p>Copyright</p>
          </div>
        </aside>

        {/* Konten Utama (Dinamis Berdasarkan View) */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* VIEW 1: USER MANAGEMENT LIST */}
          {currentView === 'list' && (
            <>
              <h1 className="text-xl font-bold text-slate-800">User Management</h1>

              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-800">Users</h2>
                
                {/* Filter & Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Search</label>
                    <input type="text" placeholder="Name or email" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Role</label>
                    <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0070ba]">
                      <option>All roles</option>
                      <option>User</option>
                      <option>Web Manager</option>
                      <option>Super Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Status</label>
                    <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0070ba]">
                      <option>All</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <div>
                    <button 
                      onClick={() => setCurrentView('create')}
                      className="w-full px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>+ Create user</span>
                    </button>
                  </div>
                </div>

                {/* Tabel Data */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Created</th>
                        <th className="p-3.5 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-500">
                      {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                        <tr key={row} className="hover:bg-slate-50">
                          <td className="p-3.5">-</td>
                          <td className="p-3.5">-</td>
                          <td className="p-3.5">-</td>
                          <td className="p-3.5">-</td>
                          <td className="p-3.5">-</td>
                          <td className="p-3.5 text-right space-x-1 pr-6 font-medium">
                            <button onClick={() => setCurrentView('edit')} className="text-[#0070ba] hover:underline">Edit</button>
                            <span className="text-slate-300">|</span>
                            <button className="text-[#0070ba] hover:underline">Reset password</button>
                            <span className="text-slate-300">|</span>
                            <button className="text-red-600 hover:underline">Deactivate</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                  <span>Showing 1-10 of 0</span>
                  <div className="flex items-center gap-2">
                    <span>Rows per page</span>
                    <select className="border border-slate-200 rounded px-2 py-1 bg-white">
                      <option>10</option>
                    </select>
                    <button className="px-2 py-1 border rounded bg-white text-slate-300">‹</button>
                    <button className="px-3 py-1 border rounded bg-[#0070ba] text-white">1</button>
                    <button className="px-2.5 py-1 border rounded bg-white">2</button>
                    <button className="px-2.5 py-1 border rounded bg-white">3</button>
                    <button className="px-2.5 py-1 border rounded bg-white">›</button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* VIEW 2: CREATE USER */}
          {currentView === 'create' && (
            <>
              <h1 className="text-xl font-bold text-slate-800">User Management / Create User</h1>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Full name *</label>
                      <input type="text" placeholder="Enter name" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Email *</label>
                      <input type="email" placeholder="Enter email" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Initial password *</label>
                      <input type="password" placeholder="Enter password" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Confirm password *</label>
                      <input type="password" placeholder="Repeat password" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba]" />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role</h3>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="role" defaultChecked className="mt-0.5 text-[#0070ba]" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">User</p>
                        <p className="text-[11px] text-slate-500">Upload and view own submissions and records</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="role" className="mt-0.5 text-[#0070ba]" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Web Manager</p>
                        <p className="text-[11px] text-slate-500">View all submissions, records and audit logs</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="role" className="mt-0.5 text-[#0070ba]" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Super Admin</p>
                        <p className="text-[11px] text-slate-500">Full access including account management</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Account Active Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0070ba] rounded" />
                  <span className="text-xs font-semibold text-slate-700">Account active</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setCurrentView('list')} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
                    ✕ Cancel
                  </button>
                  <button onClick={() => setCurrentView('list')} className="px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm">
                    + Create user
                  </button>
                </div>
              </div>
            </>
          )}

          {/* VIEW 3: EDIT USER */}
          {currentView === 'edit' && (
            <>
              <h1 className="text-xl font-bold text-slate-800">User Management / Edit User</h1>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">User information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Full name</label>
                      <input type="text" defaultValue="User name" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Email</label>
                      <input type="email" defaultValue="user@email.com" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50" />
                    </div>
                  </div>
                </div>

                {/* Role Account Type */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role</h3>
                  <label className="text-xs font-semibold text-slate-600">Account type</label>
                  <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0070ba]">
                    <option>User</option>
                    <option>Web Manager</option>
                    <option>Super Admin</option>
                  </select>
                </div>

                {/* Reset Password Section */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reset password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">New password</label>
                      <input type="password" placeholder="Enter new password" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Confirm new password</label>
                      <input type="password" placeholder="Repeat new password" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0070ba]" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button className="px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm flex items-center gap-2">
                      <span>🔑 Reset password</span>
                    </button>
                  </div>
                </div>

                {/* Account Status */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account status</h3>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0070ba] rounded" />
                    <span className="text-xs font-semibold text-slate-700">Account active</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Deactivate to block login. Reactivate to restore access.</p>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <button className="px-4 py-2 bg-[#991b1b] text-white rounded-lg text-xs font-semibold hover:bg-[#7f1d1d] transition-colors shadow-sm">
                      ✕ Deactivate account
                    </button>
                    <button className="px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm">
                      ✓ Reactivate account
                    </button>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setCurrentView('list')} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
                    ✕ Cancel
                  </button>
                  <button onClick={() => setCurrentView('list')} className="px-4 py-2 bg-[#0070ba] text-white rounded-lg text-xs font-semibold hover:bg-[#005c99] transition-colors shadow-sm">
                    💾 Save changes
                  </button>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}