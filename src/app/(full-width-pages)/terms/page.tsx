import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            <strong>Effective Date:</strong> January 1, 2025<br/>
            <strong>Last Updated:</strong> January 1, 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Welcome to Fewblocs. These Terms of Service (&quot;Terms&quot;) govern your use of our fleet management platform and related services (the &quot;Services&quot;) operated by Fewblocs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of these Terms, then you may not access the Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Description of Services</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Fewblocs provides a comprehensive fleet management platform that includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Real-time vehicle tracking and GPS monitoring</li>
                <li>Route optimization and planning tools</li>
                <li>Vehicle maintenance scheduling and management</li>
                <li>Driver performance monitoring and analytics</li>
                <li>Fuel consumption tracking and reporting</li>
                <li>Dispatch management and coordination</li>
                <li>Fleet analytics and reporting dashboards</li>
                <li>Document and attachment management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Account Registration</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To access our Services, you must create an account by providing accurate, complete, and current information. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Account Responsibilities</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Maintain the security of your login credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Provide accurate and up-to-date account information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Use the Services only for lawful business purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree not to use the Services to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Transmit harmful, threatening, abusive, or offensive content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Services or servers</li>
                <li>Use the Services for any illegal or unauthorized purpose</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Services</li>
                <li>Remove or alter any proprietary notices or labels</li>
                <li>Use automated tools to access the Services without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Data and Privacy</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Your Data</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You retain ownership of all data you submit to our Services (&quot;Customer Data&quot;). By using our Services, you grant us a limited license to process your Customer Data solely for the purpose of providing the Services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Data Security</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement industry-standard security measures to protect your data. However, you acknowledge that no system is completely secure, and you use the Services at your own risk.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Privacy Policy</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our collection and use of personal information is governed by our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Service Availability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                While we strive to provide reliable Services, we do not guarantee that the Services will be available 100% of the time. The Services may be temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Scheduled maintenance and updates</li>
                <li>Technical difficulties or system failures</li>
                <li>Third-party service provider issues</li>
                <li>Force majeure events beyond our control</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                We will use reasonable efforts to provide advance notice of scheduled maintenance when possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Our Rights</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The Services, including all software, technology, content, and trademarks, are owned by Fewblocs or our licensors. We retain all intellectual property rights in the Services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">License to Use</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to access and use the Services for your internal business purposes during the term of your subscription.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Payment Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Current Pricing</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                During our beta phase, access to the Services is provided at no cost. We reserve the right to introduce pricing in the future with reasonable advance notice to existing users.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Future Billing</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When pricing is introduced, the following terms will apply:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Subscription fees are billed in advance</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>We may change pricing with 30 days&apos; advance notice</li>
                <li>Continued use after price changes constitutes acceptance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">9. Termination</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Termination by You</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may terminate your account at any time by contacting our support team or using the account deletion feature in your dashboard.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Termination by Us</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may terminate or suspend your account immediately if you:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Violate these Terms or our Acceptable Use Policy</li>
                <li>Fail to pay applicable fees (when billing is introduced)</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Pose a security risk to our Services or other users</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Effect of Termination</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Upon termination, your access to the Services will cease, and we may delete your account and data after a reasonable period. You should export any important data before termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">10. Disclaimers and Limitation of Liability</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Service Disclaimers</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Limitation of Liability</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FEWBLOCS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">11. Indemnification</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree to indemnify, defend, and hold harmless Fewblocs and its affiliates from any claims, damages, losses, or expenses arising from:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                <li>Your use of the Services</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your Customer Data or its use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">12. Governing Law and Disputes</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms are governed by the laws of the jurisdiction where Fewblocs is incorporated, without regard to conflict of law principles. Any disputes arising under these Terms will be resolved through binding arbitration or in the courts of that jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may modify these Terms at any time by posting the updated Terms on our website. Material changes will be communicated via email or through the Services. Your continued use after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">14. General Provisions</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Entire Agreement</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms, together with our Privacy Policy and any other legal notices published by us, constitute the entire agreement between you and Fewblocs regarding the Services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Severability</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Assignment</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You may not assign or transfer these Terms without our written consent. We may assign these Terms without restriction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">15. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> support@fewblocs.com<br/>
                  <strong>Subject Line:</strong> Terms of Service Inquiry<br/>
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