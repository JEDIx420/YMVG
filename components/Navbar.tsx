import { createClient } from '@/utils/supabase/server'
import AuthButton from './AuthButton'
import Link from 'next/link'

export default async function Navbar() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  return (
    <nav className="w-full border-b border-gray-200 bg-white shadow-sm z-50 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo & Dropdowns */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold tracking-tight text-blue-900 border-r border-gray-100 pr-6 mr-2">
              YMI
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/directory" 
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4"
              >
                Directory
              </Link>

              {/* About Dropdown */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4">
                  About YMI
                  <svg className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/about/philosophy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Philosophy & Values
                    </Link>
                    <Link href="/about/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Our History (1922)
                    </Link>
                  </div>
                </div>
              </div>

              {/* SWIR Dropdown */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors py-4">
                  SWIR
                  <svg className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link href="/region/leadership" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Regional Leadership
                    </Link>
                    <Link href="/region/clubs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      Club Directory
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Auth & Dashboard */}
          <div className="flex items-center space-x-4">
            {data?.user && (
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 bg-blue-50 rounded-md"
              >
                Dashboard
              </Link>
            )}
            <AuthButton user={data?.user || null} />
          </div>
        </div>
      </div>
    </nav>
  )
}
