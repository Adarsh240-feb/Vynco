import Link from 'next/link';
import { Zap, Globe, MessageCircle, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-sapphire-950/80 backdrop-blur-md">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
              <span className="text-xl font-bold tracking-tight text-white">Vynco</span>
            </Link>
            <p className="text-sapphire-400 text-sm leading-relaxed">
              The future of professional networking. Share your digital business card instantly with a single scan.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">How it Works</Link></li>
              <li><Link href="/auth" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">About</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sapphire-400 text-sm hover:text-cyan-neon transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sapphire-500 text-sm">&copy; {new Date().getFullYear()} Vynco. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sapphire-500 hover:text-cyan-neon transition-colors"><MessageCircle className="w-5 h-5" /></a>
            <a href="#" className="text-sapphire-500 hover:text-cyan-neon transition-colors"><ExternalLink className="w-5 h-5" /></a>
            <a href="#" className="text-sapphire-500 hover:text-cyan-neon transition-colors"><Globe className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
