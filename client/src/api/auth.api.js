import axiosClient from './axiosClient';

export const login = async (data) => {
  const res = await axiosClient.post('/auth/login', data);
  return res.data;
};

export const register = async (data) => {
  const payload = { role: 'student', ...data };
  const res = await axiosClient.post('/auth/register', payload);
  return res.data;
};

export const verifyEmail = async (data) => {
  const res = await axiosClient.post('/auth/verify-email', data);
  return res.data;
};

export const forgotPassword = async (data) => {
  const res = await axiosClient.post('/auth/forgot-password', data);
  return res.data;
};

export const resetPassword = async (data) => {
  const res = await axiosClient.post('/auth/reset-password', data);
  return res.data;
};

export const getMe = async () => {
  const res = await axiosClient.get('/auth/me');
  return res.data;
};

export const logout = async () => {
  const res = await axiosClient.post('/auth/logout');
  return res.data;
};
