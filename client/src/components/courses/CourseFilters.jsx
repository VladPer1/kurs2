import React from 'react';

export default function CourseFilters({ filters = {}, onChange, onReset }) {
  const { search = '', min_price = '', max_price = '' } = filters;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onChange) {
      onChange({
        ...filters,
        [name]: value,
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-4 items-center flex-1">
        {/* Поиск по названию */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            name="search"
            value={search}
            onChange={handleChange}
            placeholder="Поиск по названию..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Минимальная цена */}
        <div className="w-36">
          <input
            type="number"
            name="min_price"
            value={min_price}
            onChange={handleChange}
            placeholder="Мин. цена"
            min="0"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Максимальная цена */}
        <div className="w-36">
          <input
            type="number"
            name="max_price"
            value={max_price}
            onChange={handleChange}
            placeholder="Макс. цена"
            min="0"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Кнопка Сбросить */}
      <div>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}

