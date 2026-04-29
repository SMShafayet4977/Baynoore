import { Truck, CreditCard, MapPin, ShieldCheck, MessageCircle, RefreshCw } from "lucide-react";

const badges = [
  { icon: Truck, label: "Cash on Delivery", sub: "Across Bangladesh" },
  { icon: CreditCard, label: "Manual bKash", sub: "Secure verification" },
  { icon: MapPin, label: "Chattogram Based", sub: "Local & trusted" },
  { icon: ShieldCheck, label: "Quality Checked", sub: "Every product" },
  { icon: MessageCircle, label: "WhatsApp Support", sub: "+8801794529766" },
  { icon: RefreshCw, label: "Exchange Available", sub: "7-day policy" },
];

export default function TrustBadges() {
  return (
    <section className="bg-cream py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center text-center p-4 bg-ivory rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center mb-3">
                <Icon size={20} className="text-gold-muted" />
              </div>
              <p className="text-xs font-semibold text-brown leading-tight">{label}</p>
              <p className="text-xs text-brown-light mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
