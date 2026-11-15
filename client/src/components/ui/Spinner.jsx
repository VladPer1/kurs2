import React from 'react';

export default function Spinner({ text = 'Загрузка...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 w-full" role="status" aria-live="polite">
      <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      {text && <p className="text-slate-400 font-medium text-sm mt-3">{text}</p>}
    </div>
  );
}

