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
    <section id="solution" ref={ref} className="bg-[#0d1b2a] pb-16 text-[#e0e1dd] lg:pb-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-12">
        <h2 className="mb-8 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{t('landing.solutionTitle')}</h2>

        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {STEPS.map((step, index) => (
            <article
              key={step.number}
              className={`relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-700 sm:p-6 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.16em] text-white/40">{step.number}</span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                  <MaterialIcon name={step.icon} className="text-[18px]" />
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-white">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{t(step.bodyKey)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
