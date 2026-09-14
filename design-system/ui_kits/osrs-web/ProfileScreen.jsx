function ProfileScreen({ user }) {
  const assigned = [
    { name:'Laptop - Dell Latitude 5440', code:'CDV-MS-00087', date:'Assigned Jan 14, 2026' },
    { name:'Monitor - LG UltraFine 27"', code:'CDV-MS-00114', date:'Assigned Mar 2, 2026' },
    { name:'Headset - Jabra Evolve2 40', code:'CDV-MS-00203', date:'Assigned Jun 9, 2026' },
  ];
  return (
    <div style={{position:'absolute',left:32,top:121,width:1222,display:'flex',flexDirection:'column',gap:48}}>
      <div style={{display:'flex',flexDirection:'column',gap:24}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:32,lineHeight:1.3,color:'var(--text-heading)'}}>Profile</span>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:14,lineHeight:1.5,color:'var(--text-body)'}}>Your details and currently assigned supplies</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <Avatar initials={user.initials} color={user.color} size={56}/>
          <div style={{display:'flex',flexDirection:'column',gap:1}}>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:500,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{user.name}</span>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:11,lineHeight:'100%',color:'var(--text-secondary)'}}>{user.email}</span>
          </div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:14,lineHeight:1.35,color:'var(--text-heading)'}}>Currently Assigned</span>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {assigned.map(a => (
            <div key={a.code} style={{borderRadius:10,background:'var(--surface-card)',boxShadow:'var(--shadow-card)',padding:'18px 20px',display:'flex',flexDirection:'column',gap:6,width:700,boxSizing:'border-box'}}>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:15,lineHeight:'100%',color:'var(--text-primary)'}}>{a.name}</span>
                <span style={{borderRadius:4,background:'var(--status-info-bg)',color:'var(--status-info-fg)',padding:'2px 6px',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%'}}>{a.code}</span>
              </div>
              <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:14,lineHeight:'100%',color:'var(--text-primary)'}}>{a.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ProfileScreen });
