import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { HiMenu, HiLogout, HiUser, HiGlobe } from 'react-icons/hi';

/**
 * Header Component
 */
export default function Header({ onMenuClick }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();

  const languages = [
    { code: 'ru', name: 'Русский' },
    { code: 'uz', name: "O'zbek" },
    { code: 'en', name: 'English' },
  ];

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      {/* Menu button (mobile) */}
      <button
        type="button"
        className="lg:hidden p-2 text-gray-500 hover:text-gray-600"
        onClick={onMenuClick}
      >
        <HiMenu className="w-6 h-6" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Language selector */}
        <div className="relative group">
          <button className="flex items-center p-2 text-gray-500 hover:text-gray-600">
            <HiGlobe className="w-5 h-5" />
          </button>
          <div className="absolute right-0 hidden mt-2 py-2 w-32 bg-white rounded-lg shadow-lg border group-hover:block">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  i18n.language === lang.code ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600">
            <HiUser className="w-5 h-5" />
          </div>
          <div className="hidden md:block ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{t(`roles.${user?.role}`)}</p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="p-2 text-gray-500 hover:text-red-600"
          title={t('auth.logout')}
        >
          <HiLogout className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
