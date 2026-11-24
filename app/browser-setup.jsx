'use client';

import { useEffect } from 'react';

export default function BrowserSetup({ workspace = false }) {
  useEffect(() => {
    import('../js/site-links.js');
    if (workspace) import('../js/app.js');
  }, [workspace]);
  return null;
}
