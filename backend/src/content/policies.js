'use strict';

/**
 * Legal pages for vidapulse.io: Privacy Policy, Terms of Use, Refund Policy,
 * Shipping (Delivery) Policy. One shared view (backend/views/policy.ejs),
 * rendered live on the Railway landing hosts (backend/src/index.js) and by
 * scripts/export-static.js for Cloudflare Pages.
 *
 * Adapted from the Assess360 policies (same operator, same structure, terms
 * and timelines), with VidaPulse's product, plans and billing. Paragraph and
 * list strings are trusted HTML written here (they carry mailto links).
 *
 * Writing rules: no em dashes; dates DD-MM-YYYY. When you revise a page, set
 * its updatedOn (ISO YYYY-MM-DD) to today: the page, sitemap and JSON-LD read it.
 */

const { displayDate } = require('./comparisons');

const ENTITY  = 'GND APPLY GITA WISDOM EDUCATION (OPC) PRIVATE LIMITED';
const ADDRESS = '306/55, 3RD LINE EXTENSION, BRAJA NAGAR, Brahampur, Dist: Ganjam, Odisha, 760001';
const EMAIL   = 'support@vidapulse.io';
const MAIL    = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;
const CONTACT_LINE = `${ENTITY}, ${ADDRESS}.`;

const POLICIES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'How VidaPulse collects, uses and protects personal data: account data, billing through Razorpay, and the viewer analytics it processes for customers.',
    updatedOn: '2026-11-15',
    intro: [
      `This Privacy Policy explains how ${ENTITY} ("we", "us"), which operates VidaPulse, handles personal data. It is intended to be consistent with India's Digital Personal Data Protection Act, 2023 and applicable rules.`,
    ],
    sections: [
      { h2: '1. Who we are', p: [
        `${CONTACT_LINE} For account holders we are the data fiduciary. For the viewer data our customers collect when they track their videos with VidaPulse, our customer is the data fiduciary and we act as a data processor on their instructions.`,
      ] },
      { h2: '2. Information we collect', ul: [
        '<strong>Account data:</strong> name, email, phone number if you give it, and login credentials (or your Google account details if you sign in with Google).',
        '<strong>Usage data:</strong> log, device and analytics data about how the Service and our website are used.',
        '<strong>Billing data:</strong> processed by our payment processor (Razorpay); we do not store full card details.',
        '<strong>Viewer data:</strong> when a customer adds the VidaPulse script to their page, we record how visitors watch the customer\'s video (plays, watch time, drop-off points), an anonymous viewer ID kept in the visitor\'s browser, the page address, referrer and UTM parameters, device and browser, and approximate location derived from the IP address. This is processed on the customer\'s behalf.',
      ] },
      { h2: '3. How we use personal data', ul: [
        'to provide, secure, and improve the Service;',
        'to process payments and manage your account;',
        'to communicate service, security and (where permitted) product updates;',
        'to comply with legal obligations.',
      ] },
      { h2: '4. Legal basis and consent', p: [
        'We process personal data on the basis of your consent and for the legitimate uses permitted by law, including performing our contract with you. You may withdraw consent at any time, which may limit some features.',
      ] },
      { h2: '5. Sharing and processors', p: ['We share data only as needed to run the Service, with providers such as:'], ul: [
        'cloud hosting and content delivery;',
        'a payment processor (Razorpay) for billing;',
        'Google, when you choose to sign in with Google;',
        'analytics on our own website (Microsoft Clarity);',
        'advertising platforms (for example Meta) where you enable conversion or pixel forwarding;',
        'authorities where required by law.',
      ] },
      { h2: '6. Cookies and tracking', p: [
        'We use necessary cookies to run the Service (for example to keep you signed in) and, on our website, analytics tags. You can control non-essential cookies through your browser.',
      ] },
      { h2: '7. Data retention', p: [
        'We keep personal data for as long as your account is active or as needed to provide the Service, then delete or anonymise it unless a longer period is required by law.',
      ] },
      { h2: '8. Security', p: [
        'We use reasonable technical and organisational measures, including encryption of sensitive secrets at rest. No method of transmission or storage is completely secure.',
      ] },
      { h2: '9. Your rights', p: [
        `Subject to law, you may request access to, correction of, or erasure of your personal data, and may nominate another person to exercise your rights. To make a request, email ${MAIL}.`,
      ] },
      { h2: '10. Grievance Officer', p: [
        `For privacy questions or complaints, contact our Grievance Officer at ${MAIL}, ${CONTACT_LINE} We will respond within the timelines required by law.`,
      ] },
      { h2: '11. Children', p: [
        'The Service is not directed to children, and we do not knowingly process a child\'s personal data without verifiable parental consent as required by law.',
      ] },
      { h2: '12. Changes', p: [
        'We may update this Policy from time to time. Material changes will be notified through the Service or by email.',
      ] },
    ],
  },

  {
    slug: 'terms-of-use',
    title: 'Terms of Use',
    description: 'The terms that govern your use of VidaPulse: accounts, plans and billing, acceptable use, your data, liability and governing law.',
    updatedOn: '2026-11-15',
    intro: [
      `These Terms of Use ("Terms") govern your access to and use of VidaPulse (the "Service"), operated by ${ENTITY} ("we", "us"). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.`,
    ],
    sections: [
      { h2: '1. The Service', p: [
        'VidaPulse measures how viewers watch the videos you already host. You add a video link and a script to your own pages, and the Service shows play rate, drop-off points, engagement heatmaps and traffic sources. VidaPulse does not host your videos. Features available to you depend on your plan.',
      ] },
      { h2: '2. Accounts and eligibility', p: [
        'You must provide accurate information and are responsible for activity under your account and for keeping your credentials secure. You must be able to form a binding contract to use the Service.',
      ] },
      { h2: '3. Plans and billing', ul: [
        'A Free plan is available and requires no card. Paid plans are billed in advance, monthly or yearly, on a recurring basis until cancelled.',
        'When a paid period ends without renewal, your account moves to the Free plan: your videos and analytics are kept, and features beyond the Free plan stop until you choose a paid plan again.',
        'Prices are displayed on our pricing page, in INR for customers in India and in USD elsewhere. INR prices are exclusive of applicable taxes (including GST): 18% GST is added at checkout for customers in India. USD prices for customers outside India are charged at the plan price.',
        'You can cancel at any time from the Billing page in the app (Cancel plan), or by emailing support@vidapulse.io. Payments are non-refundable. Cancelling before the renewal date stops the next charge and you keep access until the period you paid for ends. See the <a href="/refund-policy">Refund Policy</a>.',
        'You authorise us and our payment processor (Razorpay) to charge your chosen payment method for each billing period.',
        'Plan limits (such as the number of videos and the features included) apply as described on the pricing page.',
      ] },
      { h2: '4. Acceptable use', p: ['You agree not to use the Service to:'], ul: [
        'break any law, or infringe the rights of others;',
        'collect personal data of viewers without a lawful basis and proper notice;',
        'send spam, malware, or attempt to disrupt or reverse-engineer the Service;',
        'resell or provide the Service to third parties except as your plan permits.',
      ] },
      { h2: '5. Your content and your viewers', p: [
        'You retain ownership of your videos and of the analytics data collected for them ("Your Content"). You are the controller of your viewers\' personal data; we process it on your behalf to provide the Service. You are responsible for having a lawful basis and privacy notice for the data you collect. You grant us the limited rights needed to process Your Content to run the Service.',
      ] },
      { h2: '6. Third-party services', p: [
        'The Service works with third parties you choose to use, for example a payment processor (Razorpay), Google sign-in, the platforms where your videos are hosted, and advertising platforms you connect for conversion forwarding. Your use of those is subject to their terms, and you are responsible for the accounts and keys you connect.',
      ] },
      { h2: '7. Intellectual property', p: [
        `The Service, including its software, design and trademarks, is owned by ${ENTITY} and its licensors. These Terms grant you no rights in it except the right to use it per your plan.`,
      ] },
      { h2: '8. Disclaimers and limitation of liability', p: [
        'The Service is provided "as is" without warranties of any kind to the extent permitted by law. To the maximum extent permitted by law, our total liability arising out of or relating to the Service is limited to the amount you paid us in the three months before the event giving rise to the claim. We are not liable for indirect or consequential losses.',
      ] },
      { h2: '9. Termination', p: [
        'You may stop using the Service and cancel at any time. We may suspend or terminate access for breach of these Terms or to comply with law. On termination, your right to use the Service ends; provisions that by their nature should survive will survive.',
      ] },
      { h2: '10. Governing law and jurisdiction', p: [
        'These Terms are governed by the laws of India. The courts at Brahampur, Odisha shall have exclusive jurisdiction over any dispute, subject to applicable law.',
      ] },
      { h2: '11. Changes', p: [
        'We may update these Terms from time to time. Material changes will be notified through the Service or by email. Continued use after changes take effect means you accept them.',
      ] },
      { h2: '12. Contact', p: [
        `${CONTACT_LINE} Questions about these Terms: ${MAIL}.`,
      ] },
    ],
  },

  {
    slug: 'refund-policy',
    title: 'Refund and Cancellation Policy',
    description: 'Payments are non-refundable. Cancel before the renewal date to stop billing, and keep access until the period you paid for ends.',
    updatedOn: '2026-11-15',
    intro: [
      `This policy explains how billing, cancellations and refunds work for VidaPulse, operated by ${ENTITY}.`,
    ],
    sections: [
      { h2: '1. Free plan', p: [
        'VidaPulse has a Free plan for 1 video with no time limit. It takes no card and no payment, so no refunds apply to it. You can evaluate the Service on the Free plan before you pay.',
      ] },
      { h2: '2. Paid subscriptions', ul: [
        'Paid plans are billed in advance for the chosen billing period (monthly or yearly). Payments are processed by Razorpay.',
        'Prices are shown on our pricing page, in INR for customers in India and in USD elsewhere. INR prices are exclusive of applicable taxes, which are added where required: 18% GST is added at checkout for customers in India. USD prices for customers outside India are charged at the plan price.',
        'Your subscription renews automatically on the renewal date until you cancel.',
        'After you cancel, you are not charged again once your current billing period ends. You keep using the paid features until that date.',
      ] },
      { h2: '3. Cancellation and renewal', p: [
        `You can cancel at any time from your account: open Billing in the app and choose <strong>Cancel plan</strong>. If you cannot reach the button, email ${MAIL} from your account email before the renewal date and we will cancel for you. You keep full access to everything you have already paid for until the end of the current billing period. Cancelling does not cut your access short.`,
        '<strong>Cancel before the renewal date and you are not charged again.</strong> There are no further charges once the current period ends: the subscription simply stops renewing. This is how you end your billing with us, and it is why there is nothing to refund afterwards.',
        'At the end of that period your account moves to the Free plan. Your videos and analytics are kept and nothing is deleted; features beyond the Free plan stop until you choose a paid plan again, which restores them.',
      ] },
      { h2: '4. No refunds', p: [
        '<strong>Payments are non-refundable.</strong> Once a billing period has started it is not refundable, in whole or in part. We do not pro-rate or refund:',
      ], ul: [
        'a period you cancelled part-way through;',
        'time left over at the end of a period;',
        'a period you used little or not at all;',
        'a renewal you intended to cancel but did not cancel before the renewal date.',
      ], after: [
        'Cancelling before the renewal date is the way to avoid the next charge. Because you keep the full period you paid for and are not charged beyond it, a refund is not part of how this works.',
      ] },
      { h2: '5. Charges made in error', p: [
        'If a genuine mistake on our side caused a charge, you get your money back. That is a correction, not a refund, and it is at our discretion whether a case is genuine, or whether we would rather return a payment and close the account.',
      ] },
      { h2: '6. How to reach us about billing', p: [
        `To report a charge made in error or ask a billing question, email ${MAIL} from your account email with your account details and the charge in question. To cancel, use Cancel plan on the Billing page; cancellation does not require emailing us, though email remains available as a fallback.`,
      ] },
      { h2: '7. Contact', p: [
        `${CONTACT_LINE} Billing questions: ${MAIL}.`,
      ] },
    ],
  },

  {
    slug: 'shipping-policy',
    title: 'Shipping and Delivery Policy',
    description: 'How VidaPulse is delivered: a digital service with access by account, no physical shipping.',
    updatedOn: '2026-11-15',
    intro: [
      'VidaPulse is a software-as-a-service product delivered entirely online. There is <strong>no physical shipping</strong> of any goods.',
    ],
    sections: [
      { h2: 'How the service is delivered', p: [
        'Access is provided electronically through your VidaPulse account at app.vidapulse.io. When you create an account, it is available immediately. When you subscribe to a paid plan, the corresponding features are enabled on your account as soon as payment is confirmed, typically within a few minutes.',
      ] },
      { h2: 'No physical goods', p: [
        'Because VidaPulse is a digital service, nothing is dispatched, couriered, or delivered to a physical address, and no shipping charges apply.',
      ] },
      { h2: 'Delivery issues', p: [
        `If a feature you paid for is not enabled on your account shortly after payment, contact ${MAIL} and we will resolve it. Billing and cancellation terms are covered in our <a href="/refund-policy">Refund and Cancellation Policy</a>.`,
      ] },
      { h2: 'Contact', p: [
        `${CONTACT_LINE} Questions: ${MAIL}.`,
      ] },
    ],
  },
];

POLICIES.forEach((p) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.updatedOn || '')) throw new Error(`policies: ${p.slug} needs updatedOn YYYY-MM-DD`);
  p.updatedLabel = displayDate(p.updatedOn);
});

const BY_SLUG = new Map(POLICIES.map((p) => [p.slug, p]));

/** JSON-LD (WebPage + BreadcrumbList) for one policy page, safe inside <script>. */
function jsonLdFor(p) {
  const url = `https://vidapulse.io/${p.slug}`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url, url, name: p.title, description: p.description, dateModified: p.updatedOn },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'VidaPulse', item: 'https://vidapulse.io/' },
          { '@type': 'ListItem', position: 2, name: p.title, item: url },
        ],
      },
    ],
  }).replace(/</g, '\\u003c');
}

module.exports = { POLICIES, BY_SLUG, jsonLdFor, ENTITY, EMAIL };
