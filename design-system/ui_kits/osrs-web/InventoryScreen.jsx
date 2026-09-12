const DS_INV = window.OSRSDesignSystem_585e7e;

const INVENTORY = [
  { name:'Dell Latitude 7440', code:'IT-DEV-1042', category:'Laptops', total:'32', available:'18', reserved:'14', status:'In Stock' },
  { name:'LG UltraFine 27-inch', code:'MON-2238', category:'Monitors', total:'24', available:'8', reserved:'16', status:'In Stock' },
  { name:'Logitech MX Keys', code:'ACC-0814', category:'Keyboards', total:'40', available:'24', reserved:'16', status:'In Stock' },
  { name:'Logitech MX Master 3S', code:'ACC-0921', category:'Mice', total:'28', available:'4', reserved:'24', status:'Low Stock' },
  { name:'Jabra Evolve2 40', code:'AUD-0318', category:'Headsets', total:'20', available:'5', reserved:'15', status:'Low Stock' },
  { name:'USB-C Cable 2m', code:'CBL-1106', category:'Cables', total:'60', available:'0', reserved:'60', status:'Out of Stock' },
];

function InventoryScreen() {
  return (
    <React.Fragment>
      <PageHeader title="Inventory management" subtitle="Monitor stock levels, manage reservations, and keep office essentials ready for every team"/>
      <Button variant="accent" style={{position:'absolute',left:1218,top:120,width:158}}>+ Add Catalog Item</Button>
      <div style={{position:'absolute',left:32,top:225,width:1344,display:'flex',gap:16}}>
        <SummaryCard value="108" label="Catalog items"/>
        <SummaryCard value="59" label="Available units"/>
        <SummaryCard value="2" label="Low stock alerts"/>
      </div>
      <div style={{position:'absolute',left:32,top:344,width:1344}}><DS_INV.Search placeholder="Search inventory by item name or code" style={{width:'100%'}}/></div>
      <TableCard style={{position:'absolute',left:32,top:429,width:1344}}>
        <div style={{height:48,background:'var(--surface-table-header)',display:'flex',padding:'0 20px',alignItems:'center',boxSizing:'border-box'}}>
          {[['ITEM',300],['CATEGORY',180],['TOTAL STOCK',180],['AVAILABLE QUANTITY',180],['RESERVED / PENDING',180],['STATUS',null],['ACTION',92]].map(([l,w])=>(
            <span key={l} style={{width:w,flex:w?undefined:1,textAlign:l==='ACTION'?'right':'left',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:11,lineHeight:'100%',color:'var(--text-secondary)'}}>{l}</span>
          ))}
        </div>
        {INVENTORY.map(r => (
          <div key={r.code} style={{height:68,border:'1px solid var(--border-default)',display:'flex',padding:'0 20px',alignItems:'center',boxSizing:'border-box'}}>
            <div style={{width:300,display:'flex',flexDirection:'column',gap:4}}>
              <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:13,lineHeight:'100%',color:'var(--text-strong)'}}>{r.name}</span>
              <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:11,lineHeight:'100%',color:'var(--text-secondary)'}}>{r.code}</span>
            </div>
            {[r.category,r.total,r.available,r.reserved].map((v,i)=>(
              <span key={i} style={{width:180,fontFamily:'var(--font-sans)',fontWeight:400,fontSize:13,lineHeight:'100%',color:'var(--text-primary)'}}>{v}</span>
            ))}
            <div style={{flex:1}}><DS_INV.StatusPills status={r.status}/></div>
            <span style={{width:92,textAlign:'right',fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,lineHeight:'100%',color:'var(--brand-primary)',cursor:'pointer'}}>Update stock</span>
          </div>
        ))}
        <div style={{height:54,display:'flex',padding:'0 20px',justifyContent:'space-between',alignItems:'center',boxSizing:'border-box'}}>
          <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:12,lineHeight:'100%',color:'var(--text-secondary)'}}>Showing 6 of 108 inventory items</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:400,fontSize:12,lineHeight:'100%',color:'var(--text-secondary)'}}>Previous</span>
            <div style={{width:30,height:30,borderRadius:6,background:'var(--brand-primary)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,color:'#fff'}}>1</span></div>
            <span style={{fontFamily:'var(--font-sans)',fontWeight:700,fontSize:12,lineHeight:'100%',color:'var(--brand-primary)'}}>Next</span>
          </div>
        </div>
      </TableCard>
    </React.Fragment>
  );
}
Object.assign(window, { InventoryScreen, INVENTORY });
