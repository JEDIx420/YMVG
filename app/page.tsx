import LandingClientLayout from "@/components/LandingClientLayout";
import EsteemedPatronsGrid from "@/components/EsteemedPatronsGrid";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Y's Men SWIR Directory - Regional Business Hub",
  description: "Explore verified business listings and connect with Y's Men International members in the South West India Region.",
};

export default function LandingPage() {
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
      <LandingClientLayout>
        {/* Dynamic, fully server-rendered monetization grid with exclusive styling */}
        <EsteemedPatronsGrid />
      </LandingClientLayout>
    </>
  );
}
