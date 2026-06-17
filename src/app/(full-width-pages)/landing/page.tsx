'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageModal from '@/components/ui/ImageModal';
import ContactSupportModal from '@/components/ui/ContactSupportModal';

export default function LandingPage() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    imageSrc: string;
    imageAlt: string;
    title: string;
  }>({
    isOpen: false,
    imageSrc: '',
    imageAlt: '',
    title: ''
  });

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const openImageModal = (imageSrc: string, imageAlt: string, title: string) => {
    setModalState({
      isOpen: true,
      imageSrc,
      imageAlt,
      title
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
        {/* Navigation */}
        <nav className="relative z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Image
                  src="/images/logo/logo.svg"
                  alt="Fewblocs"
                  height={32}
                  width={120}
                  className="h-8 w-auto"
                />
              </div>
              
              {/* Navigation Items */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
                <a href="#screenshots" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Screenshots</a>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center space-x-4">
                <Link 
                  href="/signin"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                >
                  Join Now
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <div className="relative z-10">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Advanced Fleet Management
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Track, manage, and optimize your entire fleet with real-time insights. 
                The modern alternative to Samsara with all the features you need.
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Real-Time Tracking</span>
                </div>
                <div className="flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Smart Analytics</span>
                </div>
                <div className="flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Route Optimization</span>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link 
                  href="/signup"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 inline-block text-center"
                >
                  Join Now
                  <svg className="w-5 h-5 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link 
                  href="/signin"
                  className="w-full sm:w-auto border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 inline-block text-center"
                >
                  View Demo
                </Link>
              </div>
            </div>

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Screenshots Section */}
        <section id="screenshots" className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                See Fewblocs in Action
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Get a glimpse of our powerful fleet management platform. Click on any screenshot to view it in detail.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Screenshot 1 - Dashboard */}
              <div 
                className="aspect-video overflow-hidden rounded-xl cursor-pointer group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                onClick={() => openImageModal(
                  '/images/screenshots/fleet-dashboard.png',
                  'Fewblocs Fleet Dashboard',
                  'Fleet Dashboard Overview'
                )}
              >
                <Image
                  src="/images/screenshots/fleet-dashboard.png"
                  alt="Fewblocs Fleet Dashboard"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-900/90 rounded-lg px-4 py-2">
                    <span className="text-gray-900 dark:text-white font-medium">Click to enlarge</span>
                  </div>
                </div>
              </div>

              {/* Screenshot 2 - Live Map */}
              <div 
                className="aspect-video overflow-hidden rounded-xl cursor-pointer group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                onClick={() => openImageModal(
                  '/images/screenshots/fleet-route.png',
                  'Fewblocs Route Management',
                  'Route Management & Planning'
                )}
              >
                <Image
                  src="/images/screenshots/fleet-route.png"
                  alt="Fewblocs Route Management"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-900/90 rounded-lg px-4 py-2">
                    <span className="text-gray-900 dark:text-white font-medium">Click to enlarge</span>
                  </div>
                </div>
              </div>

              {/* Screenshot 3 - Vehicle Management */}
              <div 
                className="aspect-video overflow-hidden rounded-xl cursor-pointer group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                onClick={() => openImageModal(
                  '/images/screenshots/vehicles.png',
                  'Fewblocs Vehicle Management',
                  'Vehicle Management System'
                )}
              >
                <Image
                  src="/images/screenshots/vehicles.png"
                  alt="Fewblocs Vehicle Management"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-900/90 rounded-lg px-4 py-2">
                    <span className="text-gray-900 dark:text-white font-medium">Click to enlarge</span>
                  </div>
                </div>
              </div>

              {/* Screenshot 4 - Analytics */}
              <div 
                className="aspect-video overflow-hidden rounded-xl cursor-pointer group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                onClick={() => openImageModal(
                  '/images/screenshots/dispatch.png',
                  'Fewblocs Dispatch Management',
                  'Dispatch Management & Tracking'
                )}
              >
                <Image
                  src="/images/screenshots/dispatch.png"
                  alt="Fewblocs Dispatch Management"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-900/90 rounded-lg px-4 py-2">
                    <span className="text-gray-900 dark:text-white font-medium">Click to enlarge</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="text-center">
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 inline-block"
              >
                Experience These Features Today
                <svg className="w-5 h-5 ml-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose Fewblocs?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Get enterprise-grade fleet management with modern features. No complex contracts, just powerful tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Lightning Fast</h3>
                <p className="text-gray-600 dark:text-gray-300">Real-time updates and instant notifications keep you informed of every fleet movement.</p>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Easy to Use</h3>
                <p className="text-gray-600 dark:text-gray-300">Intuitive interface designed for fleet managers who need results, not complexity.</p>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Enterprise Security</h3>
                <p className="text-gray-600 dark:text-gray-300">Bank-level security with end-to-end encryption and compliance certifications.</p>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 inline-block"
              >
                Join as an Early Adopter!
                <svg className="w-6 h-6 ml-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 md:col-span-2">
                <Image
                  src="/images/logo/logo.svg"
                  alt="Fewblocs"
                  height={32}
                  width={120}
                  className="h-8 w-auto mb-4 brightness-0 invert"
                />
                <p className="text-gray-400 mb-6 max-w-md">
                  Advanced fleet management made simple. Track, manage, and optimize your entire fleet with real-time insights.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={() => setIsContactModalOpen(true)}
                      className="text-gray-400 hover:text-white transition-colors text-left"
                    >
                      Contact Us
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Fewblocs. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        imageSrc={modalState.imageSrc}
        imageAlt={modalState.imageAlt}
        title={modalState.title}
      />

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
} 