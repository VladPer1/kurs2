import React, { useState } from 'react';
import EnrollmentsTab from '../components/cabinet/EnrollmentsTab';
import CardsTab from '../components/cabinet/CardsTab';
import PaymentsTab from '../components/cabinet/PaymentsTab';

export default function CabinetPage() {
  const [activeTab, setActiveTab] = useState('enrollments');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Личный кабинет</h1>
          <p className="text-sm text-slate-400 mt-1">Управление записями, банковскими картами и историей оплат</p>
        </div>
      </div>

      <div className="flex border-b border-slate-800 overflow-x-auto gap-2 text-sm">
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'enrollments'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Мои записи
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'cards'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Мои карты
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          История оплат
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'enrollments' && <EnrollmentsTab />}
        {activeTab === 'cards' && <CardsTab />}
        {activeTab === 'payments' && <PaymentsTab />}
      </div>
    </div>
  );
}

