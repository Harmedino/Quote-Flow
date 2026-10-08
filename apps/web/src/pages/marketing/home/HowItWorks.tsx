const STEPS = [
  {
    title: 'Set up your business',
    body: 'Add your details, currency, tax rate and the services you offer. It takes a few minutes.',
  },
  {
    title: 'Build and send a quote',
    body: 'Choose a customer, add services and share the link on WhatsApp or download the PDF.',
  },
  {
    title: 'Your customer accepts',
    body: 'They review it on their phone and approve it. You see the answer straight away.',
  },
  {
    title: 'Invoice and get paid',
    body: 'Convert the quote to an invoice, send it, and record payments until it is settled.',
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="rounded-xl border border-zinc-200 bg-white p-5">
          <span className="text-sm font-semibold text-brand-700 tabular-nums">
            Step {index + 1}
          </span>
          <h3 className="mt-2 text-base font-semibold text-zinc-950">{step.title}</h3>
          <p className="mt-2 text-sm leading-6 text-pretty text-zinc-600">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
