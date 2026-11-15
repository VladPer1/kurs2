import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
        <h3 className="text-lg font-bold text-white">{title || 'Подтверждение'}</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{message || 'Вы уверены, что хотите выполнить это действие?'}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-red-900/20"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
