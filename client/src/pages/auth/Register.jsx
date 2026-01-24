import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

/**
 * Register Page
 */
export default function Register() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await registerUser({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        organization_name: data.organizationName,
      });
      if (response.success) {
        toast.success(t('auth.registerSuccess'));
      } else {
        toast.error(response.error?.message || t('auth.registerError'));
      }
    } catch (error) {
      toast.error(t('auth.registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {t('auth.register')}
      </h2>
      <p className="text-gray-600 mb-8">
        {t('auth.registerSubtitle', 'Create your account to get started.')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="organizationName" className="label">
            {t('auth.organizationName')}
          </label>
          <input
            id="organizationName"
            type="text"
            className="input"
            {...register('organizationName', {
              required: t('validation.required'),
              minLength: {
                value: 2,
                message: t('validation.minLength', { min: 2 }),
              },
            })}
          />
          {errors.organizationName && (
            <p className="mt-1 text-sm text-red-600">{errors.organizationName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="fullName" className="label">
            {t('common.fullName')}
          </label>
          <input
            id="fullName"
            type="text"
            className="input"
            {...register('fullName', {
              required: t('validation.required'),
              minLength: {
                value: 2,
                message: t('validation.minLength', { min: 2 }),
              },
            })}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

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

        <div>
          <label htmlFor="confirmPassword" className="label">
            {t('auth.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="input"
            {...register('confirmPassword', {
              required: t('validation.required'),
              validate: (value) =>
                value === password || t('validation.passwordMismatch'),
            })}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? t('common.loading') : t('auth.register')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
