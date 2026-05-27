import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-12 h-12">
                <Image 
                  src="/ysmen-footer-logo.png"
                  alt="Y's Men's International Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter">
                Y's Men's International <span className="text-red-500">SWIR</span>
              </h2>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-gray-400">
              The South West India Region (SWIR) of Y's Men's International is dedicated to service, fellowship, and building sustainable communities through our global network of clubs.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-900/30 text-blue-400 rounded-full border border-blue-800/50">
                Est. 1922 • Serving Globally
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">
              Quick Links
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about/philosophy" className="text-sm hover:text-blue-400 transition-colors">
                  Philosophy & Values
                </Link>
              </li>
              <li>
                <Link href="/about/history" className="text-sm hover:text-blue-400 transition-colors">
                  Heritage & History
                </Link>
              </li>
              <li>
                <Link href="/region/leadership" className="text-sm hover:text-blue-400 transition-colors">
                  Regional Leadership
                </Link>
              </li>
              <li>
                <Link href="/region/calendar" className="text-sm hover:text-blue-400 transition-colors">
                  Regional Calendar
                </Link>
              </li>
              <li>
                <a 
                  href="https://ysmen.org" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm hover:text-blue-400 transition-colors flex items-center"
                >
                  Global Y's Men's International Site
                  <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">
              Contact SWIR
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start">
                <svg className="mr-3 h-5 w-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  Regional Headquarters, SWIR,<br />
                  Kerala, India
                </span>
              </li>
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@ymiswir.org" className="hover:text-blue-400 transition-colors">
                  info@ymiswir.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {currentYear} Y's Men International - South West India Region. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span className="hover:text-gray-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
