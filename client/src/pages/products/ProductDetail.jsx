import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Product Detail Page
 */
export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('products.detail')}
      </h1>
      <div className="card">
        <p className="text-gray-500">Product ID: {id}</p>
      </div>
    </div>
  );
}
