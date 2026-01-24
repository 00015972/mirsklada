import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * 404 Not Found Page
 */
export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">
          {t('errors.notFoundTitle')}
        </h2>
        <p className="text-gray-600 mt-2">{t('errors.notFoundDesc')}</p>
        <Link to="/" className="btn-primary inline-block mt-6">
          {t('common.goHome')}
        </Link>
      </div>
    </div>
  );
}
