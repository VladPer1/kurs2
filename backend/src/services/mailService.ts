import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "../config/env.js";
import { logger } from "../config/logger.js";

export interface PaymentReceiptData {
  transaction_ref: string;
  courseTitle: string;
  amount: number | string;
  paymentDate: string | Date;
}

class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const subject = "Код подтверждения регистрации";
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Код подтверждения: ${code}</h2></div>`;
    const text = `Код подтверждения регистрации: ${code}`;
    return this.sendEmail(email, subject, text, html);
  }

  async sendPasswordResetCode(email: string, code: string): Promise<boolean> {
    const subject = "Сброс пароля";
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Код сброса пароля: ${code}</h2></div>`;
    const text = `Код сброса пароля: ${code}`;
    return this.sendEmail(email, subject, text, html);
  }

  async sendPaymentReceipt(
    email: string,
    receiptData: PaymentReceiptData,
  ): Promise<boolean> {
    const { transaction_ref, courseTitle, amount, paymentDate } = receiptData;
    const formattedDate =
      paymentDate instanceof Date
        ? paymentDate.toLocaleString()
        : new Date(paymentDate).toLocaleString();
    const subject = `Чек об оплате курса: ${courseTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;">
        <h2>Электронный чек об оплате</h2>
        <p>Транзакция: ${transaction_ref}</p>
        <p>Курс: ${courseTitle}</p>
        <p>Дата: ${formattedDate}</p>
        <p>Сумма: <b>${amount} \u20C5</b></p>
      </div>
    `;
    const text = `Чек об оплате\nТранзакция: ${transaction_ref}\nКурс: ${courseTitle}\nДата: ${formattedDate}\nСумма: ${amount} \u20C5`;
    return this.sendEmail(email, subject, text, html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: ENV.SMTP_FROM,
        to,
        subject,
        text,
        html,
      });
      logger.info(`Email sent to ${to}. ID: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      if (ENV.NODE_ENV === "production") throw error;
      return false;
    }
  }
}

export const mailService = new MailService();
