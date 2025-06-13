
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com';

export const metadata: Metadata = {
  title: `Terms of Service | ${siteConfig.name}`,
  description: `Review the Terms of Service for ${siteConfig.name}. Understand your rights and responsibilities when using our AI-powered education platform.`,
  keywords: ["Learnify terms of service", "user agreement", "platform rules", "education software terms", "Learnify ToS"],
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: `Terms of Service - ${siteConfig.name}`,
    description: `Read the official Terms of Service for using the ${siteConfig.name} platform.`,
    url: `${APP_URL}/terms`,
  },
  twitter: {
    title: `${siteConfig.name} - Terms of Service`,
    description: `User agreement and terms for the ${siteConfig.name} educational platform.`,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto card-shadow">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <p>Please read these Terms of Service (&quot;Terms&quot;, &quot;Terms of Service&quot;) carefully before using the Learnify website (the &quot;Service&quot;) operated by Learnify (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;).</p>

          <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>

          <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>

          <h2>Accounts</h2>
          <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
          <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
          <p>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

          <h2>Intellectual Property</h2>
          <p>The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Learnify and its licensors. The Service is protected by copyright, trademark, and other laws of both Kenya and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Learnify.</p>

          <h2>User Content</h2>
          <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (&quot;Content&quot;). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.</p>
          <p>By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service for the purpose of operating and providing the Service. You retain any and all ofyour rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights.</p>

          <h2>Links To Other Web Sites</h2>
          <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by Learnify.</p>
          <p>Learnify has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that Learnify shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.</p>
          <p>We strongly advise you to read the terms and conditions and privacy policies of any third-party web sites or services that you visit.</p>

          <h2>Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service, or contact us to request account deletion.</p>
          
          <h2>Limitation Of Liability</h2>
          <p>In no event shall Learnify, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>

          <h2>Disclaimer</h2>
          <p>Your use of the Service is at your sole risk. The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.</p>
          <p>Learnify its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.</p>
          
          <h2>Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.</p>
          <p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have between us regarding the Service.</p>
          
          <h2>Changes</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
          <p>By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul>
            <li>By email: learnifyke@gmail.com</li>
            <li>By visiting this page on our website: <a href="/contact">Contact Us</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
