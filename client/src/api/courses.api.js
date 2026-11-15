import axiosClient from './axiosClient';

export const getCourses = async (params, signal) => {
  const res = await axiosClient.get('/courses', { params, signal });
  return res.data;
};

export const getCourseById = async (id) => {
  const res = await axiosClient.get(`/courses/${id}`);
  return res.data;
};

export const createCourse = async (data) => {
  const res = await axiosClient.post('/courses', data);
  return res.data;
};

export const updateCourse = async (id, data) => {
  const res = await axiosClient.put(`/courses/${id}`, data);
  return res.data;
};

export const deleteCourse = async (id) => {
  const res = await axiosClient.delete(`/courses/${id}`);
  return res.data;
};

export const getCourseStudents = async (id) => {
  const res = await axiosClient.get(`/courses/${id}/students`);
  return res.data;
};

export const getCourseReviews = async (courseId) => {
  const res = await axiosClient.get(`/courses/${courseId}/reviews`);
  return res.data;
};

export const createReview = async (courseId, data) => {
  const res = await axiosClient.post(`/courses/${courseId}/reviews`, data);
  return res.data;
};

export const updateReview = async (reviewId, data) => {
  const res = await axiosClient.put(`/reviews/${reviewId}`, data);
  return res.data;
};

export const deleteReview = async (reviewId) => {
  const res = await axiosClient.delete(`/reviews/${reviewId}`);
  return res.data;
};

