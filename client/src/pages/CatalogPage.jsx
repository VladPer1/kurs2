import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getCourses, createCourse, updateCourse, deleteCourse, getCourseStudents } from '../api/courses.api';
import { enrollCourse } from '../api/enrollments.api';
import { useDebounce } from '../hooks/useDebounce';
import { getErrorMessage } from '../utils/formatters';
import CourseCard from '../components/courses/CourseCard';
import CourseFilters from '../components/courses/CourseFilters';
import CourseForm from '../components/courses/CourseForm';
import Spinner from '../components/ui/Spinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function CatalogPage({ onSelectCourse }) {
  const { user, hasPermission, hasRole } = useAuth();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    min_price: '',
    max_price: '',
  });

  const debouncedFilters = useDebounce(filters, 500);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [studentsModalCourseId, setStudentsModalCourseId] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);

  const canManageCourses = hasPermission('courses:create') || hasRole('admin') || hasRole('instructor');
  const isStudent = hasRole('student') || (!hasRole('admin') && !hasRole('instructor'));

  const fetchCourses = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 9,
        ...(debouncedFilters.search && { search: debouncedFilters.search }),
        ...(debouncedFilters.min_price && { min_price: debouncedFilters.min_price }),
        ...(debouncedFilters.max_price && { max_price: debouncedFilters.max_price }),
      };

      const response = await getCourses(params, signal);
      const items = response.data || response.courses || response.items || response;
      const meta = response.meta || response.pagination || {};

      setCourses(Array.isArray(items) ? items : []);
      setTotalPages(meta.total_pages || meta.pages || Math.ceil((meta.total || items.length) / 9) || 1);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedFilters]);
  useEffect(() => {
    const controller = new AbortController();
    fetchCourses(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchCourses]);

  useEffect(() => {
    document.title = `Каталог курсов (${courses.length})`;
  }, [courses.length]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ search: '', min_price: '', max_price: '' });
    setPage(1);
  };

  // Optimistic Create
  const handleCreateCourse = async (formData) => {
    setShowCreateModal(false);
    const tempId = Date.now();
    const optimisticCourse = {
      ...formData,
      id: tempId,
      instructor: { user: { full_name: user?.full_name || 'Вы' } },
      available_seats: formData.max_seats || 30,
      status: formData.status || 'draft',
    };

    setCourses((prev) => [optimisticCourse, ...prev]);

    try {
      const response = await createCourse(formData);
      const realCourse = response.data || response;
      setCourses((prev) => prev.map((c) => (c.id === tempId ? realCourse : c)));
    } catch (err) {
      setCourses((prev) => prev.filter((c) => c.id !== tempId));
      setError(getErrorMessage(err));
    }
  };

  // Optimistic Update
  const handleUpdateCourse = async (formData) => {
    if (!editingCourse) return;
    const courseId = editingCourse.id;
    setEditingCourse(null);

    const previousCourses = [...courses];
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, ...formData } : c))
    );

    try {
      const response = await updateCourse(courseId, formData);
      const updated = response.data || response;
      setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
    } catch (err) {
      setCourses(previousCourses);
      setError(getErrorMessage(err));
    }
  };

  // Optimistic Delete
  const [courseToDelete, setCourseToDelete] = useState(null);

  const handleDeleteCourse = async (courseId) => {
    setCourseToDelete(courseId);
  };

  const confirmDeleteCourse = async () => {
    const courseId = courseToDelete;
    setCourseToDelete(null);
    if (!courseId) return;

    const previousCourses = [...courses];
    setCourses((prev) => prev.filter((c) => c.id !== courseId));

    try {
      await deleteCourse(courseId);
      toast.success('Курс успешно удален');
    } catch (err) {
      setCourses(previousCourses);
      toast.error(`Ошибка при удалении: ${getErrorMessage(err)}`);
    }
  };

  // Student Enrollment
  const handleEnroll = async (courseId) => {
    try {
      await enrollCourse(courseId);
      toast.success('Вы успешно записались на курс!');
      const controller = new AbortController();
      fetchCourses(controller.signal);
    } catch (err) {
      toast.error(`Ошибка при записи: ${getErrorMessage(err)}`);
    }
  };

  // View Course Students (for Instructor / Admin)
  const handleViewStudents = async (courseId) => {
    setStudentsModalCourseId(courseId);
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const response = await getCourseStudents(courseId);
      const list = response.data || response.students || response;
      setStudentsList(Array.isArray(list) ? list : []);
    } catch (err) {
      setStudentsError(getErrorMessage(err));
    } finally {
      setStudentsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Каталог курсов</h1>
            <p className="mt-1 text-sm text-slate-400">Выберите подходящий курс для обучения или управляйте каталогом.</p>
          </div>

          {canManageCourses && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
            >
              + Создать курс
            </button>
          )}
        </div>

        <CourseFilters filters={filters} onChange={handleFilterChange} onReset={handleResetFilters} />

        {error && <ErrorAlert message={error} onRetry={() => fetchCourses(new AbortController().signal)} />}

        {loading && courses.length === 0 ? (
          <Spinner text="Загрузка курсов..." />
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-lg">Курсы не найдены</p>
            <p className="text-slate-500 text-sm mt-1">Попробуйте изменить параметры поиска или фильтрации.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  canManage={canManageCourses}
                  isStudent={isStudent}
                  onEdit={(c) => setEditingCourse(c)}
                  onDelete={handleDeleteCourse}
                  onEnroll={handleEnroll}
                  onViewStudents={handleViewStudents}
                  onViewDetails={onSelectCourse}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Назад
                </button>
                <span className="px-4 py-2 text-sm text-slate-400 font-medium">
                  Страница {page} из {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <CourseForm
                onSubmit={handleCreateCourse}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        )}

        {editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <CourseForm
                initialData={editingCourse}
                onSubmit={handleUpdateCourse}
                onCancel={() => setEditingCourse(null)}
              />
            </div>
          </div>
        )}

        {studentsModalCourseId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold">Студенты курса</h3>
                <button
                  type="button"
                  onClick={() => setStudentsModalCourseId(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              {studentsLoading ? (
                <Spinner text="Загрузка списка студентов..." />
              ) : studentsError ? (
                <ErrorAlert message={studentsError} />
              ) : studentsList.length === 0 ? (
                <p className="text-slate-400 text-center py-6">На этот курс еще никто не записался.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {studentsList.map((st, idx) => {
                    const studentUser = st.user || st;
                    return (
                      <div key={st.id || idx} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-200">{studentUser.full_name || studentUser.name || 'Студент'}</p>
                          <p className="text-xs text-slate-400">{studentUser.email}</p>
                        </div>
                        {st.enrolled_at && (
                          <span className="text-xs text-slate-500">
                            Записан: {new Date(st.enrolled_at).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStudentsModalCourseId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
        <ConfirmModal
          isOpen={courseToDelete !== null}
          title="Удаление курса"
          message="Вы уверены, что хотите удалить этот курс?"
          onConfirm={confirmDeleteCourse}
          onCancel={() => setCourseToDelete(null)}
        />
      </div>
    </div>
  );
}



