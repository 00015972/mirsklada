import { useTranslation } from 'react-i18next';

/**
 * Purchases Page
 */
export default function Purchases() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('purchases.title')}</h1>
        <button className="btn-primary">
          {t('purchases.addPurchase')}
        </button>
      </div>

      <div className="card">
        <p className="text-gray-500">{t('purchases.noPurchases')}</p>
      </div>
    </div>
  );
}
