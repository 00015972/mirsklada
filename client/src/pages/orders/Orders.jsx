import { useTranslation } from 'react-i18next';

/**
 * Orders Page
 */
export default function Orders() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
        <button className="btn-primary">
          {t('orders.addOrder')}
        </button>
      </div>

      <div className="card">
        <p className="text-gray-500">{t('orders.noOrders')}</p>
      </div>
    </div>
  );
}
