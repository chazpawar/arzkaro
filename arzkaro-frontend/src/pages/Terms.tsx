import React from 'react';

// Define the structure for the Table of Contents
interface TocItem {
  id: string;
  label: string;
}

const Terms: React.FC = () => {
  // --- TOC Data Structure ---
  const toc: TocItem[] = [
    { id: 'acceptance-of-terms', label: '1. Acceptance of Terms' },
    { id: 'eligibility', label: '2. Eligibility' },
    { id: 'user-accounts', label: '3. User Accounts' },
    { id: 'definitions', label: '4. Definitions' },
    { id: 'user-conduct', label: '5. User Conduct & Prohibited Activities' },
    { id: 'community-messaging-rules', label: '6. Community & Messaging Rules' },
    { id: 'verification', label: '7. Verification' },
    { id: 'content-ip-rights', label: '8. Content & Intellectual Property Rights' },
    { id: 'role-of-arz', label: '9. Role of Arz' },
    { id: 'hosting-listings', label: '10. Hosting & Listings (Host Obligations)' },
    { id: 'ticketing-terms', label: '11. Ticketing Terms (Buyers)' },
    { id: 'refunds-cancellations', label: '12. Refunds, Cancellations & Rescheduling' },
    { id: 'ticket-transfers', label: '13. Ticket Transfers, Resale & Anti-Scalping' },
    { id: 'user-responsibility', label: '14. User Responsibility and Consequences' },
    { id: 'assumption-of-risk', label: '15. Assumption of Risk and Liability Waiver' },
    { id: 'general-legal-provisions', label: '16. General Legal Provisions' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset by a bit to account for sticky headers/TOC if necessary
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- Theme/Styling Placeholders ---
  // Apply your brand theme here. Assuming a structure like Tailwind CSS classes.
  const styles = {
    container:
      'bg-[var(--arz-background, #f8f8f8)] text-[var(--arz-text, #333)] min-h-screen py-10',
    contentWrapper: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row',
    tocContainer: 'lg:w-1/4 lg:sticky top-20 h-fit lg:mr-8 p-4 bg-white shadow-lg rounded-xl',
    termsBody: 'lg:w-3/4 bg-white p-6 md:p-10 shadow-lg rounded-xl',
    mainHeading: 'text-4xl font-extrabold text-[var(--arz-primary, #4a00e0)] mb-6',
    subHeading: 'text-2xl font-bold text-[var(--arz-text, #333)] mt-8 mb-4 border-b pb-2',
    sectionHeading: 'text-3xl font-bold text-[var(--arz-primary, #4a00e0)] mt-12 mb-6',
    paragraph: 'mb-4 leading-relaxed',
    list: 'list-disc ml-6 space-y-2',
    strong: 'font-semibold text-[var(--arz-primary, #4a00e0)]',
    tocLink:
      'block py-1 text-sm text-gray-600 hover:text-[var(--arz-primary, #4a00e0)] transition-colors cursor-pointer',
    tocActiveLink:
      'font-bold text-[var(--arz-primary, #4a00e0)] border-l-4 border-[var(--arz-primary, #4a00e0)] pl-2',
  };

  // Helper function for the main content
  const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className={styles.paragraph}>{children}</p>
  );

  return (
    <div className={styles.container}>
      {/* Ensure your Arz background/theme colors are set in your global CSS or as CSS variables */}
      {/* @ts-expect-error - jsx prop not recognized in React 18 */}
      <style jsx global>{`
        :root {
          /* Example of how to define your brand colors for this component to use */
          --arz-primary: #4a00e0; /* Your brand primary color */
          --arz-background: #f4f7f9; /* Light background */
          --arz-text: #1a1a1a; /* Dark text */
        }
      `}</style>

      <div className={styles.contentWrapper}>
        {/* --- Table of Contents (TOC) --- */}
        <div className={styles.tocContainer}>
          <h3 className="text-xl font-bold mb-4">Table of Contents</h3>
          <ul className="space-y-1">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id);
                  }}
                  className={styles.tocLink}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t pt-4 text-xs text-gray-500">
            <P>Version: November 2025</P>
          </div>
        </div>

        {/* --- Terms of Service Body --- */}
        <div className={styles.termsBody}>
          <h1 className={styles.mainHeading}>Arz Terms of Service</h1>
          <P>
            <span className={styles.strong}>Welcome to Arz!</span> These Terms govern your access to
            and use of our Platform. Please read them carefully.
          </P>

          {/* 1. Acceptance of Terms */}
          <h2 id="acceptance-of-terms" className={styles.sectionHeading}>
            1. Acceptance of Terms
          </h2>
          <P>
            These Terms of Service (the <span className={styles.strong}>“Terms”</span>) are intended
            to make you aware of your legal rights and responsibilities with respect to your access
            to and use of the Arz website and any other related mobile or software applications
            under the brand name 'Arz' (collectively{' '}
            <span className={styles.strong}>“Platform”</span>).
          </P>
          <P>
            Please read these Terms carefully. By accessing or using the Platform, you are agreeing
            to these Terms and concluding a legally binding contract with Arz Private Limited (
            <span className={styles.strong}>“Arz”/“We”/“Us”/“Our”</span>). You may not use the
            Platform and/or its Services if you do not accept the Terms or are unable to be bound by
            the Terms.
          </P>
          <P>
            By visiting our Platform and/or purchasing something from us, or by using features
            (ticketing, messaging, groups, friend connections), and services for listing/hosting
            activities, events, and trips (collectively, the{' '}
            <span className={styles.strong}>“Services”</span>), you engage in our Services and agree
            to be bound by these Terms, including any additional terms and conditions and policies
            referenced herein and/or available by hyperlink on the Platform. These Terms apply to
            all users of the Platform, including users who are browsers, vendors, customers,
            merchants, and/ or contributors of content displayed on the Platform displayed on the
            Platform.
          </P>
          <P>
            Your use/ access of the Platform shall be governed by these Terms and the Privacy Policy
            as available on the Platform (<span className={styles.strong}>“Privacy Policy”</span>).
          </P>
          <P>
            These Terms may be updated from time to time without notice. It is therefore recommended
            that you review these Terms, as available on the Platform, each time you access and/or
            use the Platform. In the event there is any conflict or inconsistency between these
            Terms and any other terms and conditions that appear on the Platform, these Terms will
            prevail.
          </P>

          {/* 2. Eligibility */}
          <h2 id="eligibility" className={styles.sectionHeading}>
            2. Eligibility
          </h2>
          <P>
            Persons who are <span className={styles.strong}>“incompetent to contract”</span> within
            the meaning of the Indian Contract Act, 1872 are not eligible to use/access the
            Platform. However, if you are a minor, i.e. under the age of 18 years, you may
            use/access the Platform under the supervision of an adult parent or legal guardian who
            is “competent to contract” and agrees to be bound by these Terms.
          </P>
          <P>
            If you are using the Platform on behalf of any person/ entity, you represent and warrant
            that you are authorized to accept these Terms on behalf of such person/ entity. Further,
            you and such person/ entity agree to be jointly, severally liable and indemnify us for
            violations of these Terms.
          </P>
          <P>
            You agree to use the Services only in compliance with these Terms and applicable laws,
            and in a manner that does not violate our legal rights or those of any third party(ies).
          </P>

          {/* 3. User Accounts */}
          <h2 id="user-accounts" className={styles.sectionHeading}>
            3. User Accounts
          </h2>
          <h3 className={styles.subHeading}>Account Creation</h3>
          <P>
            Users must create an account using their email, phone number, or any other login method
            supported by the Platform. You agree to provide true, current, and complete information,
            and to keep your details updated.
          </P>

          <h3 className={styles.subHeading}>Account Security</h3>
          <P>
            You are responsible for maintaining the confidentiality of your login credentials. Any
            activity occurring under your account will be treated as your action. Notify us
            immediately if you suspect unauthorised access or misuse of your account.
          </P>

          <h3 className={styles.subHeading}>Verification</h3>
          <P>
            We may require identity verification (e.g., government ID, selfie, business proof) for
            certain features such as hosting, payouts, or high-risk events. Verification increases
            trust but does not guarantee safety, and we do not make any representations about the
            accuracy or authenticity of a User’s identity.
          </P>

          <h3 className={styles.subHeading}>Account Suspension or Termination</h3>
          <P>
            We may suspend or terminate your account at our discretion if we believe you have
            violated these Terms, engaged in fraudulent behaviour, or posed a risk to other Users or
            the Platform.
          </P>

          {/* 4. Definitions */}
          <h2 id="definitions" className={styles.sectionHeading}>
            4. Definitions
          </h2>
          <ul className={styles.list}>
            <li>
              <span className={styles.strong}>“Platform”</span>: Refers to the Arz mobile
              application, website, and any related digital interfaces, tools, and services provided
              by us.
            </li>
            <li>
              <span className={styles.strong}>“User” / “You”</span>: Any individual using the
              Platform, including Attendees, Hosts, and people using messaging, discovery, or social
              features.
            </li>
            <li>
              <span className={styles.strong}>“Attendee”</span>: A User who purchases or reserves a
              ticket for any activity, event, or trip listed on the Platform.
            </li>
            <li>
              <span className={styles.strong}>“Host”</span>: Any individual, creator, influencer,
              travel organizer, agency, company, or entity that lists, organises, or facilitates an
              activity, event, or trip on the Platform.
            </li>
            <li>
              <span className={styles.strong}>“Listing”</span>: Any activity, event, or trip
              published on the Platform by a Host, including all details such as date, location,
              description, inclusions, pricing, capacity, and eligibility requirements.
            </li>
            <li>
              <span className={styles.strong}>“Ticket”</span>: A digital confirmation, booking, or
              reservation issued to an Attendee upon payment (or free registration) for a Listing.
            </li>
            <li>
              <span className={styles.strong}>“Service Fee” / “Commission”</span>: Fees charged by
              Arz to Attendees and/or Hosts for use of the Platform, including ticketing fees,
              convenience fees, transaction charges, and other applicable charges.
            </li>
            <li>
              <span className={styles.strong}>“UGC” / “User-Generated Content”</span>: Content
              submitted, posted, shared, or transmitted by Users, including profile information,
              photos, posts, reviews, messages, chats, and other media.
            </li>
            <li>
              <span className={styles.strong}>“Payment Processor”</span>: Third-party payment
              service providers integrated with the Platform to handle transactions (e.g., Razorpay,
              Stripe, Paytm).
            </li>
            <li>
              <span className={styles.strong}>“Force Majeure Event”</span>: Events beyond reasonable
              control such as natural disasters, strikes, war, pandemic, or government restrictions,
              which may affect Listings or Services.
            </li>
          </ul>

          {/* 5. User Conduct & Prohibited Activities */}
          <h2 id="user-conduct" className={styles.sectionHeading}>
            5. User Conduct & Prohibited Activities
          </h2>
          <P>
            To maintain the safety, integrity, and trust of the Platform, Users must adhere to the
            following rules. Violation of any of these may result in permanent account suspension,
            cancellation of bookings, removal of Listings, and/or legal action.
          </P>

          <h3 className={styles.subHeading}>Prohibited Activities (Strictly Not Allowed)</h3>
          <P>
            <span className={styles.strong}>A. Misconduct, Harassment & Abuse:</span> Users may not
            engage in harassment, stalking, bullying, threats, or intimidation; make discriminatory,
            hateful, sexual, or abusive remarks; or create an unsafe or hostile environment.
          </P>
          <P>
            <span className={styles.strong}>B. Fraud, Misrepresentation & Illegal Activities:</span>{' '}
            Users may not impersonate another person or create fake accounts; submit false
            information; engage in scams, phishing, or solicit money from other Users; or promote
            unlawful activities.
          </P>
          <P>
            <span className={styles.strong}>C. Messaging & Chat Misuse:</span> Users may not send
            unwanted or repeated messages (spamming); solicit dating or sexual content; share
            obscene or inappropriate content; or advertise unrelated products/services.
          </P>
          <P>
            <span className={styles.strong}>D. Safety Violations in Events/Trips:</span> Users may
            not attend while intoxicated or create unsafe conditions; bring weapons or prohibited
            items; violate venue rules or Host instructions; or disrupt events.
          </P>
          <P>
            <span className={styles.strong}>E. Platform Misuse & Technical Abuse:</span> Users may
            not attempt to hack, reverse-engineer, scrape, or disrupt the Platform; use bots or
            automation tools; or manipulate reviews, ratings, or attendance numbers.
          </P>

          <h3 className={styles.subHeading}>Zero-Tolerance Violations (Immediate Permanent Ban)</h3>
          <P>The following result in instant, permanent account termination without warning:</P>
          <ul className={styles.list}>
            <li>Harassment, sexual misconduct, or threats.</li>
            <li>Fraud, scams, or payment-related abuse.</li>
            <li>Impersonation or identity manipulation.</li>
            <li>Any behaviour that endangers another User’s safety.</li>
            <li>Organising or participating in illegal activities through the Platform.</li>
          </ul>

          {/* 6. Community & Messaging Rules */}
          <h2 id="community-messaging-rules" className={styles.sectionHeading}>
            6. Community & Messaging Rules
          </h2>
          <P>
            To ensure a safe and meaningful social environment, the following rules apply to all
            messaging and community features on the Platform.
          </P>
          <P>
            <span className={styles.strong}>Access to Messaging:</span> Direct Messages (DMs) are
            available only after two Users become friends. Group chat access is optional and
            requires the User to manually join.
          </P>
          <P>
            <span className={styles.strong}>Prohibited Messaging Behaviours:</span> This includes,
            but is not limited to, Harassment, abuse, bullying, sexual messages, hate speech,
            spamming, and attempting to move Users to off-platform payments or external chats for
            scams.
          </P>
          <P>
            <span className={styles.strong}>
              No Expectation of Complete Privacy in Reported Chats:
            </span>{' '}
            While normal chats are private, Users acknowledge that reported messages may be reviewed
            by Arz for safety, and serious violations may be escalated to law enforcement.
          </P>

          {/* 7. Verification */}
          <h2 id="verification" className={styles.sectionHeading}>
            7. Verification
          </h2>
          <P>
            Verification on the Platform is designed to increase trust, reduce fraud, and improve
            safety.{' '}
            <span className={styles.strong}>
              Verification does NOT guarantee safety, reliability, behaviour, credentials, or
              suitability of any User or Host.
            </span>
          </P>

          <h3 className={styles.subHeading}>Types of Verification</h3>
          <ul className={styles.list}>
            <li>
              <span className={styles.strong}>Basic Verification (for all Users):</span> Phone
              verification (OTP) and email verification.
            </li>
            <li>
              <span className={styles.strong}>Full Verification (for Trips & Activities):</span>{' '}
              Submission of a valid Government ID and a selfie for face-matching to receive a
              Verified User Badge.
            </li>
            <li>
              <span className={styles.strong}>Host Verification:</span> Submission of business
              registration documents OR personal government ID, address proof, and other information
              to receive a Verified Host Badge.
            </li>
          </ul>

          <h3 className={styles.subHeading}>Meaning of Verification Badges</h3>
          <P>
            A verification badge only means identity/documents have been checked and requirements
            met. <span className={styles.strong}>It does NOT mean:</span> Arz has conducted criminal
            checks, Arz guarantees the User’s or Host’s behaviour, or that the experience is
            risk-free. Users must still exercise personal judgment.
          </P>

          {/* 8. Content & Intellectual Property Rights */}
          <h2 id="content-ip-rights" className={styles.sectionHeading}>
            8. Content & Intellectual Property Rights
          </h2>

          <h3 className={styles.subHeading}>Ownership of Arz Content and Proprietary Rights</h3>
          <P>
            Arz (and its licensors) is and shall remain the sole and exclusive owner of all right,
            title and interest in and to the <span className={styles.strong}>Arz Content</span>{' '}
            (design, code, logos, algorithms, etc.) and all associated Intellectual Property (
            <span className={styles.strong}>Arz IP</span>). You are granted only limited rights to
            use the Platform; you may not copy, reverse engineer, or exploit the Arz IP.
          </P>

          <h3 className={styles.subHeading}>Ownership of User & Host Content</h3>
          <P>
            Subject to the licences granted to Arz, Users and Hosts retain all right, title, and
            interest (including all intellectual property rights) in and to their respective{' '}
            <span className={styles.strong}>User Content</span> and{' '}
            <span className={styles.strong}>Host Content</span> (reviews, listing descriptions,
            photos, etc.). You warrant that you have all necessary rights to submit this content.
          </P>

          <h3 className={styles.subHeading}>Licence Granted to Arz Over User & Host Content</h3>
          <P>
            By submitting Content, you grant Arz a{' '}
            <span className={styles.strong}>
              perpetual, irrevocable, worldwide, non-exclusive, royalty-free, fully paid,
              transferable, and sub-licensable licence
            </span>{' '}
            to use this content for: (a) operating and improving the Services; (b) displaying
            content on the Platform; (c) enforcing Terms; and (d) creating promotional and marketing
            materials (for publicly visible content).
          </P>

          <h3 className={styles.subHeading}>Right to Remove Content</h3>
          <P>
            Arz may, at any time and without prior notice, remove, block, or edit any User Content
            or Host Content that, in Arz’s sole discretion, violates these Terms, is unlawful, or
            poses a risk to Users, Hosts, or the Platform. Arz shall have no liability for the
            removal or modification of content.
          </P>

          {/* 9. Role of Arz */}
          <h2 id="role-of-arz" className={styles.sectionHeading}>
            9. Role of Arz
          </h2>
          <P>
            Arz primarily operates as a{' '}
            <span className={styles.strong}>
              neutral, technology-based intermediary/marketplace
            </span>
            . Arz is generally not the organizer, operator, manager, or provider of the events,
            activities, or trips listed by independent Hosts on the Platform.
          </P>

          <h3 className={styles.subHeading}>Independence of Hosts</h3>
          <P>
            Hosts are independent third-party service providers, not employees or agents of Arz.{' '}
            <span className={styles.strong}>Hosts alone are responsible for:</span> (a) the
            conception, accuracy, and fulfillment of their Listings; (b) ensuring safety, logistics,
            and legality; and (c) all interactions with Users.
          </P>

          <h3 className={styles.subHeading}>
            Arz-Organised Events and Activities ("Arz-Originals")
          </h3>
          <P>
            Arz may, from time to time, organize certain events ("Arz-Originals"). For these
            specific events, Arz is deemed the organizer and is responsible for the delivery of that
            specific experience. However, all other Terms still apply.
          </P>

          <h3 className={styles.subHeading}>Risk Assumption by Users</h3>
          <P>
            Users acknowledge and agree that attendance at any event, activity, or trip, whether
            Host-provided or Arz-Originals,{' '}
            <span className={styles.strong}>
              carries inherent risks, and Users voluntarily assume all such risks.
            </span>
          </P>

          {/* 10. Hosting & Listings (Host Obligations) */}
          <h2 id="hosting-listings" className={styles.sectionHeading}>
            10. Hosting & Listings (Host Obligations)
          </h2>
          <P>
            These terms apply to all Hosts listing activities, events, or trips on the Platform.
          </P>
          <P>
            <span className={styles.strong}>Host Responsibilities:</span> Provide accurate,
            complete, and updated information; comply with all applicable laws and permits; ensure
            the safety and quality of the Listing; and maintain professional behaviour.
          </P>
          <P>
            <span className={styles.strong}>Prohibited Host Behaviour:</span> Includes, but is not
            limited to, cancelling events without valid reason, misleading or scamming Users,
            endangering attendees, or moving Attendees to unauthorised platforms for payments (e.g.,
            forcing UPI/WhatsApp payments outside Arz).
          </P>
          <P>
            <span className={styles.strong}>Payment & Payouts:</span> Hosts receive payouts after
            the event/trip occurs. Arz may withhold payouts in case of disputes, safety concerns,
            alleged fraud, or violation of Terms. Hosts are responsible for all tax compliance.
          </P>

          {/* 11. Ticketing Terms (Buyers) */}
          <h2 id="ticketing-terms" className={styles.sectionHeading}>
            11. Ticketing Terms (Buyers)
          </h2>
          <P>
            <span className={styles.strong}>Contract Formation:</span> When purchasing a ticket, the
            User enters a binding contract for participation with{' '}
            <span className={styles.strong}>the Host</span> (for Host-provided experiences) or{' '}
            <span className={styles.strong}>Arz</span> (for Arz-Originals). Arz acts as the limited
            payment collection agent for the Host.
          </P>
          <P>
            <span className={styles.strong}>Convenience Fee and Taxes:</span> Each ticket purchase
            is subject to a convenience fee (5% to 20% of the ticket price) plus applicable GST. All
            fees paid to Arz are non-refundable.
          </P>
          <P>
            <span className={styles.strong}>Entry Conditions; Organizer Rules:</span> Entry is
            governed exclusively by the rules, policies, and requirements established by the Host or
            venue authorities. Arz is not liable for any refusal of entry or removal from the venue
            by the Host.
          </P>

          {/* 12. Refunds, Cancellations & Rescheduling */}
          <h2 id="refunds-cancellations" className={styles.sectionHeading}>
            12. Refunds, Cancellations & Rescheduling
          </h2>
          <P>
            <span className={styles.strong}>Finality of Purchase; No Refunds:</span> All ticket
            purchases are <span className={styles.strong}>final and non-refundable</span>, except
            where the event, activity, or trip is cancelled in its entirety by the Host or Arz. In
            such case, the User is entitled solely to a full refund of the ticket price.
          </P>
          <P>
            <span className={styles.strong}>Postponements and Modifications:</span> In the event of
            postponement, change in venue, or itinerary alteration, the original ticket remains
            valid and <span className={styles.strong}>no refund shall be issued</span> unless the
            event or trip is permanently cancelled.
          </P>
          <P>
            <span className={styles.strong}>Exclusive Liability Limit:</span> Arz’s total liability
            for any cancellation or modification is{' '}
            <span className={styles.strong}>
              strictly limited to the refund of the ticket amount actually paid
            </span>
            , excluding all ancillary losses (travel, accommodation, etc.).
          </P>

          {/* 13. Ticket Transfers, Resale & Anti-Scalping */}
          <h2 id="ticket-transfers" className={styles.sectionHeading}>
            13. Ticket Transfers, Resale & Anti-Scalping
          </h2>
          <P>
            <span className={styles.strong}>Non-Transferability:</span> Tickets are non-transferable
            and may not be resold, exchanged, or bartered through any external medium. Transfers are
            permitted{' '}
            <span className={styles.strong}>
              only through the authorised in-app transfer feature
            </span>{' '}
            (gifting).
          </P>
          <P>
            <span className={styles.strong}>Prohibition on Resale; Void Tickets:</span> Any ticket
            that is resold or transferred outside the Platform, or obtained through fraud, shall be
            deemed <span className={styles.strong}>void</span>, and Arz or the Host shall not be
            obligated to honour it. Arz may cancel such tickets without refund.
          </P>

          {/* 14. User Responsibility and Consequences */}
          <h2 id="user-responsibility" className={styles.sectionHeading}>
            14. User Responsibility and Consequences
          </h2>
          <P>
            Users attend events, activities, and trips{' '}
            <span className={styles.strong}>at their own discretion</span> and remain responsible
            for their personal behaviour, belongings, and compliance with safety instructions. Arz
            shall not be liable for any injury, loss, damage, or penalty arising from the conduct of
            the User or from any action taken by the Host, venue authorities, or law enforcement.
          </P>

          {/* 15. Assumption of Risk and Liability Waiver */}
          <h2 id="assumption-of-risk" className={styles.sectionHeading}>
            15. Assumption of Risk and Liability Waiver
          </h2>
          <P>
            <span className={styles.strong}>Voluntary Participation and Assumption of Risk:</span>{' '}
            Users acknowledge that participation involves inherent risks (physical injury, theft,
            interacting with strangers, etc.). Users{' '}
            <span className={styles.strong}>voluntarily participate at their own risk</span> and are
            solely responsible for their personal safety.
          </P>
          <P>
            <span className={styles.strong}>Release and Waiver of Claims:</span> To the fullest
            extent permitted by law, Users hereby{' '}
            <span className={styles.strong}>release, waive, and discharge Arz</span>, its
            affiliates, directors, employees, and agents from any and all claims, demands,
            liabilities, damages, or losses arising from or related to their participation, except
            solely to the extent caused by Arz’s wilful misconduct.
          </P>

          {/* 16. General Legal Provisions */}
          <h2 id="general-legal-provisions" className={styles.sectionHeading}>
            16. General Legal Provisions
          </h2>
          <P>
            <span className={styles.strong}>Limitation of Liability:</span> Arz's total aggregate
            liability, whether in contract, tort, or otherwise, shall be{' '}
            <span className={styles.strong}>
              strictly limited to the total amount actually paid by the User for the specific ticket
              giving rise to the claim.
            </span>{' '}
            No indirect, punitive, or consequential damages are recoverable.
          </P>
          <P>
            <span className={styles.strong}>Disclaimer of Warranties:</span> The Platform, Listings,
            and services are provided on an{' '}
            <span className={styles.strong}>“as is” and “as available” basis</span> without
            warranties of any kind. Arz does not guarantee the safety, quality, legality, or
            suitability of any Host, User, event, or trip.
          </P>
          <P>
            <span className={styles.strong}>Indemnification:</span> Users agree to indemnify and
            hold Arz harmless from any claims, losses, or expenses arising out of or related to: (a)
            the User’s breach of these Terms; (b) misconduct or negligence by the User; (c) Content
            submitted by the User; and (d) the User’s participation in any event or trip.
          </P>
          <P>
            <span className={styles.strong}>Suspension and Termination:</span> Arz may, at its sole
            discretion and without prior notice, suspend or terminate a User’s access, cancel
            tickets, or remove Content where a violation of these Terms, safety risk, or fraudulent
            activity has occurred.{' '}
            <span className={styles.strong}>No refund or compensation shall be due</span> in
            connection with such suspension or termination.
          </P>
          <P>
            <span className={styles.strong}>Governing Law and Jurisdiction:</span> These Terms shall
            be governed by the laws of <span className={styles.strong}>India</span>. The courts of{' '}
            <span className={styles.strong}>New Delhi, India</span> shall have exclusive
            jurisdiction over all disputes.
          </P>
          <P>
            <span className={styles.strong}>Notices and Communication:</span> All legal notices to
            Arz shall be sent via email to{' '}
            <span className={styles.strong}>theArzkaro@gmail.com</span>.
          </P>
        </div>
      </div>
    </div>
  );
};

export default Terms;
