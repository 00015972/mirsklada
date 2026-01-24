import { useTranslation } from 'react-i18next';

/**
 * Clients Page
 */
export default function Clients() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('clients.title')}</h1>
        <button className="btn-primary">
          {t('clients.addClient')}
        </button>
      </div>

      <div className="card">
        <p className="text-gray-500">{t('clients.noClients')}</p>
      </div>
    </div>
  );
}
