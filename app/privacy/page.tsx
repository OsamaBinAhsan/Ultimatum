import React from 'react';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10 text-zinc-300">
      <header className="space-y-3 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <ShieldCheck className="w-4 h-4" />
          <span>LEGAL & COMPLIANCE</span>
        </div>
        <h1 className="text-4xl font-black text-white">Privacy Policy & Cookie Disclosures</h1>
        <p className="text-sm text-zinc-400">
          Last Updated: August 2026 • Compliant with GDPR, CCPA, and Google AdSense / Publisher Policies.
        </p>
      </header>

      <div className="space-y-8 leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            Ultimatum collects minimal information required to deliver our high-traffic interactive services. When you play games in The Arcade, your game scores, anonymous player handle, and engagement points are stored to maintain the live weekly leaderboards.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <span>2. Advertising & Third-Party Cookies (AdSense / Ezoic / Partners)</span>
          </h2>
          <p>
            We partner with third-party advertising networks (including Google AdSense, Ezoic, and Direct Brand Sponsors) to display advertisements on our web platform. These networks may use cookies, web beacons, and similar tracking technologies to serve relevant ads based on prior visits to this and other websites.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>Users may opt out of personalized advertising by visiting Google Ads Settings.</li>
            <li>You can also opt out of a third-party vendor's use of cookies for personalized advertising by visiting www.aboutads.info.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>3. Affiliate Marketing Disclosures</span>
          </h2>
          <p>
            The Lab review pages contain affiliate links. If you click on an affiliate link and make a purchase, Ultimatum may receive a small referral commission at no additional cost to you. This compensation does not influence our rigorous testing methodology or rating scores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. User Rights & Data Deletion (GDPR / CCPA)</h2>
          <p>
            You have the right to access, export, or request deletion of your user account, leaderboard history, and engagement points at any time by contacting privacy@ultimatum.gg or via our Admin request portal.
          </p>
        </section>
      </div>
    </div>
  );
}
