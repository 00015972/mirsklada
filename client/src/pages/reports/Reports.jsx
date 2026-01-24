import { useTranslation } from 'react-i18next';

/**
 * Reports Page
 */
export default function Reports() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('reports.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('reports.dailySales')}
          </h3>
          <p className="text-gray-500 text-sm">{t('reports.dailySalesDesc')}</p>
          <button className="btn-outline mt-4">{t('reports.generate')}</button>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('reports.lowStock')}
          </h3>
          <p className="text-gray-500 text-sm">{t('reports.lowStockDesc')}</p>
          <button className="btn-outline mt-4">{t('reports.generate')}</button>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('reports.clientDebt')}
          </h3>
          <p className="text-gray-500 text-sm">{t('reports.clientDebtDesc')}</p>
          <button className="btn-outline mt-4">{t('reports.generate')}</button>
        </div>
      </div>
    </div>
  );
}
