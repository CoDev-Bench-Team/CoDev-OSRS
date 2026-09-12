const DS_CHROME = window.OSRSDesignSystem_585e7e;

const A = '../../assets/';

function TopBar({ nav, active, onNav, user, listCount, onOpenList }) {
  return (
    <div style={{position:'absolute',left:0,top:0,width:1440,height:87,overflow:'hidden',background:'var(--surface-bar)',boxShadow:'var(--ring-default)'}}>
      <img src={A+'logo-supply-requests.png'} alt="codev Supply Requests" style={{position:'absolute',left:32,top:22,width:93,height:43}}/>
      <div style={{position:'absolute',left:618,top:29.5,display:'flex',flexDirection:'row',gap:28,alignItems:'center'}}>
        {nav.map(n => (
          <span key={n} onClick={()=>onNav(n)} style={{cursor:'pointer',fontFamily:'var(--font-sans)',fontSize:14,lineHeight:'100%',whiteSpace:'nowrap',fontWeight:n===active?700:500,color:n===active?'var(--brand-primary)':'var(--text-secondary)'}}>{n}</span>
        ))}
      </div>
      <div style={{position:'absolute',right:64,top:27,height:34,display:'flex',flexDirection:'row',gap:18,alignItems:'center'}}>
        <div onClick={onOpenList} style={{cursor:'pointer',display:'flex',gap:8,alignItems:'center'}}>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            <DS_CHROME.MdiLightClipboardText size={24}/>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:11,lineHeight:'100%',whiteSpace:'nowrap',color:'var(--text-primary)'}}>Request List</span>
          </div>
          <div style={{width:22,height:22,borderRadius:999,background:'var(--brand-primary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:11,lineHeight:'100%',color:'#fff'}}>{listCount}</span>
          </div>
        </div>
        <div style={{width:1,height:31,background:'var(--osrs-gray-400)'}}/>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Avatar initials={user.initials} color={user.color} size={34}/>
          <div style={{display:'flex',flexDirection:'column',gap:1}}>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',whiteSpace:'nowrap',color:'var(--text-primary)'}}>{user.name}</span>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:11,lineHeight:'100%',whiteSpace:'nowrap',color:'var(--text-secondary)'}}>{user.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ initials, color, size = 34 }) {
  return (
    <div style={{width:size,height:size,borderRadius:200,background:color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <span style={{fontFamily:'var(--font-sans)',fontWeight:size>40?700:400,fontSize:size>40?20:14,lineHeight:1.5,color:'#fff'}}>{initials}</span>
    </div>
  );
}

function PageHeader({ title, subtitle, width = 629 }) {
  return (
    <div style={{position:'absolute',left:32,top:121,width,display:'flex',flexDirection:'column',gap:8}}>
      <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:32,lineHeight:1.3,color:'var(--text-heading)'}}>{title}</span>
      <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:14,lineHeight:1.5,color:'var(--text-body)'}}>{subtitle}</span>
    </div>
  );
}

function SummaryCard({ value, label }) {
  return (
    <div style={{flex:1,height:103,borderRadius:10,background:'var(--surface-card)',boxShadow:'var(--shadow-card)',display:'flex',flexDirection:'column',gap:7,padding:22,alignItems:'flex-start',boxSizing:'border-box'}}>
      <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:28,lineHeight:1.3,color:'var(--brand-primary)'}}>{value}</span>
      <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-secondary)'}}>{label}</span>
    </div>
  );
}

function Button({ children, variant = 'primary', onClick, style }) {
  const v = {
    primary:{background:'var(--brand-primary)',boxShadow:'var(--ring-brand)',color:'#fff'},
    accent:{background:'var(--brand-primary-alt)',boxShadow:'inset 0 0 0 1px var(--brand-primary-alt)',color:'#fff'},
    ghost:{background:'var(--surface-card)',boxShadow:'var(--ring-default)',color:'var(--text-strong)'},
  }[variant];
  return (
    <button type="button" onClick={onClick} style={{height:42,borderRadius:10,border:'none',padding:'0 18px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%',whiteSpace:'nowrap',boxSizing:'border-box',...v,...style}}>{children}</button>
  );
}

function TableCard({ children, style }) {
  return <div style={{borderRadius:10,overflow:'hidden',background:'var(--surface-card)',boxShadow:'var(--shadow-card)',display:'flex',flexDirection:'column',...style}}>{children}</div>;
}

function TableHead({ cols }) {
  return (
    <div style={{height:41,background:'var(--surface-table-header)',display:'flex',padding:'14px 20px',boxSizing:'border-box',alignSelf:'stretch'}}>
      {cols.map(([label,w]) => <span key={label} style={{width:w,flex:w?undefined:1,fontFamily:'var(--font-sans)',fontWeight:700,fontSize:11,lineHeight:'100%',color:'var(--text-secondary)'}}>{label}</span>)}
    </div>
  );
}

function SectionTitle({ children, style }) {
  return <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:19,lineHeight:1.3,color:'var(--text-heading)',...style}}>{children}</span>;
}

Object.assign(window, { TopBar, Avatar, PageHeader, SummaryCard, Button, TableCard, TableHead, SectionTitle, OSRS_ASSETS: A });
