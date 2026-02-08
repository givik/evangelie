'use client';

import { useTheme } from '@/components/ThemeProvider';
import localFont from 'next/font/local';
import Image from 'next/image';

const bookFontBold = localFont({
    src: '../app/fonts/gl-lortkipanidze-bold.ttf',
});

const textFont = localFont({
    src: '../app/fonts/bpg_nino_elite_round.otf',
});

export default function ReaderSettings() {
    const { theme, toggleTheme, fontSize, updateFontSize, settingsLoaded, updateLanguage, language } = useTheme();

    return (
        <div
            className={`reader-settings ${textFont.className} ${!settingsLoaded ? 'settings-loading' : ''}`}
        >
            {settingsLoaded && (
                <button
                    onClick={() => updateLanguage()}
                    aria-label="Change language"
                    className={textFont.className}
                    disabled={!settingsLoaded}
                >
                    {language === 'new'
                        ? 'თანამედროვე ქართულ ენაზე'
                        : 'გ. მთაწმინდელის რედაქციით'}
                </button>
            )}
            <div className="font-controls">
                <button
                    onClick={() => updateFontSize(-0.1)}
                    aria-label="Decrease font size"
                    className={textFont.className}
                    disabled={!settingsLoaded}
                >
                    ა-
                </button>
                <span>{settingsLoaded ? `${(fontSize * 100).toFixed(0)}%` : '100%'}</span>
                <button
                    onClick={() => updateFontSize(0.1)}
                    aria-label="Increase font size"
                    className={textFont.className}
                    disabled={!settingsLoaded}
                >
                    ა+
                </button>
            </div>
            <button
                className={`theme-toggle ${bookFontBold.className}`}
                onClick={toggleTheme}
                disabled={!settingsLoaded}
            >
                {settingsLoaded ? (
                    theme === 'light' ? (
                        <Image src="/candle-2-svgrepo-com.svg" alt="candle" width={30} height={30} />
                    ) : (
                        <Image src="/candle-2-off-svgrepo-com.svg" alt="candle-off" width={30} height={30} />
                    )
                ) : (
                    <div style={{ width: 30, height: 30 }} /> // Placeholder for the icon
                )}
            </button>
        </div>
    );
}
