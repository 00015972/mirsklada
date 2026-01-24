import { useTranslation } from 'react-i18next';

/**
 * Settings Page
 */
export default function Settings() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings.title')}</h1>

      <div className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('settings.organization')}
          </h3>
          <p className="text-gray-500 text-sm">{t('settings.organizationDesc')}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('settings.users')}
          </h3>
          <p className="text-gray-500 text-sm">{t('settings.usersDesc')}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('settings.telegram')}
          </h3>
          <p className="text-gray-500 text-sm">{t('settings.telegramDesc')}</p>
        </div>
      </div>
    </div>
  );
}
