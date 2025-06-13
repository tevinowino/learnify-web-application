
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com';

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: `Read the Privacy Policy for ${siteConfig.name}. Understand how we collect, use, and protect your personal data on our AI-powered education platform.`,
  keywords: ["Learnify privacy policy", "data protection", "education platform privacy", "user data Learnify", "student data privacy"],
  alternates: {
    canonical: '/privacy',
  },
   openGraph: {
    title: `Privacy Policy - ${siteConfig.name}`,
    description: `Learn how ${siteConfig.name} handles your personal information and ensures data privacy on our educational platform.`,
    url: `${APP_URL}/privacy`,
  },
  twitter: {
    title: `Privacy at ${siteConfig.name}`,
    description: `Review ${siteConfig.name}'s commitment to data privacy and how we protect user information.`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-3xl mx-auto card-shadow">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <p>
            Learnify (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) operates the Learnify website (the &quot;Service&quot;).
            This page informs you of our policies regarding the collection, use, and disclosure of personal
            data when you use our Service and the choices you have associated with that data.
          </p>

          <h2>Information Collection and Use</h2>
          <p>
            We collect several different types of information for various purposes to provide and improve our
            Service to you.
          </p>
          
          <h3>Types of Data Collected</h3>
          <h4>Personal Data</h4>
          <p>
            While using our Service, we may ask you to provide us with certain personally identifiable information
            that can be used to contact or identify you (&quot;Personal Data&quot;). Personally identifiable information
            may include, but is not limited to:
          </p>
          <ul>
            <li>Email address</li>
            <li>First name and last name</li>
            <li>School Information (for Admins, Teachers, Students)</li>
            <li>Class Information</li>
            <li>Role (Admin, Teacher, Student, Parent)</li>
            <li>Child's Student ID (for Parents)</li>
            <li>Usage Data (how you interact with the Service)</li>
            <li>Learning progress and assignment submissions (for Students and Teachers)</li>
          </ul>

          <h4>Usage Data</h4>
          <p>We may also collect information on how the Service is accessed and used (&quot;Usage Data&quot;). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</p>

          <h4>Tracking &amp; Cookies Data</h4>
          <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.</p>

          <h2>Use of Data</h2>
          <p>{siteConfig.name} uses the collected data for various purposes:</p>
          <ul>
            <li>To provide and maintain the Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
            <li>To provide customer care and support</li>
            <li>To provide analysis or valuable information so that we can improve the Service</li>
            <li>To monitor the usage of the Service</li>
            <li>To detect, prevent and address technical issues</li>
            <li>To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.</li>
            <li>To manage user accounts and provide role-based access.</li>
            <li>To facilitate communication between users (e.g., teachers and students).</li>
            <li>To enable AI-powered features like personalized learning paths and AI tutoring.</li>
          </ul>

          <h2>Transfer Of Data</h2>
          <p>Your information, including PersonalData, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.</p>
          <p>If you are located outside Kenya and choose to provide information to us, please note that we transfer the data, including Personal Data, to Kenya and process it there.</p>
          <p>Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.</p>
          <p>{siteConfig.name} will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy and no transfer of your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of your data and other personal information.</p>
          
          <h2>Security of Data</h2>
          <p>The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>

          <h2>Service Providers</h2>
          <p>We may employ third party companies and individuals to facilitate our Service (&quot;Service Providers&quot;), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.</p>
          <p>These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose. (e.g., Firebase for backend services, Cloudinary for file uploads, EmailJS for email notifications).</p>

          <h2>Links to Other Sites</h2>
          <p>Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.</p>
          <p>We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</p>

          <h2>Children's Privacy</h2>
          <p>Our Service addresses users who may be children (&quot;Child&quot; or &quot;Children&quot;). We collect Personal Data from Children directly when they register as students or when such data is provided by their school administrators or teachers. This information is used to provide the educational services of Learnify, including tracking progress, managing assignments, and facilitating communication within the educational context.</p>
          <p>Parental consent for the collection of a Child's Personal Data is obtained through the school or educational institution that signs up for Learnify, or directly from parents if they register their child. Parents have the right to review the information collected from their Child, can request deletion of this information, and can refuse to allow further collection or use of the Child's information by contacting us.</p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page. We will let you know via email and/or a prominent notice on our Service, prior to the change becoming effective and update the &quot;last updated&quot; date at the top of this Privacy Policy.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
            Policy are effective when they are posted on this page.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>By email: learnifyke@gmail.com</li>
            <li>By visiting this page on our website: <a href="/contact">Contact Us</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
