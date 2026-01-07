import React, { useState } from 'react';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type NavbarProps = {
  onAuthClick: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
};

export default function Navbar({ onAuthClick, currentPage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const leagueFont = {
    fontFamily: `'League Spartan', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
  };

  const NavItem = ({
    label,
    page,
    colorClasses,
    onClick,
  }: {
    label: string;
    page: string;
    colorClasses: string;
    onClick?: () => void;
  }) => {
    const isActive = currentPage === page;

    return (
      <button
        onClick={() => {
          onNavigate(page);
          if (onClick) onClick();
        }}
        aria-current={isActive ? 'page' : undefined}
        className={`inline-flex items-center px-4 py-2 rounded-full text-base font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-60 ${
          isActive
            ? `${colorClasses} shadow-sm text-gray-900`
            : `text-gray-700 hover:text-gray-900 ${colorClasses}`
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-300"
      style={leagueFont}
    >
      {/* ===== DESKTOP: unchanged for md+ ===== */}
      <div className="hidden md:flex w-full px-10 py-4 justify-between items-center">
        {/* LEFT: logo (bigger visual scale but same navbar height) */}
        <div className="flex items-center">
          <button
            onClick={() => onNavigate('home')}
            aria-label="Go to home"
            className="flex items-center"
          >
            <img
              src="/logo.png"
              alt="arz"
              className="h-14 w-auto object-contain transform scale-150 origin-left"
            />
          </button>
        </div>

        {/* CENTER: nav links */}
        <div className="flex items-center gap-10">
          <NavItem
            label="For You"
            page="for-you"
            // For You color: #FFD700 (gold)
            colorClasses="hover:bg-[#FFD700] active:bg-[#FFD700] bg-[#FFD700]/0"
          />
          <NavItem
            label="Experiences"
            page="experiences"
            // Experiences color: #FF785A
            colorClasses="hover:bg-[#FF785A] active:bg-[#FF785A] bg-[#FF785A]/0"
          />
          <NavItem
            label="Trips"
            page="trips"
            // Trips color: #ABDF8B
            colorClasses="hover:bg-[#ABDF8B] active:bg-[#ABDF8B] bg-[#ABDF8B]/0"
          />
        </div>

        {/* RIGHT: login/profile button */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* My Tickets */}
              <button
                onClick={() => onNavigate('my-tickets')}
                className="px-4 py-2 rounded-full text-base font-semibold text-gray-900 hover:bg-gray-100 transition-all duration-200"
              >
                My Tickets
              </button>
              
              {/* Profile/Logout */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200">
                  <User size={20} />
                  <span className="text-sm font-semibold">
                    {profile?.full_name || profile?.username || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => onNavigate('profile')}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-t-xl transition-colors"
                  >
                    My Profile
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={async () => {
                      await signOut();
                      onNavigate('home');
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-4 py-2 rounded-full text-base font-semibold text-gray-900 hover:bg-gray-200 transition-all duration-200"
            >
              Login/Signup
            </button>
          )}
        </div>
      </div>

      {/* ===== MOBILE: only for small screens (md:hidden) ===== */}
      <div className="flex md:hidden w-full px-4 py-3 items-center justify-between">
        {/* LEFT: logo aligned left on mobile */}
        <div className="flex items-center">
          <button
            onClick={() => onNavigate('home')}
            aria-label="Go to home"
            className="flex items-center"
          >
            <img src="/logo.png" alt="arz" className="h-10 w-auto object-contain" />
          </button>
        </div>

        {/* spacer to keep center area flexible */}
        <div className="flex-1" />

        {/* RIGHT: hamburger only */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen((s) => !s)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Open menu"
          >
            {mobileOpen ? (
              <X size={20} className="text-gray-700" />
            ) : (
              <Menu size={20} className="text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-over / menu (simple full-screen panel) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm p-6 md:hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="arz" className="h-10 w-auto object-contain" />
              <span className="text-lg font-bold">Menu</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <NavItem
              label="For You"
              page="for-you"
              colorClasses="hover:bg-[#FFD700] active:bg-[#FFD700] bg-[#FFD700]/0"
              onClick={() => setMobileOpen(false)}
            />

            <NavItem
              label="Experiences"
              page="experiences"
              colorClasses="hover:bg-[#FF785A] active:bg-[#FF785A] bg-[#FF785A]/0"
              onClick={() => setMobileOpen(false)}
            />

            <NavItem
              label="Trips"
              page="trips"
              colorClasses="hover:bg-[#ABDF8B] active:bg-[#ABDF8B] bg-[#ABDF8B]/0"
              onClick={() => setMobileOpen(false)}
            />
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 flex flex-col gap-4">
            {isAuthenticated && user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setMobileOpen(false);
                  }}
                  className="px-4 py-2 rounded-full text-base font-semibold text-gray-900 hover:bg-gray-200 transition-all duration-200"
                >
                  My Profile
                </button>
                
                <button
                  onClick={() => {
                    onNavigate('my-tickets');
                    setMobileOpen(false);
                  }}
                  className="px-4 py-2 rounded-full text-base font-semibold text-gray-900 hover:bg-gray-200 transition-all duration-200"
                >
                  My Tickets
                </button>
                
                <div className="px-4 py-2 text-sm text-gray-700">
                  Signed in as <span className="font-semibold">{profile?.full_name || profile?.username || user.email?.split('@')[0]}</span>
                </div>
                
                <button
                  onClick={async () => {
                    await signOut();
                    setMobileOpen(false);
                    onNavigate('home');
                  }}
                  className="px-4 py-2 rounded-full text-base font-semibold text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onAuthClick();
                  setMobileOpen(false);
                }}
                className="px-4 py-2 rounded-full text-base font-semibold text-gray-900 hover:bg-gray-200 transition-all duration-200"
              >
                Login / Signup
              </button>
            )}

            <div className="mt-4 text-sm text-gray-600">
              <div className="font-medium mb-2">Quick links</div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    onNavigate('for-you');
                    setMobileOpen(false);
                  }}
                  className="px-3 py-1 rounded-full text-sm hover:bg-gray-100"
                >
                  For You
                </button>
                <button
                  onClick={() => {
                    onNavigate('experiences');
                    setMobileOpen(false);
                  }}
                  className="px-3 py-1 rounded-full text-sm hover:bg-gray-100"
                >
                  Experiences
                </button>
                <button
                  onClick={() => {
                    onNavigate('trips');
                    setMobileOpen(false);
                  }}
                  className="px-3 py-1 rounded-full text-sm hover:bg-gray-100"
                >
                  Trips
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
