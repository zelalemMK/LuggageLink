import { ShieldCheck, HandshakeIcon, SquareCheck } from "lucide-react";

export function HowItWorks() {
  // Custom HandshakeIcon since Lucide doesn't have one
  function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
        <path d="M12 5.36l.4.4.4-.4" />
        <path d="M14.5 7.5l.4.4.4-.4" />
        <path d="M16.25 9.25l.4.4.4-.4" />
      </svg>
    );
  }

  // Custom SquareCheck icon since Lucide doesn't have one
  function SquareCheck(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
        <path d="M19 4H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2z" />
        <path d="M16 15 12 9l-4 6" />
        <path d="m12 9-3 6h6l-3-6z" />
      </svg>
    );
  }

  const steps = [
    {
      title: "1. Verify Your Identity",
      description:
        "Create an account and complete our verification process to ensure trust and safety for all users.",
      icon: <ShieldCheck className="h-6 w-6" />,
    },
    {
      title: "2. Connect & Agree",
      description:
        "Travelers post their trips, senders post their packages. Match, chat, and agree on details and compensation.",
      icon: <HandshakeIcon className="h-6 w-6" />,
    },
    {
      title: "3. Send & Receive",
      description:
        "Drop off your package with the traveler, track delivery status, and confirm receipt. Payment is held safely until delivery.",
      icon: <SquareCheck className="h-6 w-6" />,
    },
  ];

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            How It Works
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Secure, Reliable
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Connect travelers to Ethiopia with people looking to send packages
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {steps.map((step) => (
              <div key={step.title} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    {step.icon}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                    {step.title}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {step.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
