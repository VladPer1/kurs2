import React from 'react';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-4" role="alert">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 text-red-500">
          <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
          <p className="text-sm text-red-700 mt-1">{message || 'Произошла ошибка при загрузке данных.'}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          Повторить запрос
        </button>
      )}
    </div>
  );
}

