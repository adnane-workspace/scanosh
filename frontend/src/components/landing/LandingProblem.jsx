import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const PROBLEMS = [
  { icon: 'print_disabled', titleKey: 'landing.problem1Title', bodyKey: 'landing.problem1Body' },
  { icon: 'schedule', titleKey: 'landing.problem2Title', bodyKey: 'landing.problem2Body' },
  { icon: 'smartphone', titleKey: 'landing.problem3Title', bodyKey: 'landing.problem3Body' },
];

const SOLUTIONS = [
  { icon: 'qr_code_2', titleKey: 'landing.solution1Title', bodyKey: 'landing.solution1Body' },
  { icon: 'sync', titleKey: 'landing.solution2Title', bodyKey: 'landing.solution2Body' },
  { icon: 'dashboard', titleKey: 'landing.solution3Title', bodyKey: 'landing.solution3Body' },
];

export default function LandingProblem() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="probleme" ref={ref} className="relative border-t border-on-surface/10 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div
          className={`mb-16 max-w-3xl transition-all duration-700 lg:mb-20 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-on-surface-variant">
            <span className="h-px w-8 bg-on-surface/30" />
            {t('landing.problemKicker')}
          </span>
          <h2 className="font-display text-4xl tracking-tight lg:text-6xl">{t('landing.problemTitle')}</h2>
          <p className="mt-5 text-lg text-on-surface-variant lg:text-xl">{t('landing.problemBody')}</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-6 font-mono text-xs tracking-widest text-on-surface-variant uppercase">{t('landing.problemLabel')}</p>
            <div className="space-y-4">
              {PROBLEMS.map((item, index) => (
                <div
                  key={item.titleKey}
                  className={`flex gap-4 border border-on-surface/10 p-5 transition-all duration-500 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <MaterialIcon name={item.icon} className="mt-0.5 text-[22px] text-on-surface-variant" />
                  <div>
                    <h3 className="mb-1 text-lg font-medium">{t(item.titleKey)}</h3>
                    <p className="text-on-surface-variant">{t(item.bodyKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-6 font-mono text-xs tracking-widest text-on-surface-variant uppercase">{t('landing.solutionLabel')}</p>
            <div className="space-y-4 border border-on-surface bg-on-surface p-6 text-background sm:p-8">
              <h3 className="font-display text-3xl tracking-tight lg:text-4xl">{t('landing.solutionTitle')}</h3>
              <p className="text-background/70">{t('landing.solutionBody')}</p>
              {SOLUTIONS.map((item) => (
                <div key={item.titleKey} className="flex gap-4 border-t border-background/15 pt-4">
                  <MaterialIcon name={item.icon} className="mt-0.5 text-[22px]" />
                  <div>
                    <h4 className="mb-1 font-medium">{t(item.titleKey)}</h4>
                    <p className="text-sm text-background/70">{t(item.bodyKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
