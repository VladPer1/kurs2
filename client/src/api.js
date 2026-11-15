/**
 * @file api.js
 * @description Axios-based API client for the application.
 *
 * ----------------------------------------------------------------------------
 * DATA STRUCTURES DOCUMENTATION (JSDoc Type Definitions)
 * ----------------------------------------------------------------------------
 *
 * @typedef {Object} Role
 * @property {string} name - Role name (e.g., 'student', 'admin', 'instructor')
 * @property {string[]} permissions - List of permission strings
 *
 * @typedef {Object} User
 * @property {number|string} id - Unique user ID
 * @property {string} email - User email address
 * @property {string} full_name - User's full name
 * @property {Role} role - User role and permissions
 *
 * @typedef {Object} AuthResponse
 * @property {boolean} success - Success status
 * @property {Object} data - Response payload
 * @property {string} data.access_token - JWT access token
 * @property {User} data.user - Authenticated user object
 *
 * @typedef {Object} Course
 * @property {number|string} id - Course ID
 * @property {string} title - Course title
 * @property {string} description - Course description
 * @property {number} price - Course price
 * @property {string} start_date - Course start date
 * @property {number} max_seats - Maximum number of seats available
 * @property {string} status - Course status
 *
 * @typedef {Object} Pagination
 * @property {number} total - Total number of items
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} total_pages - Total number of pages
 *
 * @typedef {Object} CoursesListResponse
 * @property {Course[]} data - Array of courses
 * @property {Pagination} pagination - Pagination metadata
 */

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

// ==========================================
// API FUNCTIONS
// ==========================================

// --- Auth ---

/**
 * Log in a user.
 * @param {Object} data - Login credentials ({ email, password })
 * @returns {Promise<AuthResponse>} Response data
 */
export const login = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

/**
 * Register a new user.
 * @param {Object} data - Registration data ({ email, password, full_name, role: 'student' })
 * @returns {Promise<AuthResponse>} Response data
 */
export const register = async (data) => {
  const payload = { role: "student", ...data };
  const response = await api.post("/auth/register", payload);
  return response.data;
};

/**
 * Get current authenticated user profile.
 * @returns {Promise<Object>} Current user data
 */
export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

/**
 * Log out current user.
 * @returns {Promise<Object>} Response data
 */
export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// --- Courses ---

/**
 * Get list of courses with filtering and pagination.
 * @param {Object} [params] - Query parameters (page, limit, search, min_price, max_price)
 * @param {AbortSignal} [signal] - Abort signal for request cancellation
 * @returns {Promise<CoursesListResponse>} Courses and pagination
 */
export const getCourses = async (params, signal) => {
  const response = await api.get("/courses", { params, signal });
  return response.data;
};

/**
 * Create a new course.
 * @param {Object} data - Course data ({ title, description, price, start_date, max_seats, status })
 * @returns {Promise<Object>} Created course
 */
export const createCourse = async (data) => {
  const response = await api.post("/courses", data);
  return response.data;
};

/**
 * Update an existing course.
 * @param {number|string} id - Course ID
 * @param {Object} data - Updated course fields
 * @returns {Promise<Object>} Updated course
 */
export const updateCourse = async (id, data) => {
  const response = await api.put(`/courses/${id}`, data);
  return response.data;
};

/**
 * Delete a course.
 * @param {number|string} id - Course ID
 * @returns {Promise<Object>} Response data
 */
export const deleteCourse = async (id) => {
  const response = await api.delete(`/courses/${id}`);
  return response.data;
};

// --- Enrollments & Payments ---

/**
 * Enroll in a course.
 * @param {number|string} course_id - Course ID ({ course_id })
 * @returns {Promise<Object>} Enrollment data
 */
export const enrollCourse = async (course_id) => {
  const response = await api.post("/enrollments", { course_id });
  return response.data;
};

/**
 * Get current user's enrollments.
 * @returns {Promise<Object>} List of enrollments
 */
export const getMyEnrollments = async () => {
  const response = await api.get("/enrollments/my");
  return response.data;
};

/**
 * Cancel an enrollment.
 * @param {number|string} id - Enrollment ID
 * @returns {Promise<Object>} Response data
 */
export const cancelEnrollment = async (id) => {
  const response = await api.delete(`/enrollments/${id}`);
  return response.data;
};

/**
 * Checkout payment for an enrollment.
 * @param {number|string} enrollment_id - Enrollment ID
 * @param {number|string} payment_method_id - Payment method / card ID
 * @returns {Promise<Object>} Payment result
 */
export const checkoutPayment = async (enrollment_id, payment_method_id) => {
  const response = await api.post("/payments/checkout", {
    enrollment_id,
    payment_method_id,
  });
  return response.data;
};

/**
 * Get current user's payments history.
 * @returns {Promise<Object>} List of payments
 */
export const getMyPayments = async () => {
  const response = await api.get("/payments/my");
  return response.data;
};

// --- Cards ---

/**
 * Get saved payment cards.
 * @returns {Promise<Array>} List of cards
 */
export const getCards = async () => {
  const response = await api.get("/cards");
  return response.data;
};

/**
 * Add a new payment card.
 * @param {Object} data - Card details ({ card_number, card_holder, exp_month, exp_year, cvv, is_default })
 * @returns {Promise<Object>} Added card data
 */
export const addCard = async (data) => {
  const response = await api.post("/cards", data);
  return response.data;
};

/**
 * Delete a saved payment card.
 * @param {number|string} id - Card ID
 * @returns {Promise<Object>} Response data
 */
export const deleteCard = async (id) => {
  const response = await api.delete(`/cards/${id}`);
  return response.data;
};

// --- Admin ---

/**
 * Get list of users (Admin only).
 * @param {Object} [params] - Query parameters
 * @returns {Promise<Object>} Users list
 */
export const getUsers = async (params) => {
  const response = await api.get("/users", { params });
  return response.data;
};

/**
 * Delete a user (Admin only).
 * @param {number|string} id - User ID
 * @returns {Promise<Object>} Response data
 */
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export default api;
