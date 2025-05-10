import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
            <li>Usage Data</li>
          </ul>

          {/* Add more sections as needed: Usage Data, Cookies, Use of Data, Transfer of Data, Disclosure of Data, Security, etc. */}

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
            Policy are effective when they are posted on this page.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul>
            <li>By email: privacy@learnify.example.com</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
