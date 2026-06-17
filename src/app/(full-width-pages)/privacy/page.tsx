import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/landing" className="flex items-center">
              <Image
                src="/images/logo/logo.svg"
                alt="Fewblocs"
                height={32}
                width={120}
                className="h-8 w-auto"
              />
            </Link>
            <Link 
              href="/landing"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            <strong>Effective Date:</strong> January 1, 2025<br/>
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Fewblocs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fleet management platform and related services (the &quot;Services&quot;).
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By using our Services, you consent to the data practices described in this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Name, email address, and contact information</li>
                <li>Company name and business information</li>
                <li>Account credentials and authentication information</li>
                <li>Payment and billing information</li>
                <li>Communications with our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Fleet and Vehicle Data</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Through our fleet management services, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Vehicle location data and GPS coordinates</li>
                <li>Vehicle identification information (VIN, license plates, etc.)</li>
                <li>Driving patterns, routes, and mileage data</li>
                <li>Vehicle maintenance records and schedules</li>
                <li>Fuel consumption and efficiency metrics</li>
                <li>Driver information and performance data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Technical Information</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We automatically collect certain technical information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>IP address and device identifiers</li>
                <li>Browser type and operating system</li>
                <li>Usage patterns and feature interactions</li>
                <li>Log files and error reports</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Provide and maintain our fleet management services</li>
                <li>Process transactions and manage your account</li>
                <li>Send important notifications and updates</li>
                <li>Provide customer support and technical assistance</li>
                <li>Improve our services and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>Generate analytics and insights for fleet optimization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating our platform</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of Fewblocs, our users, or others</li>
                <li><strong>With Consent:</strong> When you explicitly consent to the sharing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication measures</li>
                <li>Secure data centers and infrastructure</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. Specific retention periods include:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Account information: Until account deletion or as required by law</li>
                <li>Fleet data: As specified in your service agreement</li>
                <li>Transaction records: As required by applicable law and regulations</li>
                <li>Support communications: Up to 3 years for quality assurance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
                <li><strong>Objection:</strong> Object to certain types of processing</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                To exercise these rights, please contact us at support@fewblocs.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and similar technologies to enhance your experience and analyze usage patterns. You can control cookie preferences through your browser settings, though this may affect service functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware of such collection, we will take steps to delete the information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website and updating the &quot;Last Updated&quot; date. Your continued use of our Services after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> support@fewblocs.com<br/>
                  <strong>Subject Line:</strong> Privacy Policy Inquiry<br/>
                  <strong>Company:</strong> Fewblocs<br/>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 