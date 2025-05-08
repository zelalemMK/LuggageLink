import { Shield, ShieldCheck, MessageSquare, Star, MapPin, Headphones } from "lucide-react";

export function SafetyInfo() {
  const safetyFeatures = [
    {
      icon: <ShieldCheck className="text-white text-xl" />,
      title: "Verified Identities",
      description: "Every user undergoes ID verification to ensure authenticity. Multiple verification badges build trust among users.",
    },
    {
      icon: <Shield className="text-white text-xl" />,
      title: "Secure Payments",
      description: "Our escrow system holds payments until delivery is confirmed, protecting both senders and travelers.",
    },
    {
      icon: <MessageSquare className="text-white text-xl" />,
      title: "Private Messaging",
      description: "Communicate safely with other users through our secure in-app messaging system without sharing personal details.",
    },
    {
      icon: <Star className="text-white text-xl" />,
      title: "Review System",
      description: "Our comprehensive review system helps build a trusted community where reliable users are rewarded.",
    },
    {
      icon: <MapPin className="text-white text-xl" />,
      title: "Delivery Tracking",
      description: "Monitor your package's journey with status updates, giving peace of mind throughout the delivery process.",
    },
    {
      icon: <Headphones className="text-white text-xl" />,
      title: "24/7 Support",
      description: "Our support team is available around the clock to assist with any issues or questions you might have.",
    },
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Safety First</h2>
          <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl sm:tracking-tight">
            Your Security is Our Priority
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            We've built LuggageLink with trust and safety at its core.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {safetyFeatures.map((feature) => (
              <div key={feature.title} className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                        {feature.icon}
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.title}</h3>
                    <p className="mt-5 text-base text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
