import LandingAudience from '../components/landing/LandingAudience.jsx';
import LandingCta from '../components/landing/LandingCta.jsx';
import LandingFaq from '../components/landing/LandingFaq.jsx';
import LandingFeatures from '../components/landing/LandingFeatures.jsx';
import LandingHero from '../components/landing/LandingHero.jsx';
import LandingHowItWorks from '../components/landing/LandingHowItWorks.jsx';
import LandingJourney from '../components/landing/LandingJourney.jsx';
import LandingPricing from '../components/landing/LandingPricing.jsx';
import LandingProblem from '../components/landing/LandingProblem.jsx';
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
        <LandingAudience />
        <LandingProblem />
        <LandingSolution />
        <LandingShowcase />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingJourney />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </div>
    </MarketingLayout>
  );
}
