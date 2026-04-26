/**
 * Landing Page - Public marketing homepage
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package,
  BarChart3,
  Users,
  ShoppingCart,
  Warehouse,
  CreditCard,
  Shield,
  Zap,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  Check,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { useThemeStore } from "@/stores";
import { LanguageSwitcher } from "@/components/ui";

/* ─── Navbar ─── */
function Navbar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  const navLinks = [
    { label: t("landing.nav.features"), href: "#features" },
    { label: t("landing.nav.plans"), href: "#plans" },
    { label: t("landing.nav.about"), href: "#about" },
    { label: t("landing.nav.contact"), href: "#contact" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Mirsklada
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title={t("landing.nav.toggleTheme")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-4 py-2"
            >
              {t("landing.nav.signIn")}
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 px-5 py-2.5 rounded-lg transition-colors"
            >
              {t("landing.nav.getStarted")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title={t("landing.nav.toggleTheme")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-surface-200 dark:border-surface-800 mt-2 pt-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 mt-3 px-3">
                <Link
                  to="/login"
                  className="flex-1 text-center text-sm font-medium border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 py-2.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  {t("landing.nav.signIn")}
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 text-center text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 py-2.5 rounded-lg transition-colors"
                >
                  {t("landing.nav.getStarted")}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/30 dark:from-surface-950 dark:via-surface-900 dark:to-primary-950/20" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary-400/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-300/10 dark:bg-primary-600/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              {t("landing.hero.badge")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 dark:text-surface-50 leading-tight">
              {t("landing.hero.titleStart")}{" "}
              <span className="text-primary-600 dark:text-primary-400">
                {t("landing.hero.titleHighlight")}
              </span>{" "}
              {t("landing.hero.titleEnd")}
            </h1>

            <p className="mt-6 text-lg text-surface-600 dark:text-surface-400 max-w-xl mx-auto lg:mx-0">
              {t("landing.hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-8 py-3.5 rounded-xl text-base font-semibold transition-colors shadow-lg shadow-primary-600/25"
              >
                {t("landing.hero.startFree")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 px-8 py-3.5 rounded-xl text-base font-semibold transition-colors"
              >
                {t("landing.hero.learnMore")}
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              {[
                { value: "99.9%", label: t("landing.hero.stats.uptime") },
                { value: "500+", label: t("landing.hero.stats.businesses") },
                { value: "24/7", label: t("landing.hero.stats.support") },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {stat.value}
                  </p>
                  <p className="text-sm text-surface-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Dashboard Preview */}
          <div className="relative hidden lg:block">
            <div className="relative bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 p-6">
              {/* Mini dashboard mockup */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">M</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                    {t("landing.hero.preview.dashboard")}
                  </p>
                  <p className="text-xs text-surface-500">
                    {t("landing.hero.preview.workspace")}
                  </p>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {
                    label: t("landing.hero.preview.revenue"),
                    value: "12,450,000",
                    color: "text-green-500",
                    trend: "+12%",
                  },
                  {
                    label: t("landing.hero.preview.orders"),
                    value: "1,284",
                    color: "text-primary-500",
                    trend: "+8%",
                  },
                  {
                    label: t("landing.hero.preview.products"),
                    value: "356",
                    color: "text-amber-500",
                    trend: "+3%",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3"
                  >
                    <p className="text-xs text-surface-500">{m.label}</p>
                    <p className="text-sm font-bold text-surface-900 dark:text-surface-100 mt-1">
                      {m.value}
                    </p>
                    <p className={`text-xs font-medium ${m.color} mt-0.5`}>
                      {m.trend}
                    </p>
                  </div>
                ))}
              </div>

              {/* Chart placeholder */}
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-surface-500 mb-3">
                  {t("landing.hero.preview.weeklyRevenue")}
                </p>
                <div className="flex items-end gap-2 h-24">
                  {[
                    { outer: "h-[40%]", inner: "h-[28%]" },
                    { outer: "h-[65%]", inner: "h-[45.5%]" },
                    { outer: "h-[45%]", inner: "h-[31.5%]" },
                    { outer: "h-[80%]", inner: "h-[56%]" },
                    { outer: "h-[55%]", inner: "h-[38.5%]" },
                    { outer: "h-[90%]", inner: "h-[63%]" },
                    { outer: "h-[70%]", inner: "h-[49%]" },
                  ].map((bar, i) => (
                    <div
                      key={i}
                      className={`flex-1 bg-primary-500/20 dark:bg-primary-500/30 rounded-t-md relative ${bar.outer}`}
                    >
                      <div
                        className={`absolute bottom-0 inset-x-0 bg-primary-500 rounded-t-md ${bar.inner}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent items */}
              <div className="space-y-2">
                {[
                  {
                    name: "Order #1284",
                    status: t("landing.hero.preview.completed"),
                    amt: "245,000",
                  },
                  {
                    name: "Order #1283",
                    status: t("landing.hero.preview.pending"),
                    amt: "180,500",
                  },
                ].map((order) => (
                  <div
                    key={order.name}
                    className="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-surface-900 dark:text-surface-100">
                        {order.name}
                      </p>
                      <p className="text-xs text-surface-500">{order.status}</p>
                    </div>
                    <p className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                      {order.amt} UZS
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-2xl rotate-12 -z-10" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary-200 dark:bg-primary-800/30 rounded-xl -rotate-12 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features Section ─── */
const featureItems = [
  { key: "products", icon: Package },
  { key: "inventory", icon: Warehouse },
  { key: "orders", icon: ShoppingCart },
  { key: "clients", icon: Users },
  { key: "payments", icon: CreditCard },
  { key: "analytics", icon: BarChart3 },
  { key: "secure", icon: Shield },
  { key: "multilang", icon: Globe },
  { key: "fast", icon: Zap },
] as const;

function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section
      id="features"
      className="py-20 lg:py-28 bg-surface-50 dark:bg-surface-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
            {t("landing.features.titleStart")}{" "}
            <span className="text-primary-600 dark:text-primary-400">
              {t("landing.features.titleHighlight")}
            </span>
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featureItems.map((feature) => (
            <div
              key={feature.key}
              className="group bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                {t(`landing.features.items.${feature.key}.title`)}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">
                {t(`landing.features.items.${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Plans Section ─── */
const planConfig = [
  {
    key: "basic" as const,
    featureKeys: ["products", "workspace", "reports", "support", "users"],
    popular: false,
  },
  {
    key: "pro" as const,
    featureKeys: [
      "products",
      "workspaces",
      "analytics",
      "support",
      "users",
      "export",
    ],
    popular: true,
  },
];

function PlansSection() {
  const { t } = useTranslation();
  return (
    <section id="plans" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
            {t("landing.plans.titleStart")}{" "}
            <span className="text-primary-600 dark:text-primary-400">
              {t("landing.plans.titleHighlight")}
            </span>
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            {t("landing.plans.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {planConfig.map((plan) => {
            const period = t(`landing.plans.${plan.key}.period`);
            return (
              <div
                key={plan.key}
                className={`relative bg-white dark:bg-surface-900 border rounded-2xl p-8 flex flex-col ${
                  plan.popular
                    ? "border-primary-500 shadow-xl shadow-primary-500/10 scale-105"
                    : "border-surface-200 dark:border-surface-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {t("landing.plans.mostPopular")}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {t(`landing.plans.${plan.key}.name`)}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-surface-900 dark:text-surface-50">
                    {t(`landing.plans.${plan.key}.price`)}
                  </span>
                  {period && (
                    <span className="text-sm text-surface-500">{period}</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
                  {t(`landing.plans.${plan.key}.description`)}
                </p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.featureKeys.map((featKey) => (
                    <li key={featKey} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-surface-700 dark:text-surface-300">
                        {t(`landing.plans.${plan.key}.features.${featKey}`)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.key === "pro" ? "/signup?plan=pro" : "/signup"}
                  className={`mt-8 inline-flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                  }`}
                >
                  {t(`landing.plans.${plan.key}.cta`)}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── About Section ─── */
const reasonKeys = ["easy", "cloud", "affordable", "support"] as const;

function AboutSection() {
  const { t } = useTranslation();
  return (
    <section
      id="about"
      className="py-20 lg:py-28 bg-surface-50 dark:bg-surface-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
              {t("landing.about.titleStart")}{" "}
              <span className="text-primary-600 dark:text-primary-400">
                {t("landing.about.titleHighlight")}
              </span>
            </h2>
            <p className="mt-6 text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
              {t("landing.about.paragraph1")}
            </p>
            <p className="mt-4 text-surface-600 dark:text-surface-400 leading-relaxed">
              {t("landing.about.paragraph2")}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              {[
                { value: "2024", label: t("landing.about.stats.founded") },
                { value: "500+", label: t("landing.about.stats.users") },
                { value: "3", label: t("landing.about.stats.languages") },
                { value: "99.9%", label: t("landing.about.stats.uptime") },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4"
                >
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {stat.value}
                  </p>
                  <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-8 space-y-6">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                {t("landing.about.whyTitle")}
              </h3>
              {reasonKeys.map((reasonKey) => (
                <div key={reasonKey} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-surface-900 dark:text-surface-100">
                      {t(`landing.about.reasons.${reasonKey}.title`)}
                    </h4>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                      {t(`landing.about.reasons.${reasonKey}.desc`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Contact Section ─── */
function ContactSection() {
  const { t } = useTranslation();
  return (
    <section id="contact" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
            {t("landing.contact.titleStart")}{" "}
            <span className="text-primary-600 dark:text-primary-400">
              {t("landing.contact.titleHighlight")}
            </span>
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            {t("landing.contact.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-100">
                  {t("landing.contact.email")}
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  support@mirsklada.uz
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-100">
                  {t("landing.contact.phone")}
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  +998 90 123 45 67
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h4 className="font-medium text-surface-900 dark:text-surface-100">
                  {t("landing.contact.address")}
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  {t("landing.contact.addressValue")}
                </p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    {t("landing.contact.form.name")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("landing.contact.form.namePlaceholder")}
                    className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    {t("landing.contact.form.email")}
                  </label>
                  <input
                    type="email"
                    placeholder={t("landing.contact.form.emailPlaceholder")}
                    className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  {t("landing.contact.form.message")}
                </label>
                <textarea
                  rows={5}
                  placeholder={t("landing.contact.form.messagePlaceholder")}
                  className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                {t("landing.contact.form.send")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
const productLinks = [
  "features",
  "pricing",
  "integrations",
  "changelog",
] as const;
const companyLinks = ["about", "contact", "blog", "careers"] as const;
const legalLinks = ["privacy", "terms", "cookies"] as const;

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-surface-100">
                Mirsklada
              </span>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-400">
              {t("landing.footer.tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {t("landing.footer.product")}
            </h4>
            <ul className="space-y-2">
              {productLinks.map((linkKey) => (
                <li key={linkKey}>
                  <a
                    href="#features"
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {t(`landing.footer.links.${linkKey}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {t("landing.footer.company")}
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((linkKey) => (
                <li key={linkKey}>
                  <a
                    href="#about"
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {t(`landing.footer.links.${linkKey}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              {t("landing.footer.legal")}
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((linkKey) => (
                <li key={linkKey}>
                  <a
                    href="#"
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {t(`landing.footer.links.${linkKey}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500">
            {t("landing.footer.rights")}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Landing Page ─── */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PlansSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
