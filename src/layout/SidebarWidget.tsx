'use client';

import React, { useState } from "react";
import ContactSupportModal from "@/components/ui/ContactSupportModal";

export default function SidebarWidget() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleContactSupport = () => {
    setIsContactModalOpen(true);
  };

  return (
    <>
      <div
        className={`
          mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]`}
      >
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
          SolarOS Service Flow
        </h3>
        <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
          Track every customer from site and system records through warranties, maintenance, tickets, work orders, and service history.
        </p>
        <button
          onClick={handleContactSupport}
          className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600 w-full transition-colors"
        >
          Contact Support
        </button>
      </div>

      <ContactSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
}
