import { motion } from "framer-motion";
import { MapPin, QrCode, Gift } from "lucide-react";

const HowToPlayGuide = () => {
  const steps = [
    {
      number: "01",
      title: "Pick a Mission",
      description: <>Find a Quest near you and go to that location.</>,
      icon: MapPin,
      color: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      number: "02",
      title: "Verify at the Hub",
      description: <>Ask the staff for the Secret Code and take a selfie.</>,
      icon: QrCode,
      color: "from-purple-500 to-pink-500",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      number: "03",
      title: "Win Real Gifts",
      description: (
        <>
          Get{" "}
          <span className="text-yellow-400 font-black">
            free coffee or discounts
          </span>{" "}
          instantly.
        </>
      ),
      icon: Gift,
      color: "from-yellow-500 to-orange-500",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      glow: true,
    },
  ];

  return (
    <div className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-['Orbitron'] font-black text-white uppercase tracking-tight mb-2">
          Mission Briefing
        </h2>
        <p className="text-sm text-gray-400 font-mono">
          Your 3-Step Path to Real-World Adventure
        </p>
      </div>

      {/* Timeline */}
      <div className="relative space-y-8">
        {/* Connecting Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-yellow-500/20" />

        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="relative flex gap-4"
          >
            {/* Icon Circle */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full ${step.iconBg} border-2 border-white/20 flex items-center justify-center relative z-10 ${
                step.glow ? "shadow-[0_0_30px_rgba(234,179,8,0.5)]" : ""
              }`}
            >
              <step.icon className={`w-6 h-6 ${step.iconColor}`} />
            </div>

            {/* Content Card */}
            <div className="flex-1 glassmorphism rounded-2xl p-4 border border-white/10">
              {/* Step Number */}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`text-xs font-black font-mono bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                >
                  STEP {step.number}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-300 leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
          Ready to start your first mission?
        </p>
      </div>
    </div>
  );
};

export default HowToPlayGuide;
