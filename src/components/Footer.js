import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-sapphire-950/80 backdrop-blur-md">
      <div className="section-container py-10 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-bold tracking-tight text-white">Vynco</span>
            </Link>
            <p className="text-sapphire-400 text-sm leading-relaxed max-w-xs">
              The future of professional networking. Share your digital business card instantly with a single scan.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 sm:mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">About</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-white font-semibold text-sm mb-3 sm:mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 sm:pt-8 flex items-center justify-center">
          <p className="text-sapphire-500 text-xs sm:text-sm">&copy; {new Date().getFullYear()} Vynco. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
