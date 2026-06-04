import LandingClientLayout from "@/components/LandingClientLayout";
import EsteemedPatronsGrid from "@/components/EsteemedPatronsGrid";

export const metadata = {
  title: "Y's Men SWIR Directory - Regional Business Hub",
  description: "Explore verified business listings and connect with Y's Men International members in the South West India Region.",
};

export default function LandingPage() {
  return (
    <LandingClientLayout>
      {/* Dynamic, fully server-rendered monetization grid with exclusive styling */}
      <EsteemedPatronsGrid />
    </LandingClientLayout>
  );
}
