// Adapted from VibeMeter website (MIT), copyright 2026 VibeMeter contributors.
(() => {
        const queryTheme = new URLSearchParams(location.search).get('theme');
        let storedTheme = 'system';
        try {
          storedTheme = localStorage.getItem('dsh-website-theme') || 'system';
        } catch (_) {}
        if (!['system', 'light', 'dark'].includes(storedTheme)) storedTheme = 'system';
        const preference = queryTheme === 'light' || queryTheme === 'dark' ? queryTheme : storedTheme;
        const resolvedTheme = preference === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : preference;
        document.documentElement.dataset.theme = resolvedTheme;
        document.documentElement.dataset.themePreference = preference;
      })();
    

      (() => {
        const normalizeLocale = (value) => {
          const lower = String(value || '').toLowerCase();
          if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh-hans' || lower.startsWith('zh-cn-')) return 'zh-CN';
          if (lower === 'en' || lower.startsWith('en-')) return 'en';
          return null;
        };

        let locale = null;
        try {
          locale = normalizeLocale(new URLSearchParams(location.search).get('lang'));
          if (!locale) locale = normalizeLocale(localStorage.getItem('dsh-website-language'));
        } catch (_) {}

        if (!locale) {
          for (const language of navigator.languages || [navigator.language]) {
            locale = normalizeLocale(language);
            if (locale) break;
          }
        }

        locale ||= 'en';
        document.documentElement.lang = locale;
        document.documentElement.dataset.initialLocale = locale;
        
      })();
