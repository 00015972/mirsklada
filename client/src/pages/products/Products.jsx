import { useTranslation } from 'react-i18next';

/**
 * Products List Page
 */
export default function Products() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
        <button className="btn-primary">
          {t('products.addProduct')}
        </button>
      </div>

      <div className="card">
        <p className="text-gray-500">{t('products.noProducts')}</p>
      </div>
    </div>
  );
}
