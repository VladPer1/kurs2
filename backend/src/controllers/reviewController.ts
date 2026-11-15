import { Response } from 'express';
import { Review, Course, User } from '../models/index.js';
import { AuthenticatedRequest } from '../middleware/authJwt.js';

export class ReviewController {
  static async getByCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Курс не найден.' } });
      return;
    }
    const reviews = await Review.findAll({
      where: { course_id: id },
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email'] }],
      order: [['created_at', 'DESC']],
    });
    const formatted = reviews.map((r: any) => ({
      id: r.id,
      course_id: r.course_id,
      user_id: r.user_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user: { id: r.user?.id, full_name: r.user?.full_name },
    }));
    res.status(200).json({ success: true, data: formatted });
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: courseId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация.' } });
      return;
    }
    const course = await Course.findByPk(courseId);
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Курс не найден.' } });
      return;
    }
    const { rating, comment } = req.body;
    const pRating = parseInt(rating, 10);
    if (isNaN(pRating) || pRating < 1 || pRating > 5) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Оценка (rating) от 1 до 5.' } });
      return;
    }
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Текст отзыва обязателен.' } });
      return;
    }
    const existing = await Review.findOne({ where: { course_id: courseId, user_id: userId } });
    if (existing) {
      res.status(400).json({ success: false, error: { code: 'REVIEW_ALREADY_EXISTS', message: 'Вы уже оставили отзыв на этот курс.' } });
      return;
    }
    const review = await Review.create({ course_id: courseId, user_id: userId, rating: pRating, comment: comment.trim() });
    const pop = await Review.findByPk(review.id, { include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }] });
    res.status(201).json({
      success: true,
      data: {
        id: pop?.id,
        course_id: pop?.course_id,
        user_id: pop?.user_id,
        rating: pop?.rating,
        comment: pop?.comment,
        created_at: pop?.created_at,
        updated_at: pop?.updated_at,
        user: { id: (pop as any)?.user?.id, full_name: (pop as any)?.user?.full_name },
      },
    });
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация.' } });
      return;
    }
    const review = await Review.findByPk(id);
    if (!review) {
      res.status(404).json({ success: false, error: { code: 'REVIEW_NOT_FOUND', message: 'Отзыв не найден.' } });
      return;
    }
    if (review.user_id !== userId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Вы можете изменять только свои отзывы.' } });
      return;
    }
    const { rating, comment } = req.body;
    if (rating !== undefined) {
      const pRating = parseInt(rating, 10);
      if (isNaN(pRating) || pRating < 1 || pRating > 5) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Оценка (rating) от 1 до 5.' } });
        return;
      }
      review.rating = pRating;
    }
    if (comment !== undefined) {
      if (typeof comment !== 'string' || !comment.trim()) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Текст отзыва не пустой.' } });
        return;
      }
      review.comment = comment.trim();
    }
    await review.save();
    const pop = await Review.findByPk(review.id, { include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }] });
    res.status(200).json({
      success: true,
      data: {
        id: pop?.id,
        course_id: pop?.course_id,
        user_id: pop?.user_id,
        rating: pop?.rating,
        comment: pop?.comment,
        created_at: pop?.created_at,
        updated_at: pop?.updated_at,
        user: { id: (pop as any)?.user?.id, full_name: (pop as any)?.user?.full_name },
      },
    });
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация.' } });
      return;
    }
    const review = await Review.findByPk(id);
    if (!review) {
      res.status(404).json({ success: false, error: { code: 'REVIEW_NOT_FOUND', message: 'Отзыв не найден.' } });
      return;
    }
    const hasPrivilege =
      req.user?.permissions?.includes('users:view_all') ||
      req.user?.permissions?.includes('courses:delete');
    if (review.user_id !== userId && !hasPrivilege) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Вы можете удалять только свои отзывы.' } });
      return;
    }
    await review.destroy();
    res.status(200).json({ success: true, message: 'Отзыв успешно удален.' });
  }
}
