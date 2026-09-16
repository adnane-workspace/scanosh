import { useEffect, useState } from 'react';
import { getDemoMenuUrl, resolveDemoMenuUrl } from '../../utils/demoMenu.js';

export default function DemoMenuLink({ children, ...props }) {
  const [href, setHref] = useState(getDemoMenuUrl());

  useEffect(() => {
    let cancelled = false;

    resolveDemoMenuUrl().then((url) => {
      if (!cancelled) {
        setHref(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
