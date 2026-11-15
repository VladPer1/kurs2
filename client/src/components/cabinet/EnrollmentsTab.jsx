import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getMyEnrollments, cancelEnrollment } from '../../api/enrollments.api';
import { getCards, checkoutPayment } from '../../api/payments.api';
import { formatPrice, formatDate, getErrorMessage } from '../../utils/formatters';
import ConfirmModal from '../ui/ConfirmModal';

export default function EnrollmentsTab() {
  const [enrollments, setEnrollments] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCards, setSelectedCards] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [enrollRes, cardsRes] = await Promise.all([
        getMyEnrollments(),
        getCards(),
      ]);
      const enrs = Array.isArray(enrollRes) ? enrollRes : enrollRes?.data || enrollRes?.enrollments || [];
      const crds = Array.isArray(cardsRes) ? cardsRes : cardsRes?.data || [];
      setEnrollments(enrs);
      setCards(crds);

      const initialSelected = {};
      enrs.forEach((enr) => {
        if (enr.status === 'pending_payment' && crds.length > 0) {
          const defaultCard = crds.find((c) => c.is_default) || crds[0];
          initialSelected[enr.id] = defaultCard.id;
        }
      });
      setSelectedCards((prev) => ({ ...initialSelected, ...prev }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCardChange = (enrollmentId, cardId) => {
    setSelectedCards((prev) => ({ ...prev, [enrollmentId]: cardId }));
  };

  const handleCheckout = async (enrollmentId) => {
    const cardId = selectedCards[enrollmentId];
    if (!cardId) {
      toast.error('Выберите банковскую карту для оплаты');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await checkoutPayment(enrollmentId, cardId);
      toast.success('Оплата прошла успешно!');
      await loadData();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const [enrollmentToCancel, setEnrollmentToCancel] = useState(null);

  const handleCancel = async (enrollmentId) => {
    setEnrollmentToCancel(enrollmentId);
  };

  const confirmCancelEnrollment = async () => {
    const enrollmentId = enrollmentToCancel;
    setEnrollmentToCancel(null);
    if (!enrollmentId) return;

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await cancelEnrollment(enrollmentId);
      toast.success('Запись отменена');
      await loadData();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm p-4">Загрузка записей...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Мои записи и оплата</h2>
      {error && <div className="p-3 bg-red-900/50 text-red-200 rounded text-sm">{error}</div>}
      {success && <div className="p-3 bg-emerald-900/50 text-emerald-200 rounded text-sm">{success}</div>}

      {enrollments.length === 0 ? (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-slate-400 text-sm">
          У вас пока нет записей на курсы.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {enrollments.map((enr) => {
            const isPending = enr.status === 'pending_payment';
            const courseTitle = enr.course?.title || 'Курс';
            const price = enr.course?.price ?? enr.price;
            const date = formatDate(enr.created_at || enr.createdAt);

            return (
              <div key={enr.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">{courseTitle}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-400 font-medium">{formatPrice(price)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">Дата: {date}</span>
                    <span className="text-slate-400">•</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      enr.status === 'confirmed' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' :
                      enr.status === 'pending_payment' ? 'bg-amber-900/50 text-amber-300 border border-amber-700' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {enr.status === 'confirmed' ? 'Подтверждено (Оплачено)' :
                       enr.status === 'pending_payment' ? 'Ожидает оплаты' : enr.status}
                    </span>
                  </div>
                </div>

                {isPending && (
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                      value={selectedCards[enr.id] || ''}
                      onChange={(e) => handleCardChange(enr.id, e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="" disabled>Выберите карту</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          •••• {card.last4} ({card.card_holder})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleCheckout(enr.id)}
                      disabled={actionLoading || cards.length === 0}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded font-medium transition-colors"
                    >
                      Оплатить
                    </button>

                    <button
                      onClick={() => handleCancel(enr.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-sm rounded font-medium transition-colors"
                    >
                      Отменить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmModal
        isOpen={enrollmentToCancel !== null}
        title="Отмена записи"
        message="Вы уверены, что хотите отменить запись?"
        onConfirm={confirmCancelEnrollment}
        onCancel={() => setEnrollmentToCancel(null)}
      />
    </div>
  );
}

