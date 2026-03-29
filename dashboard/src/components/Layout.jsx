import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/',            label: 'Dashboard',     exact: true },
  { to: '/recalculate', label: 'Recalculate'              },
  { to: '/digest',      label: 'Weekly Digest'            },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate           = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-dim sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Wordmark */}
          <NavLink to="/" className="font-serif text-gold tracking-[0.12em] text-sm">
            CAVARI
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `font-sans text-xs tracking-widest uppercase transition-colors duration-150 ${
                    isActive ? 'text-gold' : 'text-stone hover:text-ivory'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-4">
            <NavLink
              to="/members/new"
              className="hidden md:inline-flex btn-primary text-xs tracking-widest uppercase py-2 px-4"
            >
              + Add Member
            </NavLink>
            <button
              onClick={handleSignOut}
              className="hidden md:block btn-ghost text-xs tracking-widest uppercase"
            >
              Sign out
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden text-stone hover:text-ivory p-1"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-dim">
            <div className="px-4 py-4 flex flex-col gap-4">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `font-sans text-xs tracking-widest uppercase ${
                      isActive ? 'text-gold' : 'text-stone'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/members/new"
                onClick={() => setMenuOpen(false)}
                className="font-sans text-xs tracking-widest uppercase text-stone"
              >
                + Add Member
              </NavLink>
              <button
                onClick={handleSignOut}
                className="btn-ghost text-xs tracking-widest uppercase text-left"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 py-3">
        <p className="text-stone text-2xs tracking-widest uppercase text-center font-sans">
          Cavari Intelligence — Internal use only
        </p>
      </footer>
    </div>
  )
}
