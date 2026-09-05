import LandingCta from '../components/landing/LandingCta.jsx';
import LandingDemo from '../components/landing/LandingDemo.jsx';
import LandingFaq from '../components/landing/LandingFaq.jsx';
import LandingFeatures from '../components/landing/LandingFeatures.jsx';
import LandingHero from '../components/landing/LandingHero.jsx';
import LandingHowItWorks from '../components/landing/LandingHowItWorks.jsx';
import LandingProblem from '../components/landing/LandingProblem.jsx';
import LandingSeo from '../components/seo/LandingSeo.jsx';
import MarketingLayout from '../layouts/MarketingLayout.jsx';

export default function SiteLandingPage() {
  return (
    <MarketingLayout>
      <LandingSeo />
      <div className="landing-editorial landing-noise relative overflow-x-hidden">
        <LandingHero />
        <LandingProblem />
        <LandingFeatures />
        <LandingDemo />
        <LandingHowItWorks />
        <LandingFaq />
        <LandingCta />
      </div>
    </MarketingLayout>
  );
}
