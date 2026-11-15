export const formatPrice = (price, currency = 'BYN') => {
  const num = Number(price);
  if (isNaN(num)) return `0 ${currency}`;
  return `${num.toLocaleString('ru-BY')} ${currency}`;
};

export const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getErrorMessage = (err) => {
  return err.response?.data?.error?.message || err.message || 'Неизвестная ошибка';
};
