import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const STEPS = [
  { number: '01', icon: 'qr_code_2', titleKey: 'landing.solution1Title', bodyKey: 'landing.solution1Body' },
  { number: '02', icon: 'menu_book', titleKey: 'landing.solution2Title', bodyKey: 'landing.solution2Body' },
  { number: '03', icon: 'dashboard', titleKey: 'landing.solution3Title', bodyKey: 'landing.solution3Body' },
];

export default function LandingSolution() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="solution" ref={ref} className="border-t border-on-surface/10 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-on-surface-variant uppercase">{t('landing.solutionKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.solutionTitle')}</h2>
          <p className="mt-4 text-lg text-on-surface-variant">{t('landing.solutionBody')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className={`relative rounded-3xl border border-on-surface/10 bg-surface-container-lowest p-7 transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {index < STEPS.length - 1 ? (
                <MaterialIcon
                  name="arrow_forward"
                  className="absolute top-1/2 -end-4 z-10 hidden -translate-y-1/2 text-[#778da9] lg:block"
                />
              ) : null}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-on-surface-variant">{step.number}</span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary">
                  <MaterialIcon name={step.icon} />
                </span>
              </div>
              <h3 className="mt-8 font-display text-2xl font-bold">{t(step.titleKey)}</h3>
              <p className="mt-3 text-on-surface-variant">{t(step.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
