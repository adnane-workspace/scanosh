import { useEffect } from 'react';
import CloudinaryImage from '../ui/CloudinaryImage.jsx';
import { useMenuBackdropTheme } from '../../hooks/useMenuBackdropTheme.js';
import { setRuntimeCloudinaryCloudName } from '../../utils/cloudinary.js';

export default function PublicMenuFrame({ cafe, className = '', children }) {
  const { customColor, customImage, theme, isDark } = useMenuBackdropTheme(cafe);

  useEffect(() => {
    setRuntimeCloudinaryCloudName(cafe?.logo || customImage || '');
  }, [cafe?.logo, customImage]);

  const style = {
    ...theme,
    background: customImage ? 'transparent' : theme['--color-background'],
  };

  return (
    <div
      className={`menu-app relative min-h-screen bg-background text-on-surface ${className}`}
      style={style}
      data-menu-scheme={isDark ? 'dark' : 'light'}
    >
      {customImage ? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <CloudinaryImage src={customImage} alt="" preset="cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[var(--menu-overlay)] transition-colors duration-500" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/35 to-transparent" />
        </div>
      ) : null}
      <div className="relative z-10 flex h-full min-h-full flex-1 flex-col">{children}</div>
    </div>
  );
}
