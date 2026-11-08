import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { registerMessages } from '../context/locale-context.js';
import { messages } from '../i18n/messages.js';
import { APP_NAME } from '../utils/constants.js';

registerMessages(messages);

export default function AuthLayout() {
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return <Outlet />;
}
