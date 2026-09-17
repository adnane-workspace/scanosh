import MaterialIcon from '../ui/MaterialIcon.jsx';
import { useLocale } from '../../hooks/useLocale.js';
import { useInView } from '../../hooks/useInView.js';

const STEPS = [
  { number: '01', icon: 'photo_camera', titleKey: 'landing.solution1Title', bodyKey: 'landing.solution1Body' },
  { number: '02', icon: 'menu_book', titleKey: 'landing.solution2Title', bodyKey: 'landing.solution2Body' },
  { number: '03', icon: 'qr_code_2', titleKey: 'landing.solution3Title', bodyKey: 'landing.solution3Body' },
];

export default function LandingSolution() {
  const { t } = useLocale();
  const [ref, isVisible] = useInView(0.12);

  return (
    <section id="solution" ref={ref} className="bg-[#0d1b2a] pb-12 text-[#e0e1dd] sm:pb-16 lg:pb-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <h2 className="mb-5 font-display text-[1.65rem] font-bold tracking-tight text-white sm:mb-8 sm:text-3xl">{t('landing.solutionTitle')}</h2>

        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-3 md:gap-4">
          {STEPS.map((step, index) => (
            <article
              key={step.number}
              className={`relative rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 transition-all duration-700 sm:rounded-2xl sm:p-6 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="mb-3 flex items-center justify-between sm:mb-5">
                <span className="font-mono text-[11px] tracking-[0.16em] text-white/40 sm:text-xs">{step.number}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white sm:h-9 sm:w-9">
                  <MaterialIcon name={step.icon} className="text-[18px]" />
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-white sm:text-xl">{t(step.titleKey)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{t(step.bodyKey)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
