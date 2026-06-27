import React from "react";
import { Mail, Phone, MapPin, Globe, Send, ShieldCheck, Clock } from "lucide-react";

export const metadata = {
  title: "Contact Us - Y's Men International Kerala (SWIR)",
  description: "Get in touch with Y's Men International Kerala (South West India Region). Reach our regional headquarters in Plammoodu, Thiruvananthapuram.",
};

export default function ContactPage() {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Y's Men International Kerala",
    "image": "https://ysmenswir-v.com/ysmen-footer-logo.png",
    "url": "https://ysmenswir-v.com",
    "telephone": "+914712720000",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Manchadivila Rd, Plammoodu",
      "addressLocality": "Thiruvananthapuram",
      "addressRegion": "Kerala",
      "postalCode": "695003",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 8.514032,
      "longitude": 76.944754
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "17:00"
    },
    "sameAs": [
      "https://ysmen.org"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <div className="bg-slate-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-extrabold text-blue-950 sm:text-5xl tracking-tight mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Have questions about membership, directories, or community projects? Contact the South West India Region (SWIR) headquarters.
            </p>
            <div className="w-24 h-1 bg-red-600 mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* Address Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-start space-x-4 hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-950 mb-2">Our Headquarters</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Y's Men International Kerala<br />
                    Manchadivila Rd, Plammoodu,<br />
                    Thiruvananthapuram,<br />
                    Kerala 695003
                  </p>
                </div>
              </div>

              {/* Email & Phone Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-start space-x-4 hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-950 mb-2">Email & Phone</h3>
                  <p className="text-gray-600 mb-1">
                    <a href="mailto:info@ymiswir.org" className="hover:text-blue-600 transition-colors">
                      info@ymiswir.org
                    </a>
                  </p>
                  <p className="text-gray-600">
                    <a href="tel:+914712720000" className="hover:text-blue-600 transition-colors">
                      +91 471 272 0000
                    </a>
                  </p>
                </div>
              </div>

              {/* Working Hours Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-start space-x-4 hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-950 mb-2">Office Hours</h3>
                  <p className="text-gray-600">
                    Monday – Saturday<br />
                    9:00 AM – 5:00 PM<br />
                    <span className="text-xs text-gray-400 italic">Closed on Sundays & Public Holidays</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Contact Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-blue-950 mb-6">Send Us a Message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      id="first-name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      id="last-name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    placeholder="Membership Inquiry / Club Question"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    placeholder="Write your message here..."
                    required
                  ></textarea>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Your privacy is protected. We will never share your personal information.</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-white bg-blue-950 hover:bg-black font-bold transition-all shadow-md active:scale-95 text-center uppercase tracking-wide gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
