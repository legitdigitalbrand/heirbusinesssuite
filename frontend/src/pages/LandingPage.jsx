import React from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaUsers, FaBox, FaComments, FaFileAlt, FaLock } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-700">Heirs Business Suite</h1>
          <div className="space-x-4">
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Run Your Business Efficiently
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Heirs Business Suite is an all-in-one platform for managing inventory, employees, HR, and team communication.
        </p>
        <Link
          to="/register"
          className="inline-block px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-lg"
        >
          Get Started Free
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Powerful Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FaBox className="w-8 h-8" />}
            title="Inventory Management"
            description="Track inventory with flexible units, monitor stock levels, and manage transactions seamlessly."
          />
          <FeatureCard
            icon={<FaUsers className="w-8 h-8" />}
            title="HR Management"
            description="Manage employee data, roles, leave requests, and payroll all in one place."
          />
          <FeatureCard
            icon={<FaComments className="w-8 h-8" />}
            title="Team Chat"
            description="Communicate with departments, share files, and stay connected in real-time."
          />
          <FeatureCard
            icon={<FaChartBar className="w-8 h-8" />}
            title="Sales & Reports"
            description="Record sales, generate reports (daily, weekly, monthly, yearly), and analyze trends."
          />
          <FeatureCard
            icon={<FaFileAlt className="w-8 h-8" />}
            title="Document Management"
            description="Store documents securely in the cloud with role-based access control."
          />
          <FeatureCard
            icon={<FaLock className="w-8 h-8" />}
            title="Enterprise Security"
            description="Multi-tenant architecture with secure authentication and role-based permissions."
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              plan="Starter"
              price="Free"
              features={['Up to 10 users', 'Basic inventory', 'Team chat', 'Email support']}
            />
            <PricingCard
              plan="Professional"
              price="$99"
              period="/month"
              highlighted
              features={['Up to 100 users', 'All Starter features', 'Advanced reports', 'Priority support']}
            />
            <PricingCard
              plan="Enterprise"
              price="Custom"
              features={['Unlimited users', 'All Pro features', 'Dedicated support', 'Custom integrations']}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-lg mb-8">Create your free account today and start managing your business smarter.</p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 bg-white text-emerald-600 rounded-lg hover:bg-gray-100 font-medium text-lg"
          >
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Heirs Business Suite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="text-emerald-600 mb-4">{icon}</div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ plan, price, period, highlighted, features }) {
  return (
    <div
      className={`p-8 rounded-lg ${
        highlighted
          ? 'bg-emerald-600 text-white shadow-lg scale-105'
          : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <h4 className="text-xl font-bold mb-2">{plan}</h4>
      <p className="text-3xl font-bold mb-1">
        {typeof price === 'string' ? price : `$${price}`}
      </p>
      {period && <p className="text-sm mb-6">{period}</p>}
      <ul className="space-y-2 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <span className="mr-2">✓</span> {feature}
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-2 rounded-lg font-medium ${
          highlighted
            ? 'bg-white text-emerald-600 hover:bg-gray-100'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        Get Started
      </button>
    </div>
  );
}
