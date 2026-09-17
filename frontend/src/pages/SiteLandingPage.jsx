import LandingCta from '../components/landing/LandingCta.jsx';
import LandingFaq from '../components/landing/LandingFaq.jsx';
import LandingHero from '../components/landing/LandingHero.jsx';
import LandingShowcase from '../components/landing/LandingShowcase.jsx';
import LandingSolution from '../components/landing/LandingSolution.jsx';
import LandingSeo from '../components/seo/LandingSeo.jsx';
import MarketingLayout from '../layouts/MarketingLayout.jsx';

export default function SiteLandingPage() {
  return (
    <MarketingLayout>
      <LandingSeo />
      <div className="landing-editorial landing-noise relative overflow-x-hidden">
        <LandingHero />
        <LandingSolution />
        <LandingShowcase />
        <LandingFaq />
        <LandingCta />
      </div>
    </MarketingLayout>
  );
}
