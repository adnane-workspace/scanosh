import { useEffect, useState } from 'react';
import ExternalRedirect from './ExternalRedirect.jsx';
import { resolveDemoMenuUrl } from '../../utils/demoMenu.js';

export default function DemoMenuRedirect() {
  const [to, setTo] = useState('');

  useEffect(() => {
    let cancelled = false;

    resolveDemoMenuUrl().then((url) => {
      if (!cancelled) {
        setTo(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!to) {
    return null;
  }

  return <ExternalRedirect to={to} />;
}
