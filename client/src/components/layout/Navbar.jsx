import React from "react";
import {
  GraduationCap,
  BookOpen,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ activePage, onNavigate }) {
  const { user, logoutUser, hasRole, hasPermission } = useAuth();
  const showAdmin = hasRole("admin") || hasPermission("users:view_all");

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate("catalog")}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              Course<span className="text-indigo-400">Store</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onNavigate("catalog")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activePage === "catalog"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Каталог курсов</span>
            </button>

            {user && (
              <button
                onClick={() => onNavigate("cabinet")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  activePage === "cabinet"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Личный кабинет</span>
              </button>
            )}

            {showAdmin && (
              <button
                onClick={() => onNavigate("admin")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  activePage === "admin"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Админ-панель</span>
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl">
                <span className="text-sm font-medium text-slate-200">
                  {user.full_name}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {user.role?.name || user.role}
                </span>
              </div>
              <button
                onClick={() => logoutUser()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Выйти</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate("auth")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25"
            >
              <LogIn className="w-4 h-4" />
              <span>Войти</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
