import { usePage } from '@inertiajs/react';
import { useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';
export type FontFamily = 'ibm-plex' | 'inter' | 'manrope';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly fontFamily: FontFamily;
    readonly updateAppearance: (mode: Appearance) => void;
    readonly updateFontFamily: (fontFamily: FontFamily) => void;
};

const listeners = new Set<() => void>();
const fontFamilies: FontFamily[] = ['ibm-plex', 'inter', 'manrope'];
let currentAppearance: Appearance = 'system';
let currentFontFamily: FontFamily = 'ibm-plex';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') {
        return null;
    }

    return (
        document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith(`${name}=`))
            ?.split('=')[1] ?? null
    );
};

const isAppearance = (value: string | null): value is Appearance =>
    value === 'light' || value === 'dark' || value === 'system';

const isFontFamily = (value: string | null): value is FontFamily =>
    value !== null && fontFamilies.includes(value as FontFamily);

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    const appearance = localStorage.getItem('appearance');

    return isAppearance(appearance) ? appearance : 'system';
};

const getStoredFontFamily = (): FontFamily | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const fontFamily = localStorage.getItem('font_family');

    return isFontFamily(fontFamily) ? fontFamily : null;
};

const isDarkMode = (appearance: Appearance): boolean =>
    appearance === 'dark' || (appearance === 'system' && prefersDark());

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const isDark = isDarkMode(appearance);

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const applyFontFamily = (fontFamily: FontFamily): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.dataset.fontFamily = fontFamily;
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => applyTheme(currentAppearance);

export function initializeAppearancePreferences(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const cookieAppearance = getCookie('appearance');
    currentAppearance = isAppearance(cookieAppearance)
        ? cookieAppearance
        : getStoredAppearance();

    const cookieFontFamily = getCookie('font_family');
    currentFontFamily = isFontFamily(cookieFontFamily)
        ? cookieFontFamily
        : (getStoredFontFamily() ?? 'ibm-plex');

    localStorage.setItem('appearance', currentAppearance);
    localStorage.setItem('font_family', currentFontFamily);
    setCookie('appearance', currentAppearance);
    setCookie('font_family', currentFontFamily);
    applyTheme(currentAppearance);
    applyFontFamily(currentFontFamily);

    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance(): UseAppearanceReturn {
    const { appearance: appearanceProps } = usePage<{
        appearance?: { fontFamily?: FontFamily };
    }>().props;
    const serverFontFamily = appearanceProps?.fontFamily ?? 'ibm-plex';
    const appearance = useSyncExternalStore<Appearance>(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );
    const fontFamily = useSyncExternalStore<FontFamily>(
        subscribe,
        () => currentFontFamily,
        () => serverFontFamily,
    );
    const resolvedAppearance: ResolvedAppearance = isDarkMode(appearance)
        ? 'dark'
        : 'light';

    const updateAppearance = (mode: Appearance): void => {
        currentAppearance = mode;
        localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyTheme(mode);
        notify();
    };

    const updateFontFamily = (fontFamily: FontFamily): void => {
        currentFontFamily = fontFamily;
        localStorage.setItem('font_family', fontFamily);
        setCookie('font_family', fontFamily);
        applyFontFamily(fontFamily);
        notify();
    };

    return {
        appearance,
        resolvedAppearance,
        fontFamily,
        updateAppearance,
        updateFontFamily,
    } as const;
}
