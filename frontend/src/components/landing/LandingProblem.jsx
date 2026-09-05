import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const PROBLEMS = [
  { icon: 'edit_off', titleKey: 'landing.problem1Title', bodyKey: 'landing.problem1Body' },
  { icon: 'payments', titleKey: 'landing.problem2Title', bodyKey: 'landing.problem2Body' },
  { icon: 'history_toggle_off', titleKey: 'landing.problem3Title', bodyKey: 'landing.problem3Body' },
  { icon: 'phonelink_erase', titleKey: 'landing.problem4Title', bodyKey: 'landing.problem4Body' },
];

export default function LandingProblem() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="probleme" ref={ref} className="border-t border-on-surface/10 bg-[#0d1b2a] py-20 text-[#e0e1dd] lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[#778da9] uppercase">{t('landing.problemKicker')}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{t('landing.problemTitle')}</h2>
          <p className="mt-4 text-lg text-[#778da9]">{t('landing.problemBody')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROBLEMS.map((item, index) => (
            <div
              key={item.titleKey}
              className={`rounded-2xl border border-[#e0e1dd]/12 bg-[#1b263b]/60 p-6 transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <MaterialIcon name={item.icon} className="text-[28px] text-[#778da9]" />
              <h3 className="mt-4 text-lg font-semibold">{t(item.titleKey)}</h3>
              <p className="mt-2 text-[#778da9]">{t(item.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
