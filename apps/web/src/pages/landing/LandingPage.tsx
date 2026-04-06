/**
 * Landing Page - Public marketing homepage
 */
import { useState } from "react";
import { Link } from "react-router-dom";
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

/* ─── Navbar ─── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Plans", href: "#plans" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
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
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Toggle theme"
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
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 px-5 py-2.5 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Toggle theme"
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
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 text-center text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 py-2.5 rounded-lg transition-colors"
                >
                  Get Started
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
              Smart Inventory Management
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 dark:text-surface-50 leading-tight">
              All-in-one{" "}
              <span className="text-primary-600 dark:text-primary-400">
                ERP system
              </span>{" "}
              for your business
            </h1>

            <p className="mt-6 text-lg text-surface-600 dark:text-surface-400 max-w-xl mx-auto lg:mx-0">
              Manage products, sales, inventory, clients, and payments — all
              from a single platform. Built for small and medium businesses that
              need simplicity and power.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 px-8 py-3.5 rounded-xl text-base font-semibold transition-colors shadow-lg shadow-primary-600/25"
              >
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 px-8 py-3.5 rounded-xl text-base font-semibold transition-colors"
              >
                Learn More
              </a>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              {[
                { value: "99.9%", label: "Uptime" },
                { value: "500+", label: "Businesses" },
                { value: "24/7", label: "Support" },
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
                    Dashboard
                  </p>
                  <p className="text-xs text-surface-500">My Workspace</p>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {
                    label: "Revenue",
                    value: "12,450,000",
                    color: "text-green-500",
                    trend: "+12%",
                  },
                  {
                    label: "Orders",
                    value: "1,284",
                    color: "text-primary-500",
                    trend: "+8%",
                  },
                  {
                    label: "Products",
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
                  Weekly Revenue
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
                  { name: "Order #1284", status: "Completed", amt: "245,000" },
                  { name: "Order #1283", status: "Pending", amt: "180,500" },
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
const features = [
  {
    icon: Package,
    title: "Product Management",
    description:
      "Organize your products by categories, set pricing for different weight units, and track everything in one place.",
  },
  {
    icon: Warehouse,
    title: "Inventory Tracking",
    description:
      "Real-time stock levels, low-stock alerts, and batch management. Never run out of essential products.",
  },
  {
    icon: ShoppingCart,
    title: "Order Processing",
    description:
      "Create and manage orders efficiently. Track order status from creation to delivery in real-time.",
  },
  {
    icon: Users,
    title: "Client Management",
    description:
      "Keep a detailed database of your customers, track their order history, and manage relationships.",
  },
  {
    icon: CreditCard,
    title: "Payment Tracking",
    description:
      "Monitor incoming and outgoing payments, track debts, and generate financial reports effortlessly.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description:
      "Get insights into your business performance with beautiful dashboards and detailed analytics.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description:
      "Enterprise-grade security with encrypted data, automatic backups, and role-based access control.",
  },
  {
    icon: Globe,
    title: "Multi-language",
    description:
      "Use the platform in English, Russian, or Uzbek. Perfect for businesses operating in Uzbekistan.",
  },
  {
    icon: Zap,
    title: "Fast & Modern",
    description:
      "Built with the latest technology for speed and reliability. Works on desktop, tablet, and mobile.",
  },
];

function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-20 lg:py-28 bg-surface-50 dark:bg-surface-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
            Everything you need to{" "}
            <span className="text-primary-600 dark:text-primary-400">
              run your business
            </span>
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            A complete set of tools designed specifically for small and medium
            businesses to manage their daily operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl p-6 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Plans Section ─── */
const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for getting started with basic inventory management.",
    features: [
      "Up to 100 products",
      "1 workspace",
      "Basic reports",
      "Email support",
      "1 user",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Professional",
    price: "99,000",
    period: "UZS / mo",
    description: "For growing businesses that need more power and flexibility.",
    features: [
      "Unlimited products",
      "3 workspaces",
      "Advanced analytics",
      "Priority support",
      "Up to 5 users",
      "Export reports",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "249,000",
    period: "UZS / mo",
    description:
      "For larger businesses with advanced needs and multiple locations.",
    features: [
      "Everything in Professional",
      "Unlimited workspaces",
      "Unlimited users",
      "Custom integrations",
      "Dedicated support",
      "On-premise option",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

function PlansSection() {
  return (
    <section id="plans" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
            Simple, transparent{" "}
            <span className="text-primary-600 dark:text-primary-400">
              pricing
            </span>
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Choose the plan that fits your business. Start free, upgrade when
            you&apos;re ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-surface-900 border rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? "border-primary-500 shadow-xl shadow-primary-500/10 scale-105"
                  : "border-surface-200 dark:border-surface-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-surface-900 dark:text-surface-50">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-surface-500">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-surface-600 dark:text-surface-400">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-8 inline-flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                  plan.popular
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "border border-surface-300 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── About Section ─── */
function AboutSection() {
  return (
    <section
      id="about"
      className="py-20 lg:py-28 bg-surface-50 dark:bg-surface-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
              Built for businesses in{" "}
              <span className="text-primary-600 dark:text-primary-400">
                Uzbekistan
              </span>
            </h2>
            <p className="mt-6 text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
              Mirsklada is a modern cloud-based ERP system designed specifically
              for small and medium businesses. We understand the unique
              challenges of running a business in Uzbekistan, and we&apos;ve
              built our platform to address them.
            </p>
            <p className="mt-4 text-surface-600 dark:text-surface-400 leading-relaxed">
              From managing inventory across multiple warehouses to tracking
              payments in UZS, every feature is designed with local businesses
              in mind. Our multi-language support (Uzbek, Russian, English)
              ensures your entire team can use the platform comfortably.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-6">
              {[
                { value: "2024", label: "Founded" },
                { value: "500+", label: "Active Users" },
                { value: "3", label: "Languages" },
                { value: "99.9%", label: "Uptime" },
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
                Why choose Mirsklada?
              </h3>
              {[
                {
                  title: "Easy to use",
                  desc: "No technical knowledge required. Get started in minutes with our intuitive interface.",
                },
                {
                  title: "Cloud-based",
                  desc: "Access your data from anywhere, on any device. No installation needed.",
                },
                {
                  title: "Affordable",
                  desc: "Start for free and pay only for what you need as your business grows.",
                },
                {
                  title: "Local support",
                  desc: "Our team is based in Uzbekistan and understands your business needs.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-surface-900 dark:text-surface-100">
                      {item.title}
                    </h4>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                      {item.desc}
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
  return (
    <section id="contact" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-50">
            Get in{" "}
            <span className="text-primary-600 dark:text-primary-400">
              touch
            </span>
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            Have questions? We&apos;d love to hear from you. Send us a message
            and we&apos;ll respond as soon as possible.
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
                  Email
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
                  Phone
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
                  Address
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                  Tashkent, Uzbekistan
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
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your business needs..."
                  className="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
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
              Modern ERP for small and medium businesses in Uzbekistan.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              {["Features", "Pricing", "Integrations", "Changelog"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#features"
                      className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {["About", "Contact", "Blog", "Careers"].map((item) => (
                <li key={item}>
                  <a
                    href="#about"
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500">
            &copy; 2026 Mirsklada. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              Telegram
            </a>
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
