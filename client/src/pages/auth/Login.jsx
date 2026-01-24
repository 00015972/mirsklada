import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

/**
 * Login Page
 */
export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await login(data.email, data.password);
      if (response.success) {
        toast.success(t('auth.loginSuccess'));
      } else {
        toast.error(response.error?.message || t('auth.loginError'));
      }
    } catch (error) {
      toast.error(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {t('auth.login')}
      </h2>
      <p className="text-gray-600 mb-8">
        {t('auth.loginSubtitle', 'Welcome back! Please enter your credentials.')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="label">
            {t('common.email')}
          </label>
          <input
            id="email"
            type="email"
            className="input"
            {...register('email', {
              required: t('validation.required'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('validation.invalidEmail'),
              },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            {t('common.password')}
          </label>
          <input
            id="password"
            type="password"
            className="input"
            {...register('password', {
              required: t('validation.required'),
              minLength: {
                value: 6,
                message: t('validation.minLength', { min: 6 }),
              },
            })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
          {t('auth.register')}
        </Link>
      </p>
    </div>
  );
}
