import React, { useState, useEffect } from "react";
import { getCourseById, getCourseReviews, createReview, deleteReview } from "../api/courses.api";
import { enrollCourse } from "../api/enrollments.api";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage, formatPrice, formatDate } from "../utils/formatters";
import Spinner from "../components/ui/Spinner";
import ErrorAlert from "../components/ui/ErrorAlert";
import toast from "react-hot-toast";
import { Calendar, User, BookOpen, Clock, Star, ArrowLeft, MessageSquare, Trash2 } from "lucide-react";

export default function CourseDetailPage({ courseId, onBack }) {
  const { user, hasRole } = useAuth();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const isStudent = hasRole("student") || (!hasRole("admin") && !hasRole("instructor"));

  useEffect(() => {
    if (!courseId) return;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [courseRes, reviewsRes] = await Promise.all([
          getCourseById(courseId),
          getCourseReviews(courseId).catch(() => [])
        ]);
        setCourse(courseRes.data || courseRes);
        const revs = reviewsRes.data || reviewsRes;
        setReviews(Array.isArray(revs) ? revs : []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      await enrollCourse(courseId);
      toast.success("Вы успешно записались на курс!");
      const res = await getCourseById(courseId);
      setCourse(res.data || res);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    try {
      await createReview(courseId, { rating: Number(newRating), comment: newComment.trim() });
      toast.success("Отзыв успешно добавлен!");
      setNewComment("");
      setNewRating(5);
      const reviewsRes = await getCourseReviews(courseId);
      setReviews(reviewsRes.data || reviewsRes);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      toast.success("Отзыв удален");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <div className="py-16"><Spinner text="Загрузка курса..." /></div>;
  if (error || !course) return <div className="space-y-4 py-8"><button onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Назад</button><ErrorAlert message={error || "Не найден"} /></div>;

  const instructorName = course.instructor?.user?.full_name || "Эксперт";
  const isDisabled = course.status !== "published" || (course.available_seats !== undefined && course.available_seats <= 0);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Назад в каталог
        </button>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-3">{course.title}</h1>
        <p className="text-slate-300 mb-6">{course.description}</p>
        <div className="flex flex-wrap gap-6 text-sm text-slate-300 mb-6">
          <span>Длительность: <strong>{course.duration || "8 недель"}</strong></span>
          <span>Занятий: <strong>{course.lessons_count || 16}</strong></span>
          <span>Расписание: <strong>{course.schedule || "Вт, Чт 19:00"}</strong></span>
          <span>Цена: <strong>{formatPrice(course.price)}</strong></span>
        </div>
        {isStudent && (
          <button onClick={handleEnroll} disabled={isDisabled} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50">
            {isDisabled ? "Мест нет" : "Записаться на курс"}
          </button>
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Отзывы ({reviews.length})</h2>
        {reviews.map((rev) => (
          <div key={rev.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm text-slate-200">{rev.user?.full_name || "Студент"}</span>
              {(user?.id === rev.user_id || hasRole("admin")) && (
                <button onClick={() => handleDeleteReview(rev.id)} className="text-red-400 text-xs hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <Star
                    key={starNum}
                    className={`w-4 h-4 ${
                      starNum <= (rev.rating || 5)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-slate-400">({rev.rating}/5)</span>
            </div>
            <p className="text-sm text-slate-300">{rev.comment}</p>
          </div>
        ))}
        {isStudent && (
          <form onSubmit={handleCreateReview} className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm">Оставить отзыв</h3>
            <select value={newRating} onChange={(e) => setNewRating(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm">
              <option value="5">5 — Отлично</option>
              <option value="4">4 — Хорошо</option>
              <option value="3">3 — Нормально</option>
              <option value="2">2 — Плохо</option>
              <option value="1">1 — Ужасно</option>
            </select>
            <textarea rows="2" required value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ваш отзыв..." className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2 text-sm" />
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold">Отправить</button>
          </form>
        )}
      </div>
    </div>
  );
}
