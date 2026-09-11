import { getDemoMenuUrl } from '../../utils/demoMenu.js';

export default function DemoMenuLink({ children, ...props }) {
  return (
    <a href={getDemoMenuUrl()} {...props}>
      {children}
    </a>
  );
}
