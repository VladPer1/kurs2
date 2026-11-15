import { Request, Response } from "express";
import { User, Role } from "../models/index.js";
import { AuthService } from "../services/authService.js";
import { AuthenticatedRequest } from "../middleware/authJwt.js";
import { ENV } from "../config/env.js";
import { mailService } from "../services/mailService.js";
import { VerificationStore } from "../services/verificationStore.js";
import { logger } from "../config/logger.js";

export class AuthController {
  // Шаг 1 регистрации: проверка данных, генерация кода и отправка на почту
  static async register(req: Request, res: Response): Promise<void> {
    const { email, phone, password, full_name, role } = req.body;

    const requestedRole = (role || "student").toLowerCase().trim();
    if (["instructor", "admin"].includes(requestedRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN_ROLE_CREATION",
          message:
            "Регистрация преподавателей и администраторов доступна только администраторам системы.",
        },
      });
      return;
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Пользователь с таким email уже существует",
        },
      });
      return;
    }

    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        res.status(409).json({
          success: false,
          error: {
            code: "PHONE_ALREADY_EXISTS",
            message: "Пользователь с таким номером телефона уже существует",
          },
        });
        return;
      }
    }

    const targetRole = await Role.findOne({ where: { name: "student" } });
    if (!targetRole) {
      res.status(500).json({
        success: false,
        error: {
          code: "ROLE_NOT_FOUND",
          message: "Системная роль студента не найдена.",
        },
      });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const password_hash = await AuthService.hashPassword(password);

    VerificationStore.set(email, code, {
      role_id: targetRole.id,
      email,
      phone,
      password_hash,
      full_name,
    });

    const sent = await mailService.sendVerificationCode(email, code);
    if (!sent) {
      res.status(500).json({
        success: false,
        error: {
          code: "EMAIL_SEND_FAILED",
          message:
            "Не удалось отправить письмо с кодом подтверждения. Проверьте настройки SMTP.",
        },
      });
      return;
    }

    logger.info(`Verification code sent for registration`, { email });

    res.status(200).json({
      success: true,
      message: "Код подтверждения отправлен на почту.",
      ...(ENV.NODE_ENV !== "production" && { debug_code: code }),
    });
  }

  // Шаг 2 регистрации: проверка 6-значного кода и создание аккаунта
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Необходимо указать email и код подтверждения.",
        },
      });
      return;
    }

    const verification = VerificationStore.verify(email, String(code).trim());
    if (!verification.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VERIFICATION_CODE",
          message:
            verification.error ||
            "Неверный или просроченный код подтверждения.",
        },
      });
      return;
    }

    const userData = verification.data;
    const existingEmail = await User.findOne({
      where: { email: userData.email },
    });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Пользователь с таким email уже существует",
        },
      });
      return;
    }

    const user = await User.create(userData);
    const targetRole = await Role.findByPk(user.role_id);
    const userWithPerms = await AuthService.getUserWithPermissions(user.id);
    const permissions = userWithPerms ? userWithPerms.permissions : [];

    const accessToken = AuthService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: targetRole ? targetRole.name : "student",
      permissions,
    });

    const refreshToken = AuthService.generateRefreshToken({ userId: user.id });
    await user.update({ refresh_token: refreshToken });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: ENV.COOKIE_SECURE,
      sameSite: ENV.COOKIE_SAME_SITE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: ENV.COOKIE_SECURE,
      sameSite: ENV.COOKIE_SAME_SITE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Почта подтверждена, регистрация завершена.",
      data: {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: targetRole
            ? {
                id: targetRole.id,
                name: targetRole.name,
                description: targetRole.description,
                permissions,
              }
            : { name: "student", permissions },
        },
      },
    });
  }

  // Вход в систему
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Неверный адрес электронной почты или пароль.",
        },
      });
      return;
    }

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.lock_until).getTime() - Date.now()) / (60 * 1000),
      );
      res.status(423).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: `Учетная запись заблокирована из-за 5 неверных попыток ввода пароля. Попробуйте снова через ${minutesRemaining} минут.`,
          lock_until: user.lock_until,
        },
      });
      return;
    }

    const isValidPassword = await AuthService.comparePassword(
      password,
      user.password_hash,
    );
    if (!isValidPassword) {
      const { isLocked, attemptsLeft } = await AuthService.handleFailedLogin(
        user,
        ip,
      );
      if (isLocked) {
        res.status(423).json({
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message:
              "Превышен лимит 5 попыток. Аккаунт заблокирован на 15 минут.",
            lock_until: user.lock_until,
          },
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: `Неверный пароль. Осталось попыток: ${attemptsLeft}`,
          attempts_left: attemptsLeft,
        },
      });
      return;
    }

    const userDetails = await AuthService.getUserWithPermissions(user.id);
    const roleName = userDetails ? userDetails.roleName : "student";
    const permissions = userDetails ? userDetails.permissions : [];

    const accessToken = AuthService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: roleName,
      permissions,
    });

    const refreshToken = AuthService.generateRefreshToken({ userId: user.id });
    await AuthService.handleSuccessfulLogin(user, refreshToken, ip);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: ENV.COOKIE_SECURE,
      sameSite: ENV.COOKIE_SAME_SITE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Успешная авторизация.",
      data: {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: userDetails
            ? userDetails.role
            : { name: roleName, permissions },
        },
      },
    });
  }

  // Запрос кода на сброс пароля
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Необходимо указать email.",
        },
      });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          "Если такой пользователь существует, код сброса отправлен на почту.",
      });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    VerificationStore.set(`reset_${email}`, code, { email });

    await mailService.sendPasswordResetCode(email, code);

    res.status(200).json({
      success: true,
      message: "Код сброса пароля отправлен на почту.",
      ...(ENV.NODE_ENV !== "production" && { debug_code: code }),
    });
  }

  // Подтверждение сброса пароля
  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Необходимо указать email, код и новый пароль.",
        },
      });
      return;
    }

    const verification = VerificationStore.verify(
      `reset_${email}`,
      String(code).trim(),
    );
    if (!verification.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VERIFICATION_CODE",
          message:
            verification.error || "Неверный или просроченный код сброса.",
        },
      });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Пользователь не найден.",
        },
      });
      return;
    }

    const password_hash = await AuthService.hashPassword(new_password);
    await user.update({ password_hash, refresh_token: null });

    res.status(200).json({
      success: true,
      message:
        "Пароль успешно сброшен. Пожалуйста, войдите в систему с новым паролем.",
    });
  }

  // Обновление Access Token
  static async refresh(req: Request, res: Response): Promise<void> {
    const token =
      req.cookies?.refresh_token ||
      req.cookies?.refreshToken ||
      req.body?.refresh_token ||
      req.body?.refreshToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "REFRESH_TOKEN_REQUIRED",
          message: "Refresh-токен отсутствует в cookie или теле запроса.",
        },
      });
      return;
    }

    try {
      const decoded = AuthService.verifyRefreshToken(token);
      const user = await User.findByPk(decoded.userId);

      if (!user || user.refresh_token !== token) {
        res.status(401).json({
          success: false,
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: "Refresh-токен отозван или недействителен.",
          },
        });
        return;
      }

      const userDetails = await AuthService.getUserWithPermissions(user.id);
      const roleName = userDetails ? userDetails.roleName : "student";
      const permissions = userDetails ? userDetails.permissions : [];

      const newAccessToken = AuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: roleName,
        permissions,
      });

      const newRefreshToken = AuthService.generateRefreshToken({
        userId: user.id,
      });
      await user.update({ refresh_token: newRefreshToken });

      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: ENV.COOKIE_SECURE,
        sameSite: ENV.COOKIE_SAME_SITE,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          access_token: newAccessToken,
        },
      });
    } catch {
      res.status(401).json({
        success: false,
        error: {
          code: "REFRESH_TOKEN_EXPIRED",
          message:
            "Refresh-токен просрочен. Пожалуйста, выполните вход заново.",
        },
      });
    }
  }

  // Выход из системы
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user?.userId) {
      await User.update(
        { refresh_token: null },
        { where: { id: req.user.userId } },
      );
    }

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: ENV.COOKIE_SECURE,
      sameSite: ENV.COOKIE_SAME_SITE,
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: ENV.COOKIE_SECURE,
      sameSite: ENV.COOKIE_SAME_SITE,
    });

    res.status(200).json({
      success: true,
      message: "Вы успешно вышли из системы.",
    });
  }

  // Текущий аутентифицированный пользователь
  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Необходима авторизация." },
      });
      return;
    }

    const details = await AuthService.getUserWithPermissions(req.user.userId);
    if (!details) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "Пользователь не найден." },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: details.user.id,
        email: details.user.email,
        full_name: details.user.full_name,
        role: details.role,
        permissions: details.permissions,
        created_at: details.user.created_at,
      },
    });
  }
}
