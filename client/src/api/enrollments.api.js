import axiosClient from './axiosClient';

export const enrollCourse = async (course_id) => {
  const res = await axiosClient.post('/enrollments', { course_id });
  return res.data;
};

export const getMyEnrollments = async () => {
  const res = await axiosClient.get('/enrollments/my');
  return res.data;
};

export const getInstructorEnrollments = async () => {
  const res = await axiosClient.get('/enrollments/instructor');
  return res.data;
};

export const cancelEnrollment = async (id) => {
  const res = await axiosClient.delete(`/enrollments/${id}`);
  return res.data;
};
