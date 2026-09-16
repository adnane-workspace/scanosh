import { useEffect } from 'react';
import { APP_NAME, getDocumentOrigin } from '../../utils/constants.js';
import { useLocale } from '../../hooks/useLocale.js';

function upsertMeta(attr, key, content) {
  if (!content) {
    return;
  }

  let node = document.head.querySelector(`meta[${attr}="${key}"]`);

  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }

  node.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);

  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }

  node.setAttribute('href', href);
}

export default function DocumentHead({
  title,
  description,
  path = '/',
  jsonLd,
  robots = 'index,follow',
  type = 'website',
}) {
  const { locale } = useLocale();
  const origin = getDocumentOrigin();
  const canonicalPath = path === '/' ? '/' : path;
  const canonical = origin ? `${origin}${canonicalPath}` : canonicalPath;
  const image = origin ? `${origin}/landing/hero-bg.jpg` : '/landing/hero-bg.jpg';
  const pageTitle = title || APP_NAME;

  useEffect(() => {
    document.title = pageTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:locale', locale === 'ar' ? 'ar_AR' : 'fr_FR');
    upsertMeta('property', 'og:site_name', APP_NAME);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertLink('canonical', canonical);
  }, [canonical, description, image, locale, pageTitle, robots, type]);

  if (!jsonLd) {
    return null;
  }

  const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <>
      {payload.map((block, index) => (
        <script
          key={block['@type'] || index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
