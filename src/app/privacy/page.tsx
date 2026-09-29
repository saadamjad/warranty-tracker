import Link from "next/link";

// Plain answers to the trust questions in SPEC §7. Claims must never be stronger than what
// the product actually does (SPEC §7, BUSINESS risks).

const ANSWERS: { question: string; answer: string[] }[] = [
  {
    question: "Where are my purchases kept?",
    answer: [
      "On this device, in your browser's storage. That's where they're saved first, and why the app works without internet.",
      "If you turn on backup, a copy is also kept on our servers so you can get it back on another phone or computer.",
    ],
  },
  {
    question: "Who can see them?",
    answer: [
      "Without backup, only people who can use this device and browser.",
      "With backup, your copy is stored with our hosting providers and is only available to your account. We never sell your data, never show ads, and don't look at your purchases. The people running the service could technically reach the backup, so we only do so if you ask us to fix a problem.",
    ],
  },
  {
    question: "Is my original photo or file kept?",
    answer: [
      "Yes, always. We may make an easier-to-read copy for you, but the original is never changed and you can view it any time.",
    ],
  },
  {
    question: "Who reads my receipts?",
    answer: [
      "Your own device does. Receipt reading runs in your browser; your photos aren't sent anywhere to be read.",
      "If a receipt shows a payment card number, it's removed from the text we keep. We never ask for or store card details or passwords.",
    ],
  },
  {
    question: "What if it reads something wrong?",
    answer: [
      "Every detail can be changed, before and after saving. Anything we weren't sure about is marked \"Please check\". Your own changes are never overwritten.",
    ],
  },
  {
    question: "What does delete mean?",
    answer: [
      "A deleted purchase goes to Recently Deleted, where you can restore it for 30 days. After that it's removed from this device and from backup.",
      "\"Delete forever\" removes it right away. Deleting your account removes your backup and its files; purchases on your device stay unless you remove them too.",
    ],
  },
  {
    question: "What if I lose my phone?",
    answer: [
      "With backup on, sign in on your new device and your purchases and documents come back.",
      "Without backup, they only exist on the lost device, so we can't bring them back. That's why we suggest backup once you've saved a few.",
    ],
  },
  {
    question: "Can I take my data with me?",
    answer: [
      "Yes. Settings → \"Download all my purchases\" gives you a ZIP with your original files and a spreadsheet of the details. It works offline and doesn't need an account.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← All purchases
      </Link>
      <h1 className="text-2xl font-bold">Your data and your privacy</h1>
      {ANSWERS.map(({ question, answer }) => (
        <section key={question} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{question}</h2>
          {answer.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
      <p className="text-sm text-muted">
        We keep records and send reminders. We can&apos;t promise a store or maker will accept a return or warranty
        claim — always check their terms.
      </p>
    </main>
  );
}
