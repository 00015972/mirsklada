import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import {
  HiX,
  HiHome,
  HiCube,
  HiTruck,
  HiUserGroup,
  HiShoppingCart,
  HiClipboardList,
  HiChartBar,
  HiCog,
} from 'react-icons/hi';

/**
 * Sidebar Navigation
 */
export default function Sidebar({ open, setOpen }) {
  const { t } = useTranslation();
  const { isManagerOrAbove, isOwner } = useAuthStore();

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: HiHome, show: true },
    { name: t('nav.products'), href: '/products', icon: HiCube, show: true },
    { name: t('nav.suppliers'), href: '/suppliers', icon: HiTruck, show: isManagerOrAbove() },
    { name: t('nav.clients'), href: '/clients', icon: HiUserGroup, show: true },
    { name: t('nav.purchases'), href: '/purchases', icon: HiShoppingCart, show: isManagerOrAbove() },
    { name: t('nav.orders'), href: '/orders', icon: HiClipboardList, show: true },
    { name: t('nav.reports'), href: '/reports', icon: HiChartBar, show: isManagerOrAbove() },
    { name: t('nav.settings'), href: '/settings', icon: HiCog, show: isOwner() },
  ].filter(item => item.show);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-primary-700">
        <span className="text-xl font-bold text-white">MirSklada</span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
            onClick={() => setOpen(false)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? 'block' : 'hidden'}`}
      >
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setOpen(false)}
        />

        {/* Sidebar panel */}
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="absolute top-0 right-0 pt-2 -mr-12">
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setOpen(false)}
            >
              <HiX className="w-6 h-6 text-white" />
            </button>
          </div>
          <NavContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
          <NavContent />
        </div>
      </div>
    </>
  );
}
