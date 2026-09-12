const DS_CAT = window.OSRSDesignSystem_585e7e;

const CATEGORIES = ['All supplies','Office Supplies','Devices','Accessories','Audio'];

const CATALOG = [
  { id:'laptop', category:'Devices', name:'Business Laptop', model:'Dell Latitude', image:'item-laptop.jpg', availability:'available' },
  { id:'monitor', category:'Devices', name:'Monitor', model:'LG UltraFine 27"', image:'item-monitor.jpg', availability:'available' },
  { id:'keyboard', category:'Accessories', name:'Wireless Keyboard', model:'Logitech MX Keys', image:'item-laptop.jpg', availability:'unavailable' },
];

function CategoryChip({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{cursor:'pointer',height:31,borderRadius:999,padding:'8px 14px',boxSizing:'border-box',background:active?'var(--brand-primary)':'var(--surface-card)',boxShadow:active?'var(--ring-brand)':'var(--ring-default)',display:'flex',alignItems:'center'}}>
      <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:12,lineHeight:'100%',whiteSpace:'nowrap',color:active?'#fff':'var(--text-secondary)'}}>{label}</span>
    </div>
  );
}

function CatalogScreen({ onAdd, quantities, setQuantity }) {
  const [cat, setCat] = React.useState('All supplies');
  const items = cat === 'All supplies' ? CATALOG : CATALOG.filter(i => i.category === cat);
  return (
    <React.Fragment>
      <div style={{position:'absolute',left:32,top:121,width:1145,display:'flex',flexDirection:'column',gap:8}}>
        <span style={{fontFamily:'var(--font-sans)',fontWeight:500,fontSize:11.5,lineHeight:1.3,color:'var(--text-primary)'}}>Supply Catalog</span>
        <span style={{fontFamily:'var(--font-display)',fontWeight:400,fontSize:32,lineHeight:1.3,color:'var(--text-heading)'}}>Browse available equipment and office essentials. Inventory updates in real time.</span>
      </div>
      <div style={{position:'absolute',left:32,top:246,width:1145}}><DS_CAT.Search style={{width:'100%'}}/></div>
      <div style={{position:'absolute',left:35,top:306,display:'flex',gap:10}}>
        {CATEGORIES.map(c => <CategoryChip key={c} label={c} active={c===cat} onClick={()=>setCat(c)}/>)}
      </div>
      <div style={{position:'absolute',left:32,top:371,width:1376,display:'flex',flexWrap:'wrap',gap:18}}>
        {items.map(i => (
          <DS_CAT.SupplyCard key={i.id}
            category={i.category} name={i.name} model={i.model}
            availability={i.availability}
            image={OSRS_ASSETS + i.image}
            quantity={quantities[i.id] ?? 1}
            onQuantityChange={(n)=>setQuantity(i.id, n)}
            onAction={()=>onAdd(i)}
            actionLabel={i.availability === 'unavailable' ? 'Out of stock' : 'Add to Request List'}
          />
        ))}
      </div>
    </React.Fragment>
  );
}

function RequestListDrawer({ items, onClose, onSubmit, onRemove, purpose, setPurpose }) {
  return (
    <div style={{position:'absolute',right:0,top:0,width:480,height:1024,background:'var(--surface-card)',boxShadow:'var(--shadow-card)',display:'flex',flexDirection:'column',padding:'28px 24px',boxSizing:'border-box',gap:18}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <DS_CAT.MdiLightClipboardText size={24}/>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:15,lineHeight:'100%',color:'var(--text-primary)'}}>Request List</span>
        </div>
        <span onClick={onClose} style={{cursor:'pointer',fontFamily:'var(--font-sans)',fontSize:18,color:'var(--text-secondary)'}}>✕</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12,flex:1,overflow:'auto'}}>
        {items.length === 0 && <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:1.5,color:'var(--text-secondary)'}}>No items yet. Add supplies from the catalog.</span>}
        {items.map((i,idx) => (
          <div key={idx} style={{borderRadius:10,boxShadow:'var(--ring-default)',padding:16,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{i.name}</span>
              <span onClick={()=>onRemove(idx)} style={{cursor:'pointer',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,lineHeight:'100%',color:'var(--brand-primary)'}}>Remove</span>
            </div>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:11,lineHeight:'100%',color:'var(--text-secondary)'}}>{i.model} · Qty {i.qty}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:9}}>
        <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>Purpose (optional)</span>
        <input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="e.g. replacement for damaged unit" style={{height:56,borderRadius:6,border:'none',boxShadow:'var(--ring-default)',padding:14,boxSizing:'border-box',fontFamily:'var(--font-sans)',fontSize:12,color:'var(--text-primary)',outline:'none'}}/>
      </div>
      <Button onClick={onSubmit} style={{width:'100%'}}>Submit Request</Button>
    </div>
  );
}
Object.assign(window, { CatalogScreen, RequestListDrawer, CategoryChip, CATALOG });
