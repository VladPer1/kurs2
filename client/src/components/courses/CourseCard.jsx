import React from "react";
import {
  Calendar,
  Users,
  User,
  BookOpen,
  Edit2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { formatPrice, formatDate } from "../../utils/formatters";

const GRADIENTS = [
  "from-indigo-600 via-blue-600 to-cyan-500",
  "from-violet-600 via-purple-600 to-fuchsia-500",
  "from-emerald-600 via-teal-600 to-cyan-600",
  "from-amber-500 via-orange-600 to-rose-500",
];

export default function CourseCard({
  onViewDetails,
  course,
  canManage,
  isStudent,
  onEdit,
  onDelete,
  onEnroll,
  onViewStudents,
}) {
  if (!course) return null;

  const {
    id,
    title,
    description,
    price,
    start_date,
    available_seats,
    max_seats,
    instructor,
    status,
    duration,
    lessons_count,
    schedule,
  } = course;

  const gradientClass = GRADIENTS[(id ? id.charCodeAt(0) : 0) % GRADIENTS.length];

  const instructorName = instructor?.user?.full_name || "Эксперт платформы";
  const isNotPublished = status !== "published";
  const seatsNotAvailable = available_seats !== undefined && available_seats <= 0;
  const isDisabled = isNotPublished || seatsNotAvailable;
  const isSoldOut = seatsNotAvailable;


  return (
    <div className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
      <div>
        {/* Градиентная обложка курса */}
        <div
          onClick={() => onViewDetails && onViewDetails(id)}
          className={`h-36 bg-gradient-to-br ${gradientClass} p-5 flex flex-col justify-between relative overflow-hidden cursor-pointer`}
          title="Открыть подробную информацию о курсе"
        >
          <div className="flex justify-between items-start z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/30 backdrop-blur-md text-white border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              {status === "published"
                ? "Открыт набор"
                : status === "archived"
                  ? "В архиве"
                  : "Черновик"}
            </span>

            {available_seats !== undefined && max_seats !== undefined && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                  isSoldOut
                    ? "bg-red-500/80 text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                {isSoldOut
                  ? "Мест нет"
                  : `Мест: ${available_seats}/${max_seats}`}
              </span>
            )}
          </div>

          <div className="z-10 flex items-center gap-2 text-white/90 text-xs font-medium">
            <BookOpen className="w-4 h-4" />
            <span>{duration ? `${duration} • ${lessons_count || 0} зан.` : "Практический онлайн-курс"}</span>
          </div>
        </div>

        {/* Контент карточки */}
        <div className="p-6">
          <h3
            onClick={() => onViewDetails && onViewDetails(id)}
            className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mb-2 line-clamp-2 cursor-pointer"
            title="Открыть подробную информацию о курсе"
          >
            {title}
          </h3>

          <p className="text-slate-400 text-sm mb-5 line-clamp-3 leading-relaxed">
            {description ||
              "Интенсивная программа обучения с практическими заданиями и проверкой от наставника."}
          </p>

          <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400">Преподаватель:</span>
              <span className="font-semibold text-slate-200 truncate">
                {instructorName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Старт потока:</span>
              <span className="font-medium text-slate-200">
                {formatDate(start_date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя панель: Цена и кнопки */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/80 px-6 pb-6">
        {/* Верхний уровень: строчка с ценой */}
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] uppercase tracking-wider text-slate-500">
            Стоимость
          </span>
          <span className="whitespace-nowrap text-xl font-extrabold text-white">
            {formatPrice(price)}
          </span>
        </div>

        {/* Нижний уровень: кнопки действий в аккуратную сетку */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(id)}
            className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
            title="Подробнее о курсе"
          >
            <span className="w-5 h-5 flex items-center justify-center text-indigo-400 font-bold shrink-0 text-base">ℹ</span>
            <span>Подробнее</span>
          </button>

          {isStudent ? (
            <button
              type="button"
              onClick={() => onEnroll && onEnroll(id)}
              disabled={isDisabled}
              className={`w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center ${
                isDisabled
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-75"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95"
              }`}
            >
              {isDisabled ? "Мест нет" : "Записаться"}
            </button>
          ) : canManage ? (
            <div className="flex items-center justify-end gap-1.5 w-full">
              {onViewStudents && (
                <button
                  type="button"
                  onClick={() => onViewStudents(id)}
                  title="Список студентов"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center justify-center flex-1"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(course)}
                  title="Редактировать"
                  className="p-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 rounded-xl transition-colors flex items-center justify-center flex-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(id)}
                  title="Удалить"
                  className="p-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl transition-colors flex items-center justify-center flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
