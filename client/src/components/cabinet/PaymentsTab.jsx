import React, { useState, useEffect } from 'react';
import { getMyPayments } from '../../api/payments.api';
import { formatPrice, formatDate, getErrorMessage } from '../../utils/formatters';

export default function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyPayments();
      const list = Array.isArray(res) ? res : res?.data || res?.payments || [];
      setPayments(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm p-4">Загрузка истории оплат...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">История оплат</h2>

      {error && <div className="p-3 bg-red-900/50 text-red-200 rounded text-sm">{error}</div>}

      {payments.length === 0 ? (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-slate-400 text-sm">
          У вас пока нет истории транзакций и оплат.
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">№ / Референс</th>
                  <th className="p-4 font-semibold">Название курса</th>
                  <th className="p-4 font-semibold">Сумма</th>
                  <th className="p-4 font-semibold">Статус</th>
                  <th className="p-4 font-semibold">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {payments.map((payment) => {
                  const courseTitle = payment.enrollment?.course?.title || payment.course?.title || '—';
                  const amountFormatted = formatPrice(payment.amount);
                  const paidAtFormatted = formatDate(payment.paid_at || payment.createdAt || payment.created_at);
                  const ref = payment.transaction_ref || payment.id;
                  const status = payment.status;

                  return (
                    <tr key={payment.id || ref} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-indigo-400">{ref}</td>
                      <td className="p-4 font-medium text-white">{courseTitle}</td>
                      <td className="p-4 font-semibold text-emerald-400">{amountFormatted}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${
                          status === 'succeeded' || status === 'completed' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' :
                          status === 'pending' ? 'bg-amber-900/50 text-amber-300 border border-amber-700' :
                          'bg-red-900/50 text-red-300 border border-red-700'
                        }`}>
                          {status === 'succeeded' || status === 'completed' ? 'Успешно' :
                           status === 'pending' ? 'В обработке' :
                           status === 'failed' ? 'Ошибка' : status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">{paidAtFormatted}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

