import axiosClient from './axiosClient';

export const getUsers = async (params) => {
  const res = await axiosClient.get('/users', { params });
  return res.data;
};

export const createStaffUser = async (data) => {
  const res = await axiosClient.post('/users', data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axiosClient.delete(`/users/${id}`);
  return res.data;
};

export const getRoles = async () => {
  const res = await axiosClient.get('/roles');
  return res.data;
};

export const createRole = async (data) => {
  const res = await axiosClient.post('/roles', data);
  return res.data;
};

export const updateRole = async (id, data) => {
  const res = await axiosClient.put(`/roles/${id}`, data);
  return res.data;
};

export const deleteRole = async (id) => {
  const res = await axiosClient.delete(`/roles/${id}`);
  return res.data;
};

export const getPermissions = async () => {
  const res = await axiosClient.get('/permissions');
  return res.data;
};

export const updateRolePermissions = async (roleId, permissionIds) => {
  const res = await axiosClient.post(`/roles/${roleId}/permissions`, { permission_ids: permissionIds });
  return res.data;
};

export const assignRolePermissions = updateRolePermissions;


export const assignUserRole = async (userId, role_id) => {
  const res = await axiosClient.patch(`/users/${userId}/role`, { role_id });
  return res.data;
};

export const getSystemHealth = async () => {
  const res = await axiosClient.get('/system/health');
  return res.data;
};

export const getSystemMetrics = async () => {
  const res = await axiosClient.get('/system/metrics');
  return res.data;
};
