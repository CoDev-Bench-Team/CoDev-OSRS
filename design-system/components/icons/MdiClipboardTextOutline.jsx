import React from 'react';

// figma node: 15:539 mdi:clipboard-text-outline
export function MdiClipboardTextOutline({ size = 24, color = 'rgb(0,0,0)', className, style, ...rest }) {
  return (
    <div className={className} style={{ width: size, height: size, overflow: 'hidden', position: 'relative', color, display: 'inline-block', ...style }} {...rest}>
      <svg viewBox="0 0 18 19.979" fill="none" style={{ position: 'absolute', left: `${(3 / 24) * 100}%`, top: `${(1.021 / 24) * 100}%`, width: `${(18 / 24) * 100}%`, height: `${(19.979 / 24) * 100}%` }}>
        <path d="M 16 1.979 L 11.82 1.979 C 11.25 0.419 9.53 -0.381 8 0.179 C 7.14 0.479 6.5 1.139 6.18 1.979 L 2 1.979 C 1.47 1.979 0.961 2.189 0.586 2.564 C 0.211 2.939 0 3.448 0 3.979 L 0 17.979 C 0 18.509 0.211 19.018 0.586 19.393 C 0.961 19.768 1.47 19.979 2 19.979 L 16 19.979 C 16.53 19.979 17.039 19.768 17.414 19.393 C 17.789 19.018 18 18.509 18 17.979 L 18 3.979 C 18 3.448 17.789 2.939 17.414 2.564 C 17.039 2.189 16.53 1.979 16 1.979 Z M 9 1.979 C 9.265 1.979 9.52 2.084 9.707 2.271 C 9.895 2.459 10 2.713 10 2.979 C 10 3.244 9.895 3.498 9.707 3.686 C 9.52 3.873 9.265 3.979 9 3.979 C 8.735 3.979 8.48 3.873 8.293 3.686 C 8.105 3.498 8 3.244 8 2.979 C 8 2.713 8.105 2.459 8.293 2.271 C 8.48 2.084 8.735 1.979 9 1.979 Z M 4 5.979 L 14 5.979 L 14 3.979 L 16 3.979 L 16 17.979 L 2 17.979 L 2 3.979 L 4 3.979 L 4 5.979 Z M 14 9.979 L 4 9.979 L 4 7.979 L 14 7.979 L 14 9.979 Z M 12 13.979 L 4 13.979 L 4 11.979 L 12 11.979 L 12 13.979 Z" fill="currentColor" fillRule="nonzero" />
      </svg>
    </div>
  );
}
