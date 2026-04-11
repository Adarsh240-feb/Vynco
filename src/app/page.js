"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { QrCode, MapPin, Users, Zap, Shield, ArrowRight, Sparkles, Globe } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: QrCode,
    title: 'QR Business Cards',
    description: 'Generate a personalized QR code that links to your digital profile. Share it anywhere — in person, emails, or print.',
  },
  {
    icon: Users,
    title: 'Smart Connections',
    description: 'Discover professionals, manage your network, and grow meaningful relationships with intelligent suggestions.',
  },
  {
    icon: MapPin,
    title: 'Location Discovery',
    description: 'Find professionals near you at events, meetups, or co-working spaces with real-time location networking.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data is protected with end-to-end encryption and granular privacy controls for every piece of information.',
  },
  {
    icon: Globe,
    title: 'Real-time Messaging',
    description: 'Connect instantly with your network through built-in chat. Share files, images, and ideas in real time.',
  },
  {
    icon: Sparkles,
    title: 'Feed & Updates',
    description: 'Share professional updates, achievements, and opportunities with your network through a curated feed.',
  },
];

const steps = [
  { num: '01', title: 'Create Your Profile', description: 'Sign up in seconds and fill in your professional details to build your digital identity.' },
  { num: '02', title: 'Generate Your Card', description: 'Your unique QR-based digital business card is generated automatically. Customize it to match your brand.' },
  { num: '03', title: 'Connect & Grow', description: 'Scan, share, and connect. Build your professional network effortlessly at any event or meeting.' },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">

      {/* ════════ HERO ════════ */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-cyan-neon/[0.07] rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-cyan-dark/[0.1] rounded-full blur-[100px] animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sapphire-700/20 rounded-full blur-[150px]" />
        </div>

        <div className="section-container relative z-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-neon/20 bg-cyan-neon/[0.06] text-cyan-neon text-sm font-medium mb-8"
              >
                <Sparkles className="w-4 h-4" />
                Now in Public Beta
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
              >
                Your Network,{' '}
                <span className="text-gradient">Reinvented.</span>
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
                className="text-lg sm:text-xl text-sapphire-400 leading-relaxed max-w-lg mb-10"
              >
                Ditch the paper. Vynco transforms how professionals connect with
                instant QR digital business cards, smart networking, and real-time
                collaboration.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href="/auth"
                  className="group px-8 py-3.5 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all flex items-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/#features"
                  className="px-8 py-3.5 text-base font-semibold rounded-2xl border border-sapphire-600 text-sapphire-400 hover:text-white hover:border-sapphire-500 transition-all"
                >
                  Learn More
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={4}
                className="flex gap-10 mt-14 pt-8 border-t border-white/[0.06]"
              >
                {[
                  { value: '10K+', label: 'Professionals' },
                  { value: '50K+', label: 'Connections Made' },
                  { value: '99.9%', label: 'Uptime' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-sapphire-500">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right visual — Digital Card Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-neon/20 to-transparent blur-2xl scale-110" />

                {/* Card */}
                <div className="relative w-[340px] glass-panel rounded-[2rem] p-8 text-center glow-border">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-neon/15 rounded-full blur-2xl" />
                  <div className="w-20 h-20 bg-gradient-to-br from-sapphire-700 to-sapphire-800 rounded-full mx-auto mb-5 flex items-center justify-center border-2 border-cyan-neon/30 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                    <Zap className="w-8 h-8 text-cyan-neon" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Sarah Chen</h3>
                  <p className="text-cyan-dark text-sm mb-6">@sarahchen</p>

                  <div className="bg-white rounded-2xl p-4 inline-block mb-6 shadow-[0_0_30px_rgba(0,229,255,0.1)]">
                    <div className="w-[120px] h-[120px] bg-[repeating-conic-gradient(#0a0f1c_0%_25%,#fff_0%_50%)] bg-[length:12px_12px] rounded-lg" />
                  </div>

                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3 bg-sapphire-800/50 p-3 rounded-xl text-sm">
                      <Globe className="text-cyan-neon w-4 h-4 flex-shrink-0" />
                      <span className="text-sapphire-400">Product Designer at Stripe</span>
                    </div>
                    <div className="flex items-center gap-3 bg-sapphire-800/50 p-3 rounded-xl text-sm">
                      <MapPin className="text-cyan-neon w-4 h-4 flex-shrink-0" />
                      <span className="text-sapphire-400">San Francisco, CA</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ════════ FEATURES ════════ */}
      <section id="features" className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sapphire-900/50 to-transparent pointer-events-none" />
        <div className="section-container relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-cyan-neon text-sm font-semibold uppercase tracking-widest">Features</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              Everything you need to{' '}
              <span className="text-gradient">network smarter</span>
            </h2>
            <p className="text-sapphire-400 text-lg max-w-2xl mx-auto">
              Vynco combines the best of digital identity, real-time communication, and professional discovery into one seamless platform.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  custom={i}
                  className="group glass-panel rounded-2xl p-7 hover:border-cyan-neon/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.05)] transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-neon/[0.08] flex items-center justify-center mb-5 group-hover:bg-cyan-neon/[0.15] transition-colors">
                    <Icon className="w-6 h-6 text-cyan-neon" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sapphire-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ════════ HOW IT WORKS ════════ */}
      <section id="how-it-works" className="py-24 lg:py-32">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-cyan-neon text-sm font-semibold uppercase tracking-widest">How it works</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-3 mb-4">
              Three steps to your{' '}
              <span className="text-gradient">digital identity</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-sapphire-700 to-transparent z-0" />
                )}
                <div className="relative z-10 glass-panel rounded-2xl p-8 text-center">
                  <div className="text-5xl font-black text-cyan-neon/15 mb-4">{step.num}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sapphire-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ════════ CTA ════════ */}
      <section className="py-24 lg:py-32">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl glass-panel glow-border p-12 sm:p-16 text-center"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-neon/[0.08] rounded-full blur-[100px]" />
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5">
                Ready to transform your networking?
              </h2>
              <p className="text-sapphire-400 text-lg max-w-xl mx-auto mb-10">
                Join thousands of professionals who have already ditched paper business cards and embraced the future of networking.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-10 py-4 text-base font-semibold rounded-2xl bg-gradient-to-r from-cyan-dark to-cyan-neon text-sapphire-900 shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
