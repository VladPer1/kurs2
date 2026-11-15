import axiosClient from './axiosClient';

/**
 * Main API aggregator / unified export file (client/src/api/api.js)
 * Re-exports API modules and adds RBAC methods (getRoles, getPermissions, updateRolePermissions).
 */

export * from './auth.api';
export * from './courses.api';
export * from './enrollments.api';
export * from './payments.api';
export * from './admin.api';

// Explicit RBAC helper methods requested by requirements
import { getRoles as fetchRoles, getPermissions as fetchPermissions, updateRolePermissions as putRolePermissions } from './admin.api';
import { getAllPayments as fetchAllPayments } from './payments.api';

export const getRoles = fetchRoles;
export const getPermissions = fetchPermissions;
export const updateRolePermissions = putRolePermissions;
export const getAllPayments = fetchAllPayments;

export default axiosClient;

