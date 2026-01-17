import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Amgel Jodi - GSB Konkani Matrimony',
  description: 'Read the Terms of Service for Amgel Jodi, the trusted GSB Konkani matrimony platform. Understand your rights and responsibilities as a member.',
  alternates: {
    canonical: 'https://amgeljodi.com/terms',
  },
}

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-myColor-900 mb-8">
            Terms of Service
          </h1>

          <p className="text-myColor-600 mb-8">
            Last updated: January 2025
          </p>

          <div className="prose prose-lg max-w-none text-myColor-700">
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to Amgel Jodi. By accessing or using our matrimony platform, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our services.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and Amgel Jodi regarding your use of our platform for matrimonial purposes within the GSB Konkani community.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">2. Eligibility</h2>
              <p className="mb-4">To use Amgel Jodi, you must:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Be legally capable of entering into a binding contract</li>
                <li>Not be prohibited from using the service under applicable laws</li>
                <li>Be unmarried, divorced, or widowed and seeking matrimonial alliance</li>
                <li>Belong to or be associated with the GSB Konkani community</li>
                <li>Provide accurate and truthful information</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">3. Account Registration</h2>
              <p className="mb-4">When creating an account, you agree to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Keep your login credentials confidential</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Not create multiple accounts or accounts on behalf of others without authorization</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">4. User Conduct</h2>
              <p className="mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide false or misleading information in your profile</li>
                <li>Upload inappropriate, offensive, or copyrighted content</li>
                <li>Harass, abuse, or harm other members</li>
                <li>Use the platform for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to other accounts</li>
                <li>Use automated systems or bots to access the platform</li>
                <li>Solicit money or engage in fraudulent activities</li>
                <li>Share contact information publicly before establishing trust</li>
                <li>Use the platform for commercial purposes without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">5. Profile Verification</h2>
              <p className="mb-4">
                Amgel Jodi may verify profiles to maintain platform integrity. Verification may include:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Phone number verification</li>
                <li>Email verification</li>
                <li>Identity document verification (optional)</li>
                <li>Photo verification</li>
              </ul>
              <p>
                While we strive to verify profiles, we cannot guarantee the accuracy of all information provided by users. Members are encouraged to exercise due diligence.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">6. Content Ownership</h2>
              <p className="mb-4">
                <strong>Your Content:</strong> You retain ownership of content you upload (photos, text, etc.). By uploading content, you grant Amgel Jodi a non-exclusive license to use, display, and distribute your content within the platform.
              </p>
              <p className="mb-4">
                <strong>Our Content:</strong> All platform content, including design, logos, and features, is owned by Amgel Jodi and protected by intellectual property laws.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">7. Privacy</h2>
              <p>
                Your privacy is important to us. Please review our <a href="/privacy" className="text-myColor-600 hover:text-myColor-800 underline">Privacy Policy</a> to understand how we collect, use, and protect your personal information.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">8. Termination</h2>
              <p className="mb-4">
                We reserve the right to suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Violate these Terms of Service</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Harass or harm other members</li>
                <li>Provide false information</li>
                <li>Misuse the platform in any way</li>
              </ul>
              <p>
                You may also delete your account at any time through your account settings.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">9. Disclaimer of Warranties</h2>
              <p className="mb-4">
                Amgel Jodi is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>That you will find a suitable match</li>
                <li>The accuracy of information provided by other users</li>
                <li>Uninterrupted or error-free service</li>
                <li>The behavior or intentions of other members</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">10. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Amgel Jodi shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount you paid us in the past twelve months.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Amgel Jodi, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the platform or violation of these Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">13. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will notify you of significant changes by posting a notice on our platform or sending you an email. Your continued use of Amgel Jodi after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold text-myColor-900 mb-4">14. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-myColor-50 rounded-xl p-6">
                <p className="mb-2"><strong>Email:</strong> amgeljodi26@gmail.com</p>
                <p className="mb-2"><strong>Address:</strong> Amgel Jodi, India</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
