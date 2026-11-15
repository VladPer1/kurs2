import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";

export default function CourseForm({ initialData = null, onSubmit, onCancel }) {
  const [draft, setDraft] = useLocalStorage("course_form_draft", {
    title: "",
    description: "",
    price: "",
    start_date: "",
    max_seats: "",
    duration: "",
    lessons_count: "",
    schedule: "",
    status: "draft"
  });

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      let formattedDate = "";
      if (initialData.start_date) {
        const d = new Date(initialData.start_date);
        if (!isNaN(d.getTime())) formattedDate = d.toISOString().slice(0, 16);
      }
      return {
        title: initialData.title || "",
        description: initialData.description || "",
        price: initialData.price ?? "",
        start_date: formattedDate,
        max_seats: initialData.max_seats ?? "",
        duration: initialData.duration || "",
        lessons_count: initialData.lessons_count ?? "",
        schedule: initialData.schedule || "",
        status: initialData.status || "draft"
      };
    }
    return draft;
  });

  useEffect(() => {
    if (!initialData) setDraft(formData);
  }, [formData, initialData, setDraft]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      price: formData.price !== "" ? Number(formData.price) : 0,
      max_seats: formData.max_seats !== "" ? Number(formData.max_seats) : 0,
      lessons_count: formData.lessons_count !== "" ? Number(formData.lessons_count) : 0,
      duration: formData.duration ? formData.duration.trim() : "8 недель",
      schedule: formData.schedule ? formData.schedule.trim() : "Вт, Чт 19:00",
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-4 border-b border-slate-800 pb-2">
        {initialData ? "Редактирование курса" : "Создание нового курса"}
      </h2>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Название курса *</label>
        <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Описание</label>
        <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Цена (₽)</label>
          <input type="number" name="price" min="0" value={formData.price} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Максимум мест</label>
          <input type="number" name="max_seats" min="1" value={formData.max_seats} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Длительность</label>
          <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="8 недель" className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Число занятий</label>
          <input type="number" name="lessons_count" min="1" value={formData.lessons_count} onChange={handleChange} placeholder="16" className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Расписание</label>
          <input type="text" name="schedule" value={formData.schedule} onChange={handleChange} placeholder="Вт, Чт 19:00" className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Дата начала</label>
          <input type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Статус</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white">
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
            <option value="archived">В архиве</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && <button type="button" onClick={onCancel} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-lg">Отмена</button>}
        <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">Сохранить</button>
      </div>
    </form>
  );
}
