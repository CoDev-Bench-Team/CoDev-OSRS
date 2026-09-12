const EMPLOYEE = { name:'Maya Santos', role:'Employee', initials:'MS', color:'var(--osrs-avatar-orange)', email:'mayas@codev.com • Davao Office' };
const ADMIN = { name:'Ethan Cruz', role:'Admin', initials:'EC', color:'var(--osrs-avatar-green)', email:'ethanc@codev.com • Davao Office' };

const SEED_QUEUE = [
  { id:'REQ-2026-1847', name:'Maya Santos', role:'Product Design', items:'Laptop, Keyboard, USB-C Headset', date:'Sep 11, 2026', status:'Pending Approval',
    lines:[{name:'Laptop - Dell Latitude 5440',qty:'Qty 1',stock:18},{name:'Wireless Keyboard - Logitech M185',qty:'Qty 1',stock:24},{name:'USB-C Headset - A4Tech Hu-10',qty:'Qty 2',stock:5}] },
  { id:'REQ-2026-1842', name:'Samantha Reyes', role:'Finance', items:'Monitor, Dock', date:'Sep 8, 2026', status:'Pending Approval',
    lines:[{name:'Monitor - LG UltraFine 27"',qty:'Qty 1',stock:8},{name:'USB-C Dock',qty:'Qty 1',stock:11}] },
  { id:'REQ-2026-1805', name:'Daniel Santos', role:'Customer Success', items:'Ergonomic Mouse', date:'Aug 29, 2026', status:'Pending Approval',
    lines:[{name:'Logitech MX Master 3S',qty:'Qty 1',stock:4}] },
  { id:'REQ-2026-1760', name:'Isabella Mendoza', role:'Engineering', items:'Laptop Stand', date:'Sep 8, 2026', status:'Pending Approval',
    lines:[{name:'Laptop Stand - Rain mStand',qty:'Qty 1',stock:12}] },
];

const SEED_MINE = [
  { id:'REQ-2026-1847', date:'Sep 11, 2026', items:'Laptop, Keyboard + 1 more', status:'Pending Approval' },
  { id:'REQ-2026-1842', date:'Sep 8, 2026', items:'Monitor, Dock', status:'Ready for Pickup' },
  { id:'REQ-2026-1805', date:'Aug 29, 2026', items:'Ergonomic Mouse', status:'Approved' },
  { id:'REQ-2026-1760', date:'Aug 14, 2026', items:'Laptop Stand', status:'Rejected' },
  { id:'REQ-2026-1733', date:'Jul 28, 2026', items:'Headset, Keyboard + 1 more', status:'Completed' },
];

function App() {
  const [signedIn, setSignedIn] = React.useState(false);
  const [role, setRole] = React.useState('employee');
  const [page, setPage] = React.useState('Catalog');
  const [list, setList] = React.useState([]);
  const [quantities, setQuantities] = React.useState({});
  const [purpose, setPurpose] = React.useState('');
  const [drawer, setDrawer] = React.useState(false);
  const [queue, setQueue] = React.useState(SEED_QUEUE);
  const [mine, setMine] = React.useState(SEED_MINE);
  const [review, setReview] = React.useState(null);
  const [rejecting, setRejecting] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [toast, setToast] = React.useState(null);

  const user = role === 'employee' ? EMPLOYEE : ADMIN;
  const nav = role === 'employee' ? ['Catalog','My Requests','Profile'] : ['Requests Queue','Inventory'];

  const flash = (m) => { setToast(m); setTimeout(()=>setToast(null), 2600); };

  const switchRole = (r) => { setRole(r); setPage(r === 'employee' ? 'Catalog' : 'Requests Queue'); setReview(null); };

  const addToList = (item) => {
    if (item.availability === 'unavailable') return flash('That item is out of stock.');
    setList(l => [...l, { name:item.name, model:item.model, qty:quantities[item.id] ?? 1 }]);
    setDrawer(true);
  };

  const submitRequest = () => {
    if (list.length === 0) return flash('Add at least one item first.');
    const id = 'REQ-2026-' + (1900 + Math.floor(Math.random()*90));
    setMine(m => [{ id, date:'Sep 12, 2026', items:list.map(i=>i.name).join(', '), status:'Pending Approval' }, ...m]);
    setQueue(q => [{ id, name:EMPLOYEE.name, role:'Product Design', items:list.map(i=>i.name).join(', '), date:'Sep 12, 2026', status:'Pending Approval', lines:list.map(i=>({name:i.name+' - '+i.model,qty:'Qty '+i.qty,stock:12})) }, ...q]);
    setList([]); setPurpose(''); setDrawer(false); setPage('My Requests');
    flash(id + ' submitted — inventory deducted, approver notified.');
  };

  const approve = () => {
    setQueue(q => q.filter(r => r.id !== review.id));
    setMine(m => m.map(r => r.id === review.id ? {...r, status:'For Release'} : r));
    flash(review.id + ' approved — supply admin notified.');
    setReview(null);
  };

  const confirmReject = () => {
    if (!reason.trim()) return flash('A rejection reason is required.');
    setQueue(q => q.filter(r => r.id !== rejecting.id));
    setMine(m => m.map(r => r.id === rejecting.id ? {...r, status:'Rejected'} : r));
    flash(rejecting.id + ' rejected — inventory restored, requester notified.');
    setRejecting(null); setReason(''); setReview(null);
  };

  if (!signedIn) return <LoginScreen onSignIn={()=>setSignedIn(true)}/>;

  return (
    <div style={{position:'relative',width:1440,height:1024,overflow:'hidden',background:'var(--surface-page)'}}>
      <TopBar nav={nav} active={page} onNav={setPage} user={user} listCount={list.length} onOpenList={()=>setDrawer(true)}/>

      {role === 'employee' && page === 'Catalog' && <CatalogScreen onAdd={addToList} quantities={quantities} setQuantity={(id,n)=>setQuantities(q=>({...q,[id]:n}))}/>}
      {role === 'employee' && page === 'My Requests' && <MyRequestsScreen requests={mine}/>}
      {role === 'employee' && page === 'Profile' && <ProfileScreen user={user}/>}
      {role === 'admin' && page === 'Requests Queue' && !review && <RequestsQueueScreen requests={queue} onReview={setReview}/>}
      {role === 'admin' && page === 'Requests Queue' && review && <ReviewRequestScreen request={review} onBack={()=>setReview(null)} onApprove={approve} onReject={()=>setRejecting(review)}/>}
      {role === 'admin' && page === 'Inventory' && <InventoryScreen/>}

      {drawer && role === 'employee' && <RequestListDrawer items={list} purpose={purpose} setPurpose={setPurpose} onClose={()=>setDrawer(false)} onSubmit={submitRequest} onRemove={(i)=>setList(l=>l.filter((_,x)=>x!==i))}/>}
      {rejecting && <RejectDialog request={rejecting} reason={reason} setReason={setReason} onCancel={()=>{setRejecting(null);setReason('')}} onConfirm={confirmReject}/>}

      <div style={{position:'absolute',left:32,bottom:24,display:'flex',gap:8,alignItems:'center',background:'var(--surface-card)',boxShadow:'var(--shadow-card)',borderRadius:999,padding:'8px 14px'}}>
        <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:11,lineHeight:'100%',color:'var(--text-secondary)'}}>Viewing as</span>
        {[['employee','Employee'],['admin','Approver / Supply Admin']].map(([k,l])=>(
          <span key={k} onClick={()=>switchRole(k)} style={{cursor:'pointer',borderRadius:999,padding:'6px 10px',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,lineHeight:'100%',background:role===k?'var(--brand-primary)':'transparent',color:role===k?'#fff':'var(--text-secondary)'}}>{l}</span>
        ))}
      </div>

      {toast && (
        <div style={{position:'absolute',right:32,bottom:24,maxWidth:420,borderRadius:10,background:'var(--surface-card)',boxShadow:'var(--shadow-card)',padding:'14px 18px',display:'flex',gap:10,alignItems:'center'}}>
          <span style={{width:8,height:8,borderRadius:999,background:'var(--brand-primary)',flexShrink:0}}/>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:1.5,color:'var(--text-primary)'}}>{toast}</span>
        </div>
      )}
    </div>
  );
}

window.__osrsRoot = window.__osrsRoot || ReactDOM.createRoot(document.getElementById('root'));
window.__osrsRoot.render(<App/>);
