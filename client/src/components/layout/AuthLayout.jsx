import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Auth Layout - For login/register pages
 */
export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center p-12">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">MirSklada</h1>
          <p className="text-xl text-primary-100">
            {t('auth.tagline', 'Inventory Management System for Wholesale Businesses')}
          </p>
          <div className="mt-8 space-y-4 text-left text-primary-100">
            <p>✓ {t('auth.feature1', 'Track inventory in real-time')}</p>
            <p>✓ {t('auth.feature2', 'Manage suppliers and clients')}</p>
            <p>✓ {t('auth.feature3', 'Process orders via Telegram')}</p>
            <p>✓ {t('auth.feature4', 'Generate detailed reports')}</p>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
