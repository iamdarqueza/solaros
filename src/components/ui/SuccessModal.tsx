'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: {
    dispatchId?: string;
    trackingId?: string;
    title?: string;
    plateNumber?: string;
    scheduledTime?: string;
    priority?: string;
    routeType?: string;
  };
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details,
  autoClose = true,
  autoCloseDelay = 4000
}) => {
  const [showContent, setShowContent] = useState(false);

  // Success checkmark animation data (simplified inline version)
  const successAnimation = {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: "Success",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Circle",
        sr: 1,
        ks: {
          o: { a: 0, k: 100, ix: 11 },
          r: { a: 0, k: 0, ix: 10 },
          p: { a: 0, k: [100, 100, 0], ix: 2 },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: {
            a: 1,
            k: [
              {
                i: { x: [0.42, 0.42, 0.42], y: [1, 1, 1] },
                o: { x: [0.58, 0.58, 0.58], y: [0, 0, 0] },
                t: 0,
                s: [0, 0, 100]
              },
              {
                i: { x: [0.42, 0.42, 0.42], y: [1, 1, 1] },
                o: { x: [0.58, 0.58, 0.58], y: [0, 0, 0] },
                t: 15,
                s: [120, 120, 100]
              },
              {
                t: 25,
                s: [100, 100, 100]
              }
            ],
            ix: 6
          }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [80, 80], ix: 2 },
                p: { a: 0, k: [0, 0], ix: 3 },
                nm: "Ellipse",
                hd: false
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.16, 0.73, 0.4, 1], ix: 4 },
                o: { a: 0, k: 100, ix: 5 },
                r: 1,
                bm: 0,
                nm: "Fill",
                hd: false
              }
            ],
            nm: "Circle",
            bm: 0,
            hd: false
          }
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "Check",
        sr: 1,
        ks: {
          o: { a: 0, k: 100, ix: 11 },
          r: { a: 0, k: 0, ix: 10 },
          p: { a: 0, k: [100, 100, 0], ix: 2 },
          a: { a: 0, k: [0, 0, 0], ix: 1 },
          s: { a: 0, k: [100, 100, 100], ix: 6 }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ind: 0,
                ty: "sh",
                ix: 1,
                ks: {
                  a: 1,
                  k: [
                    {
                      i: { x: 0.42, y: 1 },
                      o: { x: 0.58, y: 0 },
                      t: 25,
                      s: [{
                        i: [[0, 0], [0, 0], [0, 0]],
                        o: [[0, 0], [0, 0], [0, 0]],
                        v: [[-15, 5], [-15, 5], [-15, 5]],
                        c: false
                      }]
                    },
                    {
                      i: { x: 0.42, y: 1 },
                      o: { x: 0.58, y: 0 },
                      t: 45,
                      s: [{
                        i: [[0, 0], [0, 0], [0, 0]],
                        o: [[0, 0], [0, 0], [0, 0]],
                        v: [[-15, 5], [-5, 15], [-5, 15]],
                        c: false
                      }]
                    },
                    {
                      t: 65,
                      s: [{
                        i: [[0, 0], [0, 0], [0, 0]],
                        o: [[0, 0], [0, 0], [0, 0]],
                        v: [[-15, 5], [-5, 15], [20, -10]],
                        c: false
                      }]
                    }
                  ],
                  ix: 2
                },
                nm: "Path",
                hd: false
              },
              {
                ty: "st",
                c: { a: 0, k: [1, 1, 1, 1], ix: 3 },
                o: { a: 0, k: 100, ix: 4 },
                w: { a: 0, k: 6, ix: 5 },
                lc: 2,
                lj: 2,
                bm: 0,
                nm: "Stroke",
                hd: false
              }
            ],
            nm: "Check",
            bm: 0,
            hd: false
          }
        ],
        ip: 25,
        op: 90,
        st: 25,
        bm: 0
      }
    ]
  };

  useEffect(() => {
    if (isOpen) {
      // Show content after a brief delay for smooth animation
      const timer = setTimeout(() => setShowContent(true), 100);
      
      // Auto close if enabled
      if (autoClose) {
        const autoCloseTimer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => {
          clearTimeout(timer);
          clearTimeout(autoCloseTimer);
        };
      }
      
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setShowContent(false);
    setTimeout(onClose, 200); // Delay to allow exit animation
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          showContent ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 mx-4 max-w-md w-full transform transition-all duration-300 ${
        showContent 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-95 opacity-0 translate-y-4'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Lottie Animation */}
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24">
              <Lottie
                animationData={successAnimation}
                loop={false}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Details */}
          {details && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-3">
                Dispatch Details
              </h3>
              <div className="space-y-2 text-sm">
                {details.trackingId && (
                  <div className="flex justify-between items-center bg-green-100 dark:bg-green-800/30 rounded p-2 mb-3">
                    <span className="text-green-700 dark:text-green-300 font-medium">Tracking ID:</span>
                    <span className="font-mono font-bold text-green-900 dark:text-green-100 bg-white dark:bg-gray-800 px-2 py-1 rounded text-lg">
                      #{details.trackingId}
                    </span>
                  </div>
                )}
                {details.dispatchId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ID:</span>
                    <span className="font-medium text-gray-900 dark:text-white">#{details.dispatchId}</span>
                  </div>
                )}
                {details.title && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Title:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{details.title}</span>
                  </div>
                )}
                {details.plateNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{details.plateNumber}</span>
                  </div>
                )}
                {details.scheduledTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Scheduled:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{details.scheduledTime}</span>
                  </div>
                )}
                {details.priority && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                    <span className={`font-medium capitalize ${
                      details.priority === 'urgent' 
                        ? 'text-red-600 dark:text-red-400'
                        : details.priority === 'high'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {details.priority}
                    </span>
                  </div>
                )}
                {details.routeType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Route Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {details.routeType.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal; 