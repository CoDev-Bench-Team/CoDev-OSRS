import React from 'react';
import { GoogleIcon } from '../icons/GoogleIcon.jsx';

// figma node: 14:339 Sign in Button (4 variants: Darkmode × Mobile)
export function SignInButton({ darkmode = true, mobile = false, cta = 'Sign in with Google', iconPadding = 16, labelPadding = '18px 16px', className, style, ...rest }) {
  const shellBg = darkmode ? 'var(--osrs-google-blue)' : 'var(--osrs-white)';
  return (
    <button
      type="button"
      className={className}
      style={{ width: 'fit-content', border: 'none', backgroundColor: shellBg, display: 'flex', flexDirection: 'row', padding: mobile ? 0 : '0 32px 0 0', alignItems: 'center', boxSizing: 'border-box', position: 'relative', cursor: 'pointer', ...style }}
      {...rest}
    >
      <span style={{ backgroundColor: 'var(--osrs-white)', boxShadow: darkmode ? 'inset 0 0 0 2px var(--osrs-google-blue)' : undefined, display: 'flex', gap: 8, padding: iconPadding, justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box', alignSelf: 'stretch' }}>
        <GoogleIcon size="32x32" />
      </span>
      <span style={{ backgroundColor: shellBg, display: 'flex', gap: 8, padding: labelPadding, alignItems: 'center', boxSizing: 'border-box' }}>
        <span style={{ fontFamily: 'var(--font-google)', fontWeight: 500, fontSize: 18, lineHeight: '100%', letterSpacing: '0.005em', whiteSpace: 'nowrap', color: darkmode ? 'var(--osrs-white)' : 'var(--osrs-google-gray)' }}>{cta}</span>
      </span>
    </button>
  );
}
