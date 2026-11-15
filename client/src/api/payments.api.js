import axiosClient from './axiosClient';

export const getCards = async () => {
  const res = await axiosClient.get('/cards');
  return res.data;
};

export const addCard = async (data) => {
  const res = await axiosClient.post('/cards', data);
  return res.data;
};

export const deleteCard = async (id) => {
  const res = await axiosClient.delete(`/cards/${id}`);
  return res.data;
};

export const checkoutPayment = async (enrollment_id, payment_method_id) => {
  const res = await axiosClient.post('/payments/checkout', { enrollment_id, payment_method_id });
  return res.data;
};

export const getMyPayments = async () => {
  const res = await axiosClient.get('/payments/my');
  return res.data;
};

export const getAllPayments = async () => {
  const res = await axiosClient.get('/payments');
  return res.data;
};
