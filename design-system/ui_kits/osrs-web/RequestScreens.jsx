const DS_REQ = window.OSRSDesignSystem_585e7e;

function RequestRow({ id, name, role, items, date, status, actionLabel, onAction }) {
  return (
    <div style={{height:78,border:'1px solid var(--border-default)',display:'flex',padding:'18px 20px',alignItems:'center',boxSizing:'border-box',alignSelf:'stretch'}}>
      <span style={{width:200,fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{id}</span>
      {name ? (
        <div style={{width:180,display:'flex',flexDirection:'column',gap:1}}>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{name}</span>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:11,lineHeight:'100%',color:'var(--text-secondary)'}}>{role}</span>
        </div>
      ) : null}
      <span style={{flex:1,fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{items}</span>
      <span style={{width:180,fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-secondary)'}}>{date}</span>
      {status ? <div style={{width:190}}><DS_REQ.StatusPills status={status}/></div> : null}
      <div style={{width:180,display:'flex',alignItems:'center'}}>
        {actionLabel === 'View details'
          ? <span onClick={onAction} style={{cursor:'pointer',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,lineHeight:'100%',color:'var(--brand-primary)'}}>View details →</span>
          : <Button onClick={onAction} style={{height:42,width:82,padding:0}}>{actionLabel}</Button>}
      </div>
    </div>
  );
}

function RequestsQueueScreen({ requests, onReview }) {
  return (
    <React.Fragment>
      <PageHeader title="Requests Queue" subtitle="Review, approve, and fulfill supply requests" width={286}/>
      <div style={{position:'absolute',left:32,top:232,width:1344,display:'flex',gap:16}}>
        <SummaryCard value={String(requests.filter(r=>r.status==='Pending Approval').length)} label="Pending approval"/>
        <SummaryCard value="6" label="In Processing"/>
        <SummaryCard value="2" label="Low stock alerts"/>
      </div>
      <SectionTitle style={{position:'absolute',left:32,top:379}}>Pending Approval</SectionTitle>
      <TableCard style={{position:'absolute',left:32,top:429,width:1344}}>
        <TableHead cols={[['REQUEST ID',200],['REQUESTER',180],['ITEMS',null],['SUBMITTED',180],['ACTION',180]]}/>
        {requests.map(r => <RequestRow key={r.id} {...r} actionLabel="Review" onAction={()=>onReview(r)}/>)}
      </TableCard>
    </React.Fragment>
  );
}

function ReviewRequestScreen({ request, onBack, onApprove, onReject }) {
  return (
    <React.Fragment>
      <div onClick={onBack} style={{position:'absolute',left:32,top:110,cursor:'pointer',display:'flex',gap:7,alignItems:'center'}}>
        <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,lineHeight:'100%',color:'var(--brand-primary)'}}>← Back to Request Queue</span>
      </div>
      <div style={{position:'absolute',left:32,top:142,width:800,display:'flex',flexDirection:'column',gap:8}}>
        <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:32,lineHeight:1.3,color:'var(--text-heading)'}}>Review Request {request.id}</span>
        <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:14,lineHeight:1.5,color:'var(--text-body)'}}>{request.name} • Submitted {request.date} at 9:42 AM</span>
        <div><DS_REQ.StatusPills status={request.status}/></div>
      </div>
      <div style={{position:'absolute',left:32,top:300,width:820,borderRadius:10,background:'var(--surface-card)',boxShadow:'var(--shadow-card)',padding:24,boxSizing:'border-box',display:'flex',flexDirection:'column',gap:12}}>
        <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:15,lineHeight:'100%',color:'var(--text-primary)'}}>Items requested</span>
        {request.lines.map((l,i) => (
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--border-default)'}}>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{l.name}</span>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-secondary)'}}>{l.qty} · {l.stock} in stock</span>
          </div>
        ))}
        <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:12,lineHeight:1.5,color:'var(--text-secondary)'}}>The requester is notified by email on every status change.</span>
        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <Button variant="ghost" onClick={onReject}>Reject</Button>
          <Button onClick={onApprove}>Approve Request</Button>
        </div>
      </div>
    </React.Fragment>
  );
}

function RejectDialog({ request, onCancel, onConfirm, reason, setReason }) {
  return (
    <DS_REQ.Backdrop>
      <div style={{width:620,borderRadius:10,background:'var(--surface-card)',boxShadow:'var(--shadow-card)',padding:28,boxSizing:'border-box',display:'flex',flexDirection:'column',gap:18}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <span style={{fontFamily:'var(--font-display)',fontWeight:500,fontSize:19,lineHeight:1.3,color:'var(--text-heading)'}}>{request.id}</span>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:14,lineHeight:1.5,color:'var(--text-body)'}}>{request.name} • Submitted {request.date} at 9:42 AM</span>
          <div><DS_REQ.StatusPills status="Pending Approval"/></div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:15,lineHeight:'100%',color:'var(--text-primary)'}}>Items requested</span>
          {request.lines.map((l,i) => <span key={i} style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{l.name}{l.qty !== 'Qty 1' ? ' · ' + l.qty : ''}</span>)}
        </div>
        <div style={{borderRadius:10,background:'var(--osrs-red-50)',boxShadow:'var(--ring-brand)',padding:20,display:'flex',flexDirection:'column',gap:9,boxSizing:'border-box'}}>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%',color:'var(--brand-primary)'}}>Reason for rejection *</span>
          <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g item on hold, insufficient justification..." style={{height:56,borderRadius:6,border:'none',background:'var(--surface-card)',boxShadow:'var(--ring-default)',padding:14,boxSizing:'border-box',fontFamily:'var(--font-sans)',fontSize:12,color:'var(--text-primary)',outline:'none'}}/>
        </div>
        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm Rejection</Button>
        </div>
      </div>
    </DS_REQ.Backdrop>
  );
}

function MyRequestsScreen({ requests }) {
  return (
    <React.Fragment>
      <PageHeader title="My Requests" subtitle="Track every request you have submitted and its current status" width={629}/>
      <TableCard style={{position:'absolute',left:32,top:240,width:1344}}>
        <TableHead cols={[['REQUEST ID',200],['SUBMITTED',null],['ITEMS',null],['STATUS',190],['',90]]}/>
        {requests.map(r => (
          <div key={r.id + r.status} style={{height:78,border:'1px solid var(--border-default)',display:'flex',padding:'18px 20px',alignItems:'center',boxSizing:'border-box'}}>
            <span style={{width:200,fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{r.id}</span>
            <span style={{flex:1,fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{r.date}</span>
            <span style={{flex:1,fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{r.items}</span>
            <div style={{width:190}}><DS_REQ.StatusPills status={r.status}/></div>
            <span style={{width:90,fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,lineHeight:'100%',color:'var(--brand-primary)',cursor:'pointer'}}>View details →</span>
          </div>
        ))}
      </TableCard>
    </React.Fragment>
  );
}
Object.assign(window, { RequestsQueueScreen, ReviewRequestScreen, RejectDialog, MyRequestsScreen, RequestRow });
