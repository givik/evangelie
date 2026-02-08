'use client';

import { useTheme } from '@/components/ThemeProvider';
import localFont from 'next/font/local';

const bookFontBold = localFont({
    src: '../app/fonts/gl-lortkipanidze-bold.ttf',
});

const textFont = localFont({
    src: '../app/fonts/bpg_nino_elite_round.otf',
});

export default function ReaderSettings() {
    const { theme, toggleTheme, fontSize, updateFontSize, settingsLoaded } = useTheme();

    return (
        <div
            className={`reader-settings ${textFont.className}`}
        // style={{ '--font-scale': fontSize }} // Moved to parent wrapper
        >
            {settingsLoaded && (
                <>
                    <div className="font-controls">
                        <button
                            onClick={() => updateFontSize(-0.1)}
                            aria-label="Decrease font size"
                            className={textFont.className}
                        >
                            ა-
                        </button>
                        <span>{(fontSize * 100).toFixed(0)}%</span>
                        <button
                            onClick={() => updateFontSize(0.1)}
                            aria-label="Increase font size"
                            className={textFont.className}
                        >
                            ა+
                        </button>
                    </div>
                    <button className={`theme-toggle ${bookFontBold.className}`} onClick={toggleTheme}>
                        {theme === 'light' ? <img width={30} src="/candle-2-svgrepo-com.svg" alt="candle" /> : <img width={30} src="/candle-2-off-svgrepo-com.svg" alt="candle-off" />}
                    </button>
                </>
            )}
        </div>
    );
}
