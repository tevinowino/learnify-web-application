import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

          {/* Add more sections: Intellectual Property, Links To Other Web Sites, Termination, Limitation Of Liability, Governing Law, Changes, Contact Us */}
          
          <h2>Changes</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul>
            <li>By email: legal@learnify.example.com</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
