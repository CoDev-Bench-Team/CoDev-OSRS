import React from 'react';

// figma node: 17:23 mdi-light:clipboard-text
export function MdiLightClipboardText({ size = 24, color = 'rgb(0,0,0)', className, style, ...rest }) {
  return (
    <div className={className} style={{ width: size, height: size, overflow: 'hidden', position: 'relative', color, display: 'inline-block', ...style }} {...rest}>
      <svg viewBox="0 0 17 20" fill="none" style={{ position: 'absolute', left: `${(3 / 24) * 100}%`, top: `${(2 / 24) * 100}%`, width: `${(17 / 24) * 100}%`, height: `${(20 / 24) * 100}%` }}>
        <path d="M 3 3 L 5.5 3 C 5.5 2.204 5.816 1.441 6.379 0.879 C 6.941 0.316 7.704 0 8.5 0 C 9.296 0 10.059 0.316 10.621 0.879 C 11.184 1.441 11.5 2.204 11.5 3 L 14 3 C 14.796 3 15.559 3.316 16.121 3.879 C 16.684 4.441 17 5.204 17 6 L 17 17 C 17 17.796 16.684 18.559 16.121 19.121 C 15.559 19.684 14.796 20 14 20 L 3 20 C 2.204 20 1.441 19.684 0.879 19.121 C 0.316 18.559 0 17.796 0 17 L 0 6 C 0 5.204 0.316 4.441 0.879 3.879 C 1.441 3.316 2.204 3 3 3 Z M 3 4 C 2.47 4 1.961 4.211 1.586 4.586 C 1.211 4.961 1 5.47 1 6 L 1 17 C 1 17.53 1.211 18.039 1.586 18.414 C 1.961 18.789 2.47 19 3 19 L 14 19 C 14.53 19 15.039 18.789 15.414 18.414 C 15.789 18.039 16 17.53 16 17 L 16 6 C 16 5.47 15.789 4.961 15.414 4.586 C 15.039 4.211 14.53 4 14 4 L 13 4 L 13 7 L 4 7 L 4 4 L 3 4 Z M 5 6 L 12 6 L 12 4 L 5 4 L 5 6 Z M 8.5 1 C 7.97 1 7.461 1.211 7.086 1.586 C 6.711 1.961 6.5 2.47 6.5 3 L 10.5 3 C 10.5 2.47 10.289 1.961 9.914 1.586 C 9.539 1.211 9.03 1 8.5 1 Z M 3 9 L 14 9 L 14 10 L 3 10 L 3 9 Z M 3 12 L 14 12 L 14 13 L 3 13 L 3 12 Z M 3 15 L 12 15 L 12 16 L 3 16 L 3 15 Z" fill="currentColor" fillRule="nonzero" />
      </svg>
    </div>
  );
}
