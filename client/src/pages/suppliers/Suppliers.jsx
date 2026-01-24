import { useTranslation } from 'react-i18next';

/**
 * Suppliers Page
 */
export default function Suppliers() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('suppliers.title')}</h1>
        <button className="btn-primary">
          {t('suppliers.addSupplier')}
        </button>
      </div>

      <div className="card">
        <p className="text-gray-500">{t('suppliers.noSuppliers')}</p>
      </div>
    </div>
  );
}
