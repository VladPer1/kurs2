import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCards, addCard, deleteCard } from '../../api/payments.api';
import { getErrorMessage } from '../../utils/formatters';
import ConfirmModal from '../ui/ConfirmModal';

export default function CardsTab() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    card_number: '',
    card_holder: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
    is_default: false,
  });

  const loadCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCards();
      setCards(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      await addCard({
        ...form,
        card_number: form.card_number.replace(/\s+/g, ''),
        exp_month: Number(form.exp_month),
        exp_year: Number(form.exp_year),
      });
      toast.success('Карта успешно привязана');
      setForm({ card_number: '', card_holder: '', exp_month: '', exp_year: '', cvv: '', is_default: false });
      await loadCards();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const [cardToDelete, setCardToDelete] = useState(null);

  const handleDelete = async (id) => {
    setCardToDelete(id);
  };

  const confirmDeleteCard = async () => {
    const id = cardToDelete;
    setCardToDelete(null);
    if (!id) return;

    try {
      setError(null);
      await deleteCard(id);
      toast.success('Карта удалена');
      await loadCards();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Банковские карты</h2>
      {error && <div className="p-3 bg-red-900/50 text-red-200 rounded text-sm">{error}</div>}
      {success && <div className="p-3 bg-emerald-900/50 text-emerald-200 rounded text-sm">{success}</div>}

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Сохраненные карты</h3>
        {loading ? (
          <div className="text-slate-400 text-sm">Загрузка...</div>
        ) : cards.length === 0 ? (
          <div className="text-slate-400 text-sm">Нет сохраненных карт</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="text-lg font-mono text-white">•••• {c.last4}</div>
                  <div className="text-sm text-slate-300">{c.card_holder}</div>
                  <div className="text-xs text-slate-400">{c.exp_month}/{c.exp_year}</div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded">Удалить</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Привязать новую карту</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="card_number" value={form.card_number} onChange={handleChange} placeholder="Номер карты (16 цифр)" required className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm" />
            <input type="text" name="card_holder" value={form.card_holder} onChange={handleChange} placeholder="Держатель (card_holder)" required className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input type="number" name="exp_month" value={form.exp_month} onChange={handleChange} placeholder="Месяц (MM)" min="1" max="12" required className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm" />
            <input type="number" name="exp_year" value={form.exp_year} onChange={handleChange} placeholder="Год (YYYY)" min="2024" max="2050" required className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm" />
            <input type="password" name="cvv" value={form.cvv} onChange={handleChange} placeholder="CVV" maxLength={4} required className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_default" name="is_default" checked={form.is_default} onChange={handleChange} className="rounded bg-slate-800 border-slate-700" />
            <label htmlFor="is_default" className="text-sm text-slate-300">Основная карта</label>
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded font-medium">
            {submitting ? 'Привязка...' : 'Добавить карту'}
          </button>
        </form>
      </div>
      <ConfirmModal
        isOpen={cardToDelete !== null}
        title="Удаление карты"
        message="Вы действительно хотите удалить эту карту?"
        onConfirm={confirmDeleteCard}
        onCancel={() => setCardToDelete(null)}
      />
    </div>
  );
}

