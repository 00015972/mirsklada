import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { HiCube, HiShoppingCart, HiUserGroup, HiCash } from 'react-icons/hi';

/**
 * Dashboard Page
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const stats = [
    {
      name: t('dashboard.totalProducts'),
      value: '0',
      icon: HiCube,
      color: 'bg-blue-500',
    },
    {
      name: t('dashboard.todayOrders'),
      value: '0',
      icon: HiShoppingCart,
      color: 'bg-green-500',
    },
    {
      name: t('dashboard.totalClients'),
      value: '0',
      icon: HiUserGroup,
      color: 'bg-purple-500',
    },
    {
      name: t('dashboard.pendingPayments'),
      value: '0 UZS',
      icon: HiCash,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.welcome', { name: user?.full_name })}
        </h1>
        <p className="text-gray-600">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('dashboard.recentOrders')}
          </h3>
          <p className="text-gray-500 text-sm">{t('dashboard.noRecentOrders')}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('dashboard.lowStockAlerts')}
          </h3>
          <p className="text-gray-500 text-sm">{t('dashboard.noLowStock')}</p>
        </div>
      </div>
    </div>
  );
}
