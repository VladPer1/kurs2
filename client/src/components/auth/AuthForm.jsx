import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { verifyEmail, forgotPassword, resetPassword } from '../../api/auth.api';
import { getErrorMessage } from '../../utils/formatters';
import ErrorAlert from '../ui/ErrorAlert';

export default function AuthForm({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('form');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { loginUser, registerUser } = useAuth();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast.error('Пароли не совпадают');
        setError('Пароли не совпадают');
        return;
      }
      if (password.length < 8) {
        const msg = 'Пароль должен содержать минимум 8 символов.';
        setError(msg);
        toast.error(msg);
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser({ email, password });
        if (onSuccess) onSuccess();
      } else {
        await registerUser({ full_name: fullName, phone, email, password, role: 'student' });
        toast.success('Код подтверждения отправлен на вашу почту');
        setStep('verify');
      }
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyEmail({ email, code });
      await loginUser({ email, password });
      toast.success('Почта подтверждена! Добро пожаловать!');
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('Код сброса пароля отправлен на почту');
      setStep('reset');
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== newPasswordConfirm) {
      toast.error('Пароли не совпадают');
      setError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      const msg = 'Пароль должен содержать минимум 8 символов.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, code, new_password: newPassword });
      toast.success('Пароль успешно изменен! Войдите с новым паролем.');
      setStep('form');
      setIsLogin(true);
      setPassword('');
      setCode('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };


  if (step === 'verify') {
    return (
      <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl text-slate-100">
        <h2 className="text-2xl font-bold text-center mb-2">Подтверждение почты</h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Введите 6-значный код, отправленный на <span className="text-indigo-400">{email}</span>
        </p>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Код из письма</label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-center tracking-widest text-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Проверка...' : 'Подтвердить почту'}
          </button>

          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-200 mt-2"
          >
            Вернуться назад
          </button>
        </form>
      </div>
    );
  }

  if (step === 'forgot') {
    return (
      <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl text-slate-100">
        <h2 className="text-2xl font-bold text-center mb-2">Восстановление пароля</h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Введите ваш email для получения кода сброса пароля
        </p>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить код сброса'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('form');
              setError(null);
            }}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-200 mt-2"
          >
            Вернуться ко входу
          </button>
        </form>
      </div>
    );
  }
  if (step === 'reset') {
    return (
      <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl text-slate-100">
        <h2 className="text-2xl font-bold text-center mb-2">Новый пароль</h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Введите код из письма и новый пароль для <span className="text-indigo-400">{email}</span>
        </p>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">6-значный код</label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-center tracking-widest text-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Новый пароль</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Подтвердите новый пароль</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Установить новый пароль'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('form');
              setError(null);
            }}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-200 mt-2"
          >
            Отмена
          </button>
        </form>
      </div>
    );
  }

  return (

    <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl text-slate-100">
      <div className="flex justify-center mb-6 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => {
            setIsLogin(true);
            setError(null);
          }}
          className={`flex-1 pb-2 text-center font-semibold transition-colors border-b-2 ${
            isLogin
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLogin(false);
            setError(null);
          }}
          className={`flex-1 pb-2 text-center font-semibold transition-colors border-b-2 ${
            !isLogin
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Регистрация
        </button>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">ФИО</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иван Иванов"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Телефон</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+375 (29) 123-45-67"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Пароль</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          {!isLogin && (
            <p className="text-xs text-slate-400 mt-1">Минимум 8 символов</p>
          )}
        </div>
        {isLogin && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setStep('forgot');
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Забыли пароль?
            </button>
          </div>
        )}


        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Повторите пароль</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
}


