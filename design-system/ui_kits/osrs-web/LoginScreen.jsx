const DS_LOGIN = window.OSRSDesignSystem_585e7e;

function LoginScreen({ onSignIn }) {
  return (
    <div style={{position:'relative',width:1440,height:1024,overflow:'hidden',background:'var(--surface-page)'}}>
      <div style={{position:'absolute',left:-93,top:-629,width:1533,height:2724,background:`url(${OSRS_ASSETS}login-background.png) center / cover no-repeat`}}/>
      <div style={{position:'absolute',left:510,top:262,width:421,height:500,overflow:'hidden',borderRadius:24,background:'var(--surface-card)',boxShadow:'var(--shadow-card)'}}>
        <div style={{position:'absolute',left:144,top:59}}><DS_LOGIN.CoDevSupplyRequestsLogo markHeight={36}/></div>
        <span style={{position:'absolute',left:121,top:214,fontFamily:'var(--font-sans)',fontWeight:400,fontSize:14,lineHeight:1.5,whiteSpace:'nowrap',color:'var(--text-primary)'}}>Great to have you with us!</span>
        <DS_LOGIN.SignInButton darkmode={false} iconPadding="0 6px" labelPadding="0 6px" onClick={onSignIn} style={{position:'absolute',left:90,top:248,width:242,height:64,borderRadius:32,boxShadow:'inset 0 0 0 1px var(--border-strong)',overflow:'hidden',padding:0,justifyContent:'center',gap:2}}/>
        <span style={{position:'absolute',left:95,top:424,fontFamily:'var(--font-sans)',fontWeight:400,fontSize:14,lineHeight:1.5,whiteSpace:'nowrap',color:'var(--text-primary)'}}>© 2026 CoDev. All rights reserved.</span>
      </div>
    </div>
  );
}
Object.assign(window, { LoginScreen });
