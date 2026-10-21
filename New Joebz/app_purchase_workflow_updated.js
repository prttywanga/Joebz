const KEY='JOEBZ_inventory_v3';
const defaultDB={
 settings:{company:'JOEBZ Computer Sales and Services',currency:'PHP',vatRate:12},
 uoms:['Unit','Pcs','Meter','Bottle','Box','Ream'],
 locations:['Warehouse 1','Main Store','Store Branch 2','Store Branch 3','Store Branch 4','Store Branch 5'],
 products:[
  {id:'P001',sku:'SKU-1001',barcode:'4800001001',name:'A4 Copy Paper',category:'Office Supplies',subcategory:'Paper',brand:'PaperOne',model:'A4-80',specs:'80gsm, 500 sheets',uom:'Ream',cost:175,price:220,reorder:20,variable:false,openingByLocation:{'Warehouse 1':50,'Main Store':32}},
  {id:'P002',sku:'SKU-1002',barcode:'4800001002',name:'Ballpen Blue',category:'Office Supplies',subcategory:'Writing',brand:'Pilot',model:'BP-1',specs:'0.5mm blue ink',uom:'Pcs',cost:12,price:18,reorder:50,variable:false,openingByLocation:{'Main Store':240}},
  {id:'P003',sku:'SKU-1003',barcode:'4800001003',name:'Printer Toner',category:'IT Supplies',subcategory:'Consumables',brand:'HP',model:'85A',specs:'Black laser toner',uom:'Unit',cost:2650,price:3250,reorder:5,variable:true,openingByLocation:{'Warehouse 1':9}},
  {id:'P004',sku:'SKU-1004',barcode:'4800001004',name:'Packing Box',category:'Packaging',subcategory:'Boxes',brand:'Generic',model:'BX-M',specs:'Medium corrugated box',uom:'Box',cost:35,price:55,reorder:15,variable:false,openingByLocation:{'Warehouse 1':60}}
 ],
 suppliers:[
  {id:'S001',code:'SUP-0001',name:'ABC Office Supplies',tin:'123-456-789',address:'Makati City',terms:'30 days',contact:'0917-000-0001',person:'Maria Santos',credit:100000},
  {id:'S002',code:'SUP-0002',name:'TechSource Trading',tin:'987-654-321',address:'Pasig City',terms:'15 days',contact:'0917-000-0002',person:'Juan Dela Cruz',credit:150000}
 ],
 purchases:[],purchaseQuotes:[],purchaseOrders:[],purchaseInvoices:[],transfers:[],sales:[],ledger:[]
};
let db=load(),view='dashboard',modalSubmit=null;

function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY))||clone(defaultDB);d.purchaseQuotes=d.purchaseQuotes||[];d.purchaseOrders=d.purchaseOrders||[];d.purchaseInvoices=d.purchaseInvoices||[];d.purchases=d.purchases||[];return d}catch(e){return clone(defaultDB)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function num(x){return Number(String(x??'').replace(/,/g,''))||0}
function money(x){return new Intl.NumberFormat('en-PH',{style:'currency',currency:db.settings.currency||'PHP'}).format(num(x))}
function fmtDate(x){return x?new Date(x+'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}):'—'}
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function uid(p){return p+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.floor(Math.random()*90+10)}
function today(){return new Date().toISOString().slice(0,10)}
function product(id){return db.products.find(p=>p.id===id)}
function supplier(id){return db.suppliers.find(s=>s.id===id)}
function ensureLocations(){db.products.forEach(p=>{p.openingByLocation=p.openingByLocation||{};db.locations.forEach(l=>{if(p.openingByLocation[l]==null)p.openingByLocation[l]=0})})}
function locQty(p,l){return num((p.openingByLocation||{})[l])}
function totalQty(p){return db.locations.reduce((a,l)=>a+locQty(p,l),0)}
function toast(msg,type=''){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+type;setTimeout(()=>t.className='toast',2600)}
function nav(){document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.getElementById('pageTitle').textContent={dashboard:'Dashboard',inventory:'Inventory',suppliers:'Suppliers',purchases:'Purchasing / Receiving',warehousing:'Warehousing',transfers:'Transfers',pos:'POS / Sales',finance:'Payable / Receivable',reports:'Reports',settings:'Settings'}[view];render()}
document.getElementById('nav').onclick=e=>{const b=e.target.closest('[data-view]');if(b){view=b.dataset.view;nav();document.querySelector('.sidebar').classList.remove('open')}}
document.querySelector('.sidebar-foot').onclick=e=>{const b=e.target.closest('[data-view]');if(b){view=b.dataset.view;nav()}}
document.getElementById('menuBtn').onclick=()=>document.querySelector('.sidebar').classList.toggle('open')
document.getElementById('closeModal').onclick=closeModal
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal()}
document.getElementById('exportJson').onclick=()=>download('joebz-inventory-backup.json',JSON.stringify(db,null,2),'application/json')
document.getElementById('importJson').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);ensureLocations();save();render();toast('Backup restored')}catch(_){toast('Invalid backup file','error')}};r.readAsText(f)}
setInterval(()=>document.getElementById('clock').textContent=new Date().toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'}),1000)

function render(){ensureLocations();const map={dashboard:dashboardView,inventory:inventoryView,suppliers:suppliersView,pq:purchaseQuoteView,po:purchaseOrderView,pi:purchaseInvoiceView,warehousing:warehousingView,transfers:transfersView,pos:posView,finance:financeView,reports:reportsView,settings:settingsView};document.getElementById('content').innerHTML=map[view]();bind()}
function kpi(label,val,sub,icon){return `<div class="card kpi"><div><div class="label">${label}</div><div class="value">${val}</div><div class="sub">${sub}</div></div><div class="kpi-icon">${icon}</div></div>`}
function dashboardView(){
 const stock=db.products.reduce((a,p)=>a+totalQty(p)*p.cost,0),sales=db.sales.reduce((a,s)=>a+s.total,0),purch=db.purchases.reduce((a,p)=>a+p.total,0),low=db.products.filter(p=>totalQty(p)<=p.reorder);
 return `<div class="page-head"><div><h1>Inventory Management</h1><p>Central dashboard for inventory, suppliers, purchasing, receiving, storage, sales and finance.</p></div><div class="actions"><button class="btn primary" data-a="newPurchase">+ Purchase</button><button class="btn" data-a="newSale">+ POS Sale</button><button class="btn" data-a="newProduct">+ Item</button></div></div>
 <div class="grid kpis">${kpi('Inventory cost',money(stock),'On-hand quantity × inventory cost','▥')}${kpi('SKU / Items',db.products.length,db.products.reduce((a,p)=>a+totalQty(p),0).toLocaleString()+' total units','◫')}${kpi('Purchases',money(purch),'Purchase invoices / receipts','⇩')}${kpi('POS sales',money(sales),'Sales recorded','▣')}</div>
 <div class="grid two" style="margin-top:16px"><div class="card"><div class="card-head"><h3>Low stock / reorder</h3><span>${low.length} item(s)</span></div><div class="table-wrap"><table class="table"><thead><tr><th>SKU</th><th>Item</th><th>Qty</th><th>Reorder</th><th>Cost</th></tr></thead><tbody>${low.length?low.map(p=>`<tr><td>${esc(p.sku)}</td><td>${esc(p.name)}</td><td><span class="badge red">${totalQty(p)} ${esc(p.uom)}</span></td><td>${p.reorder}</td><td>${money(p.cost)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">All items are above reorder level.</td></tr>'}</tbody></table></div></div>
 <div class="card"><div class="card-head"><h3>Purchase workflow</h3><span>Inventory receiving</span></div><div class="flow"><span class="flow-step">Purchase Quote</span><b class="arrow">→</b><span class="flow-step">Purchase Order</span><b class="arrow">→</b><span class="flow-step">Receiving</span><b class="arrow">→</b><span class="flow-step">Purchase Invoice</span></div><div class="card-body"><div class="note">Receiving is a workflow step, not a navigation tab. Approved PQs can be copied to an editable PO, and POs can be copied to an editable Purchase Invoice.</div></div></div></div>
 <div class="grid two" style="margin-top:16px"><div class="card"><div class="card-head"><h3>Stock by location</h3></div><div class="grid location-grid" style="padding:14px">${db.locations.map(l=>{const q=db.products.reduce((a,p)=>a+locQty(p,l),0);return `<div class="location-card"><h3>${esc(l)}</h3><small>Combined units</small><div class="stock">${q.toLocaleString()}</div></div>`}).join('')}</div></div>
 <div class="card"><div class="card-head"><h3>Accounts</h3></div><div class="summary">${balanceRows()}</div></div></div>`
}
function balanceRows(){const ap=db.ledger.filter(x=>x.type==='Payable').reduce((a,x)=>a+Math.max(0,x.amount-x.paid),0),ar=db.ledger.filter(x=>x.type==='Receivable').reduce((a,x)=>a+Math.max(0,x.amount-x.paid),0);return `<div class="summary-row"><span>Payables</span><b>${money(ap)}</b></div><div class="summary-row"><span>Receivables</span><b>${money(ar)}</b></div><div class="summary-row"><span>Net</span><b>${money(ar-ap)}</b></div>`}

function inventoryView(){return `<div class="page-head"><div><h1>Inventory List</h1><p>Barcode/SKU, category, sub-category, brand, model, specifications, UOM, quantity and inventory cost.</p></div><div class="actions"><button class="btn" data-a="exportInventory">Export CSV</button><button class="btn primary" data-a="newProduct">+ New Item</button></div></div><div class="card"><div class="toolbar"><div class="search">⌕<input id="iq" placeholder="Search SKU, barcode, item, brand, model..."></div><select id="ic"><option value="">All categories</option>${[...new Set(db.products.map(p=>p.category))].map(c=>`<option>${esc(c)}</option>`).join('')}</select><select id="if"><option value="">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></div><div class="table-wrap"><table class="table"><thead><tr><th>Barcode / SKU</th><th>Item</th><th>Category</th><th>Brand / Model</th><th>Specifications</th><th>UOM</th><th>Qty</th><th>Inventory Cost</th><th>Selling Price</th><th>VAT variable</th><th></th></tr></thead><tbody id="it-body">${productRows(db.products)}</tbody></table></div></div>`}
function productRows(list){return list.length?list.map(p=>`<tr><td><b>${esc(p.sku)}</b><br><small>${esc(p.barcode)}</small></td><td>${esc(p.name)}</td><td>${esc(p.category)}<br><small>${esc(p.subcategory)}</small></td><td>${esc(p.brand)} / ${esc(p.model)}</td><td>${esc(p.specs)}</td><td>${esc(p.uom)}</td><td><span class="badge ${totalQty(p)<=p.reorder?'red':'green'}">${totalQty(p)}</span></td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td>${p.variable?'<span class="badge blue">Yes</span>':'<span class="badge gray">No</span>'}</td><td><button class="mini" data-a="editProduct" data-id="${p.id}">Edit</button> <button class="mini danger" data-a="deleteProduct" data-id="${p.id}">Delete</button></td></tr>`).join(''):'<tr><td colspan="11" class="empty">No inventory items found.</td></tr>'}
function suppliersView(){return `<div class="page-head"><div><h1>Supplier List</h1><p>Supplier code, name, TIN, address, payment terms, contact number, person and credit limit.</p></div><button class="btn primary" data-a="newSupplier">+ New Supplier</button></div><div class="card"><div class="toolbar"><div class="search">⌕<input id="sq" placeholder="Search supplier, code or TIN..."></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Code</th><th>Supplier</th><th>TIN</th><th>Address</th><th>Terms</th><th>Contact</th><th>Person</th><th>Credit Limit</th><th></th></tr></thead><tbody id="st-body">${supplierRows(db.suppliers)}</tbody></table></div></div>`}
function supplierRows(list){return list.length?list.map(s=>`<tr><td><b>${esc(s.code)}</b></td><td>${esc(s.name)}</td><td>${esc(s.tin)}</td><td>${esc(s.address)}</td><td>${esc(s.terms)}</td><td>${esc(s.contact)}</td><td>${esc(s.person)}</td><td>${money(s.credit)}</td><td><button class="mini" data-a="editSupplier" data-id="${s.id}">Edit</button> <button class="mini danger" data-a="deleteSupplier" data-id="${s.id}">Delete</button></td></tr>`).join(''):'<tr><td colspan="9" class="empty">No suppliers found.</td></tr>'}


function docItemsHtml(items){
  return (items||[]).map((i,idx)=>{
    const p=product(i.productId);
    return `<tr><td>${esc(p?.name||i.itemName||'')}</td><td>${esc(p?.sku||i.sku||'')}</td><td>${i.qty}</td><td>${esc(i.uom||p?.uom||'Unit')}</td><td>${money(i.unitCost)}</td><td>${i.vatFlag?'VATable':'Non-VATable'}</td><td>${money(i.qty*i.unitCost)}</td></tr>`;
  }).join('');
}

function docStatusBadge(status){
  const cls=status==='Approved'?'green':status==='Rejected'?'red':status==='Received'?'blue':'amber';
  return `<span class="badge ${cls}">${esc(status||'Draft')}</span>`;
}

function documentActions(type,id){
  return `<button class="mini" data-a="viewDoc" data-type="${type}" data-id="${id}">View</button>
  <button class="mini" data-a="editDoc" data-type="${type}" data-id="${id}">Edit</button>
  <button class="mini danger" data-a="deleteDoc" data-type="${type}" data-id="${id}">Delete</button>`;
}

function purchaseQuoteView(){
  const rows=db.purchaseQuotes.slice().reverse();
  return `<div class="page-head"><div><h1>Purchase Quote (PQ)</h1><p>Create supplier quotations. Approval enables the “Copy to” workflow.</p></div><button class="btn primary" data-a="newPQ">+ New Purchase Quote</button></div>
  <div class="card"><div class="toolbar"><select id="pqFilter"><option value="">All Status</option><option>Draft</option><option>Approved</option><option>Rejected</option></select></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>PQ No.</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Copy to</th><th></th></tr></thead><tbody>
  ${rows.length?rows.map(q=>`<tr><td>${fmtDate(q.date)}</td><td><b>${esc(q.reference)}</b></td><td>${esc(supplier(q.supplierId)?.name||q.supplierName||'')}</td><td>${q.items?.length||0}</td><td>${money(q.total)}</td><td>${docStatusBadge(q.status)}</td><td>${q.status==='Approved'?`<select class="mini" onchange="copyToMenu(this.dataset.type,this.dataset.id,this.value)" data-type="pq" data-id="${q.id}"><option value="">Copy to...</option><option value="po">Purchase Order (PO)</option></select>`:'—'}</td><td>${documentActions('pq',q.id)}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">No Purchase Quotes yet.</td></tr>'}
  </tbody></table></div></div>`;
}

function purchaseOrderView(){
  const rows=db.purchaseOrders.slice().reverse();
  return `<div class="page-head"><div><h1>Purchase Order (PO)</h1><p>Approved PQs can create editable POs. Receiving is recorded when a PO is received.</p></div><button class="btn primary" data-a="newPO">+ New Purchase Order</button></div>
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>PO No.</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Receiving</th><th>Copy to</th><th></th></tr></thead><tbody>
  ${rows.length?rows.map(o=>`<tr><td>${fmtDate(o.date)}</td><td><b>${esc(o.reference)}</b></td><td>${esc(supplier(o.supplierId)?.name||o.supplierName||'')}</td><td>${o.items?.length||0}</td><td>${money(o.total)}</td><td>${docStatusBadge(o.status)}</td><td>${o.status==='Approved'&&o.receivingStatus!=='Received'?`<button class="mini" data-a="receivePO" data-id="${o.id}">Receive</button>`:(o.receivingStatus==='Received'?'<span class="badge green">Received</span>':'—')}</td><td>${o.status==='Approved'?`<select class="mini" onchange="copyToMenu(this.dataset.type,this.dataset.id,this.value)" data-type="po" data-id="${o.id}"><option value="">Copy to...</option><option value="pi">Purchase Invoice (PI)</option></select>`:'—'}</td><td>${documentActions('po',o.id)}</td></tr>`).join(''):'<tr><td colspan="9" class="empty">No Purchase Orders yet.</td></tr>'}
  </tbody></table></div></div>`;
}

function purchaseInvoiceView(){
  const rows=db.purchaseInvoices.slice().reverse();
  return `<div class="page-head"><div><h1>Purchase Invoice (PI)</h1><p>Purchase invoices can be created from POs or entered independently. They remain editable.</p></div><button class="btn primary" data-a="newPI">+ New Purchase Invoice</button></div>
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>PI No.</th><th>Supplier</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody>
  ${rows.length?rows.map(i=>`<tr><td>${fmtDate(i.date)}</td><td><b>${esc(i.reference)}</b></td><td>${esc(supplier(i.supplierId)?.name||i.supplierName||'')}</td><td>${i.items?.length||0}</td><td>${money(i.total)}</td><td>${esc(i.payment||'')}</td><td>${docStatusBadge(i.status||'Draft')}</td><td>${documentActions('pi',i.id)}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">No Purchase Invoices yet.</td></tr>'}
  </tbody></table></div></div>`;
}

function purchaseDocumentForm(type, doc){
  const isPQ=type==='pq';
  doc=doc||{date:today(),reference:'',supplierId:db.suppliers[0]?.id||'',status:'Draft',items:[],notes:''};
  const items=(doc.items&&doc.items.length?doc.items:[{productId:db.products[0]?.id||'',qty:1,uom:db.products[0]?.uom||'Unit',unitCost:db.products[0]?.cost||0,vatFlag:!!db.products[0]?.variable}]);
  const productOptions=(selected)=>db.products.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)} — ${esc(p.sku)}</option>`).join('');
  const itemRows=items.map((item,idx)=>purchaseItemRow(item,idx,productOptions)).join('');
  return `<div class="form-grid">
    <div class="field"><label>Date *</label><input name="date" type="date" required value="${esc(doc.date||today())}"></div>
    <div class="field"><label>${isPQ?'PQ':'PO'} Number *</label><input name="reference" required value="${esc(doc.reference||'')}"></div>
    <div class="field"><label>Supplier *</label><select name="supplierId" required>${db.suppliers.map(s=>`<option value="${esc(s.id)}" ${s.id===(doc.supplierId||'')?'selected':''}>${esc(s.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Status</label><select name="status">${['Draft','Approved','Rejected'].map(x=>`<option ${x===(doc.status||'Draft')?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="field full"><div class="card item-lines-card"><div class="card-head"><h3>Items</h3><button type="button" class="btn" data-a="addDocItem">+ Add Item</button></div>
      <div class="table-wrap"><table class="table item-lines-table"><thead><tr><th>Item *</th><th>Quantity *</th><th>Unit of Measure</th><th>Unit Cost *</th><th>VAT</th><th>Line Total</th><th></th></tr></thead><tbody id="docItemsBody">${itemRows}</tbody></table></div>
    </div></div>
    <div class="field full"><div class="calc-box"><table><tbody><tr><td>Total Items</td><td class="right" id="docItemCount">${items.length}</td></tr><tr><td>Total Amount</td><td class="right" id="docTotal">${money(items.reduce((a,i)=>a+num(i.qty)*num(i.unitCost),0))}</td></tr></tbody></table></div></div>
    ${type==='pi'?`<div class="field"><label>Payment</label><select name="payment"><option ${doc.payment==='Cash basis'?'selected':''}>Cash basis</option><option ${(!doc.payment||doc.payment==='On Account')?'selected':''}>On Account</option></select></div>`:''}
    <div class="field full"><label>Notes / Remarks</label><textarea name="notes">${esc(doc.notes||'')}</textarea></div>
    ${modalButtons}
  </div>`;
}
function purchaseItemRow(item,idx,productOptions){
  const p=product(item.productId)||db.products[0];
  const chosen=item.productId||p?.id||'';
  return `<tr class="doc-item-row">
    <td><select name="productId" class="doc-item-product" required>${productOptions(chosen)}</select></td>
    <td><input name="qty" class="doc-item-qty" type="number" min="0.01" step="0.01" required value="${num(item.qty||1)}"></td>
    <td><select name="uom" class="doc-item-uom">${db.uoms.map(u=>`<option ${u===(item.uom||p?.uom||'Unit')?'selected':''}>${esc(u)}</option>`).join('')}</select></td>
    <td><input name="unitCost" class="doc-item-cost" type="number" step=".01" min="0" required value="${num(item.unitCost??p?.cost).toFixed(2)}"></td>
    <td><select name="vatFlag" class="doc-item-vat"><option value="yes" ${item.vatFlag?'selected':''}>VATable</option><option value="no" ${!item.vatFlag?'selected':''}>Non-VATable</option></select></td>
    <td class="doc-item-line-total">${money(num(item.qty||1)*num(item.unitCost??p?.cost))}</td>
    <td><button type="button" class="mini danger" data-a="removeDocItem" title="Remove item">Remove</button></td>
  </tr>`;
}
function purchaseInvoiceForm(doc){
  return purchaseDocumentForm('pi',doc);
}

function openPurchaseDocument(type,id,source){
  const collection=type==='pq'?db.purchaseQuotes:type==='po'?db.purchaseOrders:db.purchaseInvoices;
  const existing=id?collection.find(x=>x.id===id):null;
  let doc=existing?clone(existing):null;
  if(source){doc=clone(source);doc.id=null;doc.reference='';doc.date=today();doc.status='Draft';doc.sourceId=source.id;doc.sourceType=source.sourceType||type;}
  const title=type==='pq'?'Purchase Quote (PQ)':type==='po'?'Purchase Order (PO)':'Purchase Invoice (PI)';
  const form=type==='pi'?purchaseInvoiceForm(doc):purchaseDocumentForm(type,doc);
  modal(existing?`Edit ${title}`:`New ${title}`,source?`Copied from ${source.sourceType==='pq'?'Purchase Quote':'Purchase Order'} — all transferred fields are editable.`:'Document details',form,fd=>{
    const form=document.getElementById('modalForm');
    const rowEls=[...form.querySelectorAll('.doc-item-row')];
    const items=rowEls.map(row=>{
      const productId=row.querySelector('[name="productId"]').value,p=product(productId);
      const qty=num(row.querySelector('[name="qty"]').value),unitCost=num(row.querySelector('[name="unitCost"]').value);
      return {productId,itemName:p?.name||'',sku:p?.sku||'',qty,uom:row.querySelector('[name="uom"]').value||p?.uom||'Unit',unitCost,vatFlag:row.querySelector('[name="vatFlag"]').value==='yes'};
    });
    if(!items.length||items.some(i=>!product(i.productId)||i.qty<=0||i.unitCost<0))return toast('Add at least one valid item and quantity','error');
    const supplierId=fd.get('supplierId'),status=fd.get('status')||'Draft';
    const data={
      id:existing?.id||uid(type.toUpperCase()),date:fd.get('date')||today(),reference:fd.get('reference')||uid(type.toUpperCase()),
      supplierId, supplierName:supplier(supplierId)?.name||'',status,items,
      total:items.reduce((sum,i)=>sum+i.qty*i.unitCost,0),notes:fd.get('notes')||'',payment:fd.get('payment')||'On Account',
      sourceId:source?.id||existing?.sourceId||null,sourceType:source?.sourceType||existing?.sourceType||null
    };
    if(existing)Object.assign(existing,data);else collection.push(data);
    save();closeModal();render();toast(`${title} saved`);
  });
}

function copyToMenu(type,id,target){
  const src=(type==='pq'?db.purchaseQuotes:db.purchaseOrders).find(x=>x.id===id);
  if(!src)return;
  if(!target)return;
  const label=target==='po'?'Purchase Order (PO)':'Purchase Invoice (PI)';
  if(confirm(`Copy this ${type.toUpperCase()} to ${label}? A new editable form will open.`)){src.sourceType=type;openPurchaseDocument(target,null,src)}
}

function viewPurchaseDocument(type,id){
  const collection=type==='pq'?db.purchaseQuotes:type==='po'?db.purchaseOrders:db.purchaseInvoices;
  const d=collection.find(x=>x.id===id); if(!d)return;
  const title=type==='pq'?'Purchase Quote (PQ)':type==='po'?'Purchase Order (PO)':'Purchase Invoice (PI)';
  const s=supplier(d.supplierId);
  modal(title,`${d.reference} · ${fmtDate(d.date)}`,
    `<div class="card-body"><div class="summary">
      <div class="summary-row"><span>Supplier</span><b>${esc(s?.name||d.supplierName||'')}</b></div>
      <div class="summary-row"><span>Status</span><b>${docStatusBadge(d.status)}</b></div>
      <div class="summary-row"><span>Total</span><b>${money(d.total)}</b></div>
    </div><div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>UOM</th><th>Unit Cost</th><th>VAT</th><th>Total</th></tr></thead><tbody>${docItemsHtml(d.items)}</tbody></table></div>
    <div class="modal-actions"><button type="button" class="btn" onclick="printPurchaseDocument('${type}','${id}')">Print / Save PDF</button><button type="button" class="btn" onclick="exportPurchaseDocument('${type}','${id}')">Export Excel/CSV</button><button type="button" class="btn" onclick="closeModal()">Close</button></div></div>`,
    null
  );
}

function printPurchaseDocument(type,id){
  const collection=type==='pq'?db.purchaseQuotes:type==='po'?db.purchaseOrders:db.purchaseInvoices;
  const d=collection.find(x=>x.id===id);if(!d)return;
  const title=type==='pq'?'Purchase Quote (PQ)':type==='po'?'Purchase Order (PO)':'Purchase Invoice (PI)';
  const s=supplier(d.supplierId);
  const rows=(d.items||[]).map(i=>`<tr><td>${esc(i.itemName||product(i.productId)?.name||'')}</td><td>${esc(i.sku||product(i.productId)?.sku||'')}</td><td>${i.qty}</td><td>${esc(i.uom||'')}</td><td>${money(i.unitCost)}</td><td>${i.vatFlag?'VATable':'Non-VATable'}</td><td>${money(i.qty*i.unitCost)}</td></tr>`).join('');
  const w=window.open('','_blank');if(!w)return;
  w.document.write(`<html><head><title>${esc(title)} ${esc(d.reference)}</title><style>body{font:14px Arial;padding:30px}h1{margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}.total{text-align:right;font-weight:bold;margin-top:18px}</style></head><body><h1>${esc(title)}</h1><div>${esc(d.reference)} · ${esc(fmtDate(d.date))}</div><p><b>Supplier:</b> ${esc(s?.name||d.supplierName||'')}</p><table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>UOM</th><th>Unit Cost</th><th>VAT</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total: ${money(d.total)}</div><script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
}

function exportPurchaseDocument(type,id){
  const collection=type==='pq'?db.purchaseQuotes:type==='po'?db.purchaseOrders:db.purchaseInvoices;
  const d=collection.find(x=>x.id===id);if(!d)return;
  const rows=[['Document Type','Reference','Date','Supplier','Item','SKU','Qty','UOM','Unit Cost','VATable','Line Total'],...(d.items||[]).map(i=>[type.toUpperCase(),d.reference,d.date,supplier(d.supplierId)?.name||d.supplierName||'',i.itemName||product(i.productId)?.name||'',i.sku||product(i.productId)?.sku||'',i.qty,i.uom,i.unitCost,i.vatFlag?'Yes':'No',i.qty*i.unitCost])];
  download(`${type}-${d.reference||d.id}.csv`,rows.map(r=>r.map(csv).join(',')).join('\n'),'text/csv');
}

function deletePurchaseDocument(type,id){
  const map={pq:['Purchase Quote', 'purchaseQuotes'],po:['Purchase Order','purchaseOrders'],pi:['Purchase Invoice','purchaseInvoices']};
  const [label,key]=map[type]; if(!confirm(`Delete this ${label}? This cannot be undone.`))return;
  db[key]=db[key].filter(x=>x.id!==id);save();closeModal();render();toast(`${label} deleted`);
}

function receivePurchaseOrder(id){
  const o=db.purchaseOrders.find(x=>x.id===id);if(!o)return;
  if(o.status!=='Approved')return toast('Only approved POs can be received','error');
  modal('Receiving — Purchase Order','Receiving is a workflow step; it does not create a navigation tab.',
    `<div class="form-grid"><div class="field full"><div class="note">Receive the PO items into a selected location. The quantities below will be added to inventory.</div></div>
    <div class="field"><label>Receiving Location *</label><select name="location">${db.locations.map(l=>`<option>${esc(l)}</option>`).join('')}</select></div>
    <div class="field"><label>Receiving Reference</label><input name="reference" value="${esc('GRN-'+Date.now().toString().slice(-6))}"></div>
    <div class="field full"><div class="table-wrap"><table class="table"><thead><tr><th>Item</th><th>Qty</th><th>UOM</th><th>Unit Cost</th></tr></thead><tbody>${(o.items||[]).map(i=>`<tr><td>${esc(i.itemName||product(i.productId)?.name||'')}</td><td>${i.qty}</td><td>${esc(i.uom||'')}</td><td>${money(i.unitCost)}</td></tr>`).join('')}</tbody></table></div></div>${modalButtons}</div>`,
    fd=>{
      const loc=fd.get('location');
      (o.items||[]).forEach(i=>{const p=product(i.productId);if(p){p.openingByLocation[loc]=(p.openingByLocation[loc]||0)+num(i.qty);p.cost=num(i.unitCost)||p.cost;}});
      o.receivingStatus='Received';o.receivedDate=today();o.receivingReference=fd.get('reference');
      save();closeModal();render();toast('PO received and inventory updated');
    });
}

function purchasesView(){return `<div class="page-head"><div><h1>Purchasing / Receiving</h1><p>Record purchases using the sample calculation for Exact Amount, VATable Sales, VAT and Total Amount Due.</p></div><button class="btn primary" data-a="newPurchase">+ Receive Purchase</button></div>
<div class="card"><div class="card-head"><h3>Purchase calculation</h3><span>12% VAT worksheet logic</span></div><div class="card-body"><div class="note">Exact Amount = Total Qty × Unit Cost. With SI enabled: VATable Sales = Exact Amount ÷ 1.12; Add VAT = VATable Sales × 0.12; Total Amount Due = VATable Sales + VAT-Exempt Sales + Zero-Rated Sales + Add VAT − Withholding Tax.</div></div></div>
<div class="card" style="margin-top:16px"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Invoice</th><th>Supplier</th><th>Item</th><th>Qty</th><th>Unit Cost</th><th>Exact Amount</th><th>Input VAT</th><th>Total Due</th><th>Location</th></tr></thead><tbody>${db.purchases.length?db.purchases.slice().reverse().map(x=>{const i=x.items[0],p=product(i.productId);return `<tr><td>${fmtDate(x.date)}</td><td><b>${esc(x.reference)}</b></td><td>${esc(supplier(x.supplierId)?.name||'')}</td><td>${esc(p?.name||'')}</td><td>${i.qty}</td><td>${money(i.unitCost)}</td><td>${money(x.exactAmount)}</td><td>${money(x.inputVAT)}</td><td><b>${money(x.total)}</b></td><td>${esc(x.location)}</td></tr>`}).join(''):'<tr><td colspan="10" class="empty">No purchase receipts yet.</td></tr>'}</tbody></table></div></div></div>`}

function warehousingView(){return `<div class="page-head"><div><h1>Warehousing / Storage</h1><p>Stock balances by Warehouse 1, Main Store and Store Branch 2–5.</p></div><button class="btn primary" data-a="newTransfer">+ Transfer Stock</button></div><div class="grid location-grid">${db.locations.map(l=>{const q=db.products.reduce((a,p)=>a+locQty(p,l),0),v=db.products.reduce((a,p)=>a+locQty(p,l)*p.cost,0);return `<div class="card location-card"><h3>${esc(l)}</h3><small>Storage location</small><div class="stock">${q.toLocaleString()}</div><small>units · ${money(v)} inventory cost</small></div>`}).join('')}</div><div class="card" style="margin-top:16px"><div class="card-head"><h3>Location stock matrix</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>SKU</th><th>Item</th>${db.locations.map(l=>`<th>${esc(l)}</th>`).join('')}<th>Total</th></tr></thead><tbody>${db.products.map(p=>`<tr><td>${esc(p.sku)}</td><td>${esc(p.name)}</td>${db.locations.map(l=>`<td>${locQty(p,l)}</td>`).join('')}<td><b>${totalQty(p)}</b></td></tr>`).join('')}</tbody></table></div></div>`}
function transfersView(){return `<div class="page-head"><div><h1>Inter-location Transfers</h1><p>Move inventory between storage locations while updating both balances.</p></div><button class="btn primary" data-a="newTransfer">+ New Transfer</button></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Reference</th><th>From</th><th>To</th><th>Item</th><th>Qty</th><th>Status</th></tr></thead><tbody>${db.transfers.length?db.transfers.slice().reverse().map(t=>`<tr><td>${fmtDate(t.date)}</td><td>${esc(t.id)}</td><td>${esc(t.from)}</td><td>${esc(t.to)}</td><td>${esc(product(t.productId)?.name||'')}</td><td>${t.qty}</td><td><span class="badge green">${esc(t.status)}</span></td></tr>`).join(''):'<tr><td colspan="7" class="empty">No transfers recorded.</td></tr>'}</tbody></table></div></div>`}
function posView(){return `<div class="page-head"><div><h1>POS / Sales</h1><p>Sales deduct stock from the selected location and can create receivables.</p></div><button class="btn primary" data-a="newSale">+ New Sale</button></div><div class="grid kpis">${kpi('Sales',money(db.sales.reduce((a,s)=>a+s.total,0)),'Gross POS sales','₱')}${kpi('Receivable',money(db.ledger.filter(x=>x.type==='Receivable').reduce((a,x)=>a+Math.max(0,x.amount-x.paid),0)),'Outstanding','AR')}${kpi('Transactions',db.sales.length,'Receipts','▣')}${kpi('VAT',money(db.sales.reduce((a,s)=>a+s.outputVAT,0)),'Output VAT','VAT')}</div><div class="card" style="margin-top:16px"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Receipt</th><th>Customer</th><th>Item</th><th>Qty</th><th>Gross</th><th>VAT</th><th>Total</th><th>Payment</th></tr></thead><tbody>${db.sales.length?db.sales.slice().reverse().map(s=>{const i=s.items[0],p=product(i.productId);return `<tr><td>${fmtDate(s.date)}</td><td><b>${esc(s.id)}</b></td><td>${esc(s.customer)}</td><td>${esc(p?.name||'')}</td><td>${i.qty}</td><td>${money(s.gross)}</td><td>${money(s.outputVAT)}</td><td><b>${money(s.total)}</b></td><td>${esc(s.payment)}</td></tr>`}).join(''):'<tr><td colspan="9" class="empty">No sales yet.</td></tr>'}</tbody></table></div></div>`}
function financeView(){return `<div class="page-head"><div><h1>Payable / Receivable</h1><p>Track supplier payables and customer receivables.</p></div></div><div class="grid kpis">${kpi('Open payables',money(db.ledger.filter(x=>x.type==='Payable').reduce((a,x)=>a+Math.max(0,x.amount-x.paid),0)),'Supplier balances','AP')}${kpi('Open receivables',money(db.ledger.filter(x=>x.type==='Receivable').reduce((a,x)=>a+Math.max(0,x.amount-x.paid),0)),'Customer balances','AR')}${kpi('Paid',money(db.ledger.reduce((a,x)=>a+x.paid,0)),'Payments recorded','✓')}${kpi('Documents',db.ledger.length,'Ledger entries','▤')}</div><div class="card" style="margin-top:16px"><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Reference</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>${ledgerRows(db.ledger)}</tbody></table></div></div>`}
function ledgerRows(list){return list.length?list.slice().reverse().map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.party)}</td><td>${esc(x.ref)}</td><td>${money(x.amount)}</td><td>${money(x.paid)}</td><td><b>${money(x.amount-x.paid)}</b></td><td><span class="badge ${x.status==='Paid'?'green':'amber'}">${esc(x.status)}</span></td><td>${x.status==='Paid'?'—':`<button class="mini" data-a="pay" data-id="${x.id}">Record Payment</button>`}</td></tr>`).join(''):'<tr><td colspan="9" class="empty">No ledger entries.</td></tr>'}
function reportsView(){const cost=db.products.reduce((a,p)=>a+totalQty(p)*p.cost,0),retail=db.products.reduce((a,p)=>a+totalQty(p)*p.price,0),vatIn=db.purchases.reduce((a,p)=>a+p.inputVAT,0),vatOut=db.sales.reduce((a,s)=>a+s.outputVAT,0);return `<div class="page-head"><div><h1>Reports</h1><p>Inventory valuation, VAT summary, purchasing, sales and stock movement.</p></div><div class="actions"><button class="btn" data-a="exportInventory">Inventory CSV</button><button class="btn" data-a="exportTransactions">Transactions CSV</button></div></div><div class="grid three">${kpi('Inventory cost',money(cost),'Current stock valuation','▥')}${kpi('Potential retail',money(retail),'On-hand × selling price','₱')}${kpi('Potential margin',money(retail-cost),'Before expenses','%')}</div><div class="grid three" style="margin-top:16px"><div class="card"><div class="card-head"><h3>VAT summary</h3></div><div class="summary"><div class="summary-row"><span>Input VAT</span><b>${money(vatIn)}</b></div><div class="summary-row"><span>Output VAT</span><b>${money(vatOut)}</b></div><div class="summary-row"><span>Net VAT</span><b>${money(vatOut-vatIn)}</b></div></div></div><div class="card"><div class="card-head"><h3>Inventory by category</h3></div><div class="bar-chart">${categoryBars()}</div></div><div class="card"><div class="card-head"><h3>Document totals</h3></div><div class="summary"><div class="summary-row"><span>Purchases</span><b>${db.purchases.length}</b></div><div class="summary-row"><span>Sales</span><b>${db.sales.length}</b></div><div class="summary-row"><span>Transfers</span><b>${db.transfers.length}</b></div></div></div></div><div class="card" style="margin-top:16px"><div class="card-head"><h3>Inventory valuation</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>SKU</th><th>Item</th><th>Qty</th><th>Inventory Cost</th><th>Value</th></tr></thead><tbody>${db.products.map(p=>`<tr><td>${esc(p.sku)}</td><td>${esc(p.name)}</td><td>${totalQty(p)}</td><td>${money(p.cost)}</td><td>${money(totalQty(p)*p.cost)}</td></tr>`).join('')}</tbody></table></div></div>`}
function categoryBars(){const m={};db.products.forEach(p=>m[p.category]=(m[p.category]||0)+totalQty(p));const a=Object.entries(m),max=Math.max(...a.map(x=>x[1]),1);return a.map(([k,v])=>`<div class="bar"><i style="height:${Math.max(5,v/max*78)}%"></i><span title="${esc(k)}">${esc(k.slice(0,12))}</span></div>`).join('')}
function settingsView(){return `<div class="page-head"><div><h1>Settings</h1><p>Company, currency, VAT rate, UOM and locations.</p></div><button class="btn primary" data-a="saveSettings">Save Settings</button></div><div class="grid two"><div class="card"><div class="card-head"><h3>Company / VAT</h3></div><div class="card-body"><div class="form-grid"><div class="field"><label>Company Name</label><input id="setCompany" value="${esc(db.settings.company)}"></div><div class="field"><label>Currency</label><select id="setCurrency"><option value="PHP" ${db.settings.currency==='PHP'?'selected':''}>PHP (₱)</option><option value="USD" ${db.settings.currency==='USD'?'selected':''}>USD ($)</option></select></div><div class="field"><label>VAT Rate %</label><input id="setVat" type="number" step=".01" value="${db.settings.vatRate}"></div></div></div></div><div class="card"><div class="card-head"><h3>Maintenance</h3></div><div class="card-body"><button class="btn" data-a="resetData">Reset to Demo Data</button><p class="note" style="margin-top:12px">Resetting replaces local browser data with the demo inventory and sample suppliers.</p></div></div></div>`}

function modal(title,subtitle,html,submit){document.getElementById('modalTitle').textContent=title;document.getElementById('modalSubtitle').textContent=subtitle||'';document.getElementById('modalForm').innerHTML=html;modalSubmit=submit;document.getElementById('modal').classList.remove('hidden');document.getElementById('modalForm').onsubmit=e=>{e.preventDefault();modalSubmit(new FormData(e.target))}}
function closeModal(){document.getElementById('modal').classList.add('hidden');modalSubmit=null}
const modalButtons=`<div class="modal-actions"><button type="button" class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" type="submit">Save</button></div>`;

function productForm(p){
 p=p||{name:'',sku:'',barcode:'',category:'',subcategory:'',brand:'',model:'',specs:'',uom:'Unit',cost:0,price:0,reorder:0,variable:false};
 return `<div class="form-grid"><div class="field"><label>Item Name *</label><input name="name" required value="${esc(p.name)}"></div><div class="field"><label>SKU / Model ID *</label><input name="sku" required value="${esc(p.sku)}"></div><div class="field"><label>Barcode</label><input name="barcode" value="${esc(p.barcode)}"></div><div class="field"><label>Category</label><input name="category" value="${esc(p.category)}"></div><div class="field"><label>Sub-category</label><input name="subcategory" value="${esc(p.subcategory)}"></div><div class="field"><label>Brand</label><input name="brand" value="${esc(p.brand)}"></div><div class="field"><label>Model</label><input name="model" value="${esc(p.model)}"></div><div class="field"><label>UOM</label><select name="uom">${db.uoms.map(u=>`<option ${u===p.uom?'selected':''}>${esc(u)}</option>`).join('')}</select></div><div class="field full"><label>Specifications</label><textarea name="specs">${esc(p.specs)}</textarea></div><div class="field"><label>Inventory Cost</label><input name="cost" type="number" step=".01" min="0" value="${num(p.cost).toFixed(2)}"></div><div class="field"><label>Selling Price</label><input name="price" type="number" step=".01" min="0" value="${num(p.price).toFixed(2)}"></div><div class="field"><label>Reorder Level</label><input name="reorder" type="number" min="0" value="${num(p.reorder)}"></div><div class="field check"><label class="check"><input name="variable" type="checkbox" ${p.variable?'checked':''}> VAT-variable item</label></div>${modalButtons}</div>`
}
function supplierForm(s){s=s||{code:'',name:'',tin:'',address:'',terms:'30 days',contact:'',person:'',credit:0};return `<div class="form-grid"><div class="field"><label>Supplier Code</label><input name="code" value="${esc(s.code)}"></div><div class="field"><label>Supplier Name *</label><input name="name" required value="${esc(s.name)}"></div><div class="field"><label>TIN</label><input name="tin" value="${esc(s.tin)}"></div><div class="field"><label>Address</label><input name="address" value="${esc(s.address)}"></div><div class="field"><label>Payment Terms</label><input name="terms" value="${esc(s.terms)}"></div><div class="field"><label>Contact Number</label><input name="contact" value="${esc(s.contact)}"></div><div class="field"><label>Contact Person</label><input name="person" value="${esc(s.person)}"></div><div class="field"><label>Credit Limit</label><input name="credit" type="number" step=".01" value="${num(s.credit)}"></div>${modalButtons}</div>`}

function purchaseForm(){
 const p=db.products[0],s=db.suppliers[0];
 return `<div class="form-grid">
 <div class="field"><label>Invoice Date</label><input name="date" type="date" value="${today()}"></div>
 <div class="field"><label>Sales / Purchase Invoice No. *</label><input name="reference" required placeholder="e.g. SI-000123"></div>
 <div class="field"><label>Supplier *</label><select name="supplierId">${db.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
 <div class="field"><label>Item *</label><select name="productId" id="purchaseProduct">${db.products.map(x=>`<option value="${x.id}" data-cost="${x.cost}">${esc(x.name)} — ${esc(x.sku)}</option>`).join('')}</select></div>
 <div class="field"><label>Total QTY *</label><input name="qty" id="purchaseQty" type="number" min="0" step="1" value="1"></div>
 <div class="field"><label>Unit Cost (₱)</label><div class="money"><span>₱</span><input name="unitCost" id="purchaseUnitCost" inputmode="decimal" value="${num(p?.cost).toFixed(2)}"></div></div>
 <div class="field"><label>Exact Amount (Total Items Cost)</label><div class="money"><span>₱</span><input name="exactAmount" id="purchaseExact" inputmode="decimal" value="${num(p?.cost).toFixed(2)}"></div></div>
 <div class="field check"><label class="check"><input name="withSI" id="purchaseWithSI" type="checkbox" checked> With SI (1.12 VAT)</label></div>
 <div class="field"><label>VATable Sales</label><div class="money"><span>₱</span><input id="purchaseVatable" readonly value="${num(p?.cost/1.12).toFixed(2)}"></div></div>
 <div class="field"><label>VAT-Exempt Sales</label><div class="money"><span>₱</span><input name="vatExempt" id="purchaseExempt" value="0.00"></div></div>
 <div class="field"><label>Zero-Rated Sales</label><div class="money"><span>₱</span><input name="vatZero" id="purchaseZero" value="0.00"></div></div>
 <div class="field"><label>Add VAT (12%)</label><div class="money"><span>₱</span><input id="purchaseVAT" readonly value="${num(p?.cost/1.12*.12).toFixed(2)}"></div></div>
 <div class="field"><label>Less: Withholding Tax</label><div class="money"><span>₱</span><input name="withholding" id="purchaseWithholding" value="0.00"></div></div>
 <div class="field full"><label>TOTAL AMOUNT DUE</label><div class="money"><span>₱</span><input id="purchaseTotal" readonly value="${num(p?.cost).toFixed(2)}"></div></div>
 <div class="field"><label>Receiving Location</label><select name="location">${db.locations.map(l=>`<option>${esc(l)}</option>`).join('')}</select></div>
 <div class="field"><label>Payment</label><select name="payment"><option>Cash basis</option><option>On Account</option></select></div>
 <div class="field full"><label>Item Description / Remarks</label><textarea name="remarks" placeholder="Description, PO number, notes..."></textarea></div>
 <div class="field full"><div class="calc-box"><table><tbody><tr><td>Total Qty</td><td class="right" id="calcQty">1</td></tr><tr><td>Unit Cost</td><td class="right" id="calcUnit">${money(p?.cost)}</td></tr><tr><td>Exact Amount</td><td class="right" id="calcExact">${money(p?.cost)}</td></tr><tr><td>VATable Sales</td><td class="right" id="calcVatSales">${money(p?.cost/1.12)}</td></tr><tr><td>Add VAT</td><td class="right" id="calcVat">${money(p?.cost/1.12*.12)}</td></tr><tr class="calc-total"><td>Total Amount Due</td><td class="right" id="calcTotal">${money(p?.cost)}</td></tr></tbody></table></div></div>
 ${modalButtons}</div>`
}
function transferForm(){return `<div class="form-grid"><div class="field"><label>From *</label><select name="from">${db.locations.map(l=>`<option>${esc(l)}</option>`).join('')}</select></div><div class="field"><label>To *</label><select name="to">${db.locations.map(l=>`<option>${esc(l)}</option>`).join('')}</select></div><div class="field"><label>Item *</label><select name="productId">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)} — ${totalQty(p)} total</option>`).join('')}</select></div><div class="field"><label>Quantity *</label><input name="qty" type="number" min="1" value="1"></div>${modalButtons}</div>`}
function saleForm(){const p=db.products.find(p=>totalQty(p)>0)||db.products[0];return `<div class="form-grid"><div class="field"><label>Date</label><input name="date" type="date" value="${today()}"></div><div class="field"><label>Customer</label><input name="customer" value="Walk-in Customer"></div><div class="field"><label>Item *</label><select name="productId">${db.products.filter(p=>totalQty(p)>0).map(p=>`<option value="${p.id}">${esc(p.name)} — ${money(p.price)}</option>`).join('')}</select></div><div class="field"><label>Quantity *</label><input name="qty" type="number" min="1" value="1"></div><div class="field"><label>Unit Price</label><input name="price" type="number" step=".01" value="${num(p?.price)}"></div><div class="field"><label>Selling Location</label><select name="location">${db.locations.map(l=>`<option>${esc(l)}</option>`).join('')}</select></div><div class="field"><label>Payment</label><select name="payment"><option>Cash basis</option><option>On Account</option></select></div><div class="field"><label>VAT treatment</label><select name="vat"><option value="variable">Variable / VATable</option><option value="zero">Zero VAT</option></select></div>${modalButtons}</div>`}

function openProduct(id){const p=id?product(id):null;modal(id?'Edit Inventory Item':'New Inventory Item','Product master data',productForm(p),fd=>{const data={name:fd.get('name'),sku:fd.get('sku'),barcode:fd.get('barcode'),category:fd.get('category'),subcategory:fd.get('subcategory'),brand:fd.get('brand'),model:fd.get('model'),specs:fd.get('specs'),uom:fd.get('uom'),cost:num(fd.get('cost')),price:num(fd.get('price')),reorder:num(fd.get('reorder')),variable:fd.get('variable')==='on'};if(p)Object.assign(p,data);else db.products.push({id:uid('P'),...data,openingByLocation:{}});ensureLocations();save();closeModal();render();toast('Inventory item saved')})}
function openSupplier(id){const s=id?supplier(id):null;modal(id?'Edit Supplier':'New Supplier','Supplier master data',supplierForm(s),fd=>{const data={code:fd.get('code'),name:fd.get('name'),tin:fd.get('tin'),address:fd.get('address'),terms:fd.get('terms'),contact:fd.get('contact'),person:fd.get('person'),credit:num(fd.get('credit'))};if(s)Object.assign(s,data);else db.suppliers.push({id:uid('S'),...data});save();closeModal();render();toast('Supplier saved')})}

function calcPurchase(form){
 const qty=num(form.querySelector('#purchaseQty')?.value),unit=num(form.querySelector('#purchaseUnitCost')?.value),exact=qty*unit;
 const withSI=form.querySelector('#purchaseWithSI')?.checked;
 const exempt=num(form.querySelector('#purchaseExempt')?.value),zero=num(form.querySelector('#purchaseZero')?.value),withholding=num(form.querySelector('#purchaseWithholding')?.value);
 const vatable=withSI?exact/1.12:0,vat=withSI?vatable*.12:0,total=vatable+exempt+zero+vat-withholding;
 const set=(id,v)=>{const e=form.querySelector(id);if(e)e.value=v.toFixed(2)};
 set('#purchaseExact',exact);set('#purchaseVatable',vatable);set('#purchaseVAT',vat);set('#purchaseTotal',total);
 const t=(id,v)=>{const e=form.querySelector(id);if(e)e.textContent=id.includes('Vat')||id.includes('Exact')||id.includes('Total')||id.includes('Unit')?money(v):String(v)};
 t('#calcQty',qty);t('#calcUnit',unit);t('#calcExact',exact);t('#calcVatSales',vatable);t('#calcVat',vat);t('#calcTotal',total);
 return {qty,unit,exact,vatable,vat,exempt,zero,withholding,total,withSI}
}
function openPurchase(){
 modal('Receive Purchase / Sales Invoice','Uses the exact calculation from sample.html',purchaseForm(),fd=>{
  const f=document.getElementById('modalForm'),c=calcPurchase(f),p=product(fd.get('productId')),loc=fd.get('location'),supplierId=fd.get('supplierId');
  if(!p||c.qty<=0)return toast('Enter a valid quantity','error');
  const ref=fd.get('reference')||uid('PI');
  const inventoryCost=p.variable?(c.withSI?c.vatable:c.exact)/c.qty:c.exact/c.qty;
  p.openingByLocation[loc]=(p.openingByLocation[loc]||0)+c.qty;p.cost=inventoryCost;
  const purchase={id:uid('PUR'),date:fd.get('date'),reference:ref,supplierId,location:loc,items:[{productId:p.id,qty:c.qty,unitCost:c.unit}],gross:c.exact,exactAmount:c.exact,inputVAT:c.vat,inventoryCost:c.qty*inventoryCost,total:c.total,payment:fd.get('payment'),remarks:fd.get('remarks')};
  db.purchases.push(purchase);
  db.ledger.push({id:uid('AP'),type:'Payable',date:purchase.date,party:supplier(supplierId)?.name||'',ref,amount:c.total,paid:fd.get('payment')==='Cash basis'?c.total:0,status:fd.get('payment')==='Cash basis'?'Paid':'Open'});
  save();closeModal();render();toast('Purchase received and stock updated')
 })
}
function openTransfer(){modal('Transfer Stock','Move stock between locations',transferForm(),fd=>{const from=fd.get('from'),to=fd.get('to'),p=product(fd.get('productId')),q=num(fd.get('qty'));if(from===to)return toast('From and To must differ','error');if(!p||locQty(p,from)<q)return toast('Insufficient stock at source location','error');p.openingByLocation[from]-=q;p.openingByLocation[to]+=q;db.transfers.push({id:uid('TR'),date:today(),from,to,productId:p.id,qty:q,status:'Completed'});save();closeModal();render();toast('Transfer completed')})}
function openSale(){modal('New POS Sale','Deduct stock and record sale',saleForm(),fd=>{const p=product(fd.get('productId')),q=num(fd.get('qty')),loc=fd.get('location'),price=num(fd.get('price'));if(!p||q<=0)return toast('Invalid sale','error');if(locQty(p,loc)<q)return toast('Insufficient stock at selected location','error');const gross=q*price,vat=fd.get('vat')==='variable'?gross/1.12*.12:0,total=gross;p.openingByLocation[loc]-=q;const id=uid('SO');db.sales.push({id,date:fd.get('date'),customer:fd.get('customer'),payment:fd.get('payment'),location:loc,items:[{productId:p.id,qty:q,price}],gross,outputVAT:vat,total});db.ledger.push({id:uid('AR'),type:'Receivable',date:fd.get('date'),party:fd.get('customer'),ref:id,amount:total,paid:fd.get('payment')==='Cash basis'?total:0,status:fd.get('payment')==='Cash basis'?'Paid':'Open'});save();closeModal();render();toast('POS sale completed')})}

function pay(id){const x=db.ledger.find(v=>v.id===id),bal=x.amount-x.paid,v=prompt(`Balance: ${money(bal)}\nPayment amount:`,bal.toFixed(2));if(v===null)return;const q=num(v);if(q<=0||q>bal)return toast('Invalid payment','error');x.paid+=q;x.status=x.paid>=x.amount?'Paid':'Open';save();render();toast('Payment recorded')}
function exportInventory(){const rows=[['SKU','Barcode','Item','Category','Sub-category','Brand','Model','Specifications','UOM','Qty','Inventory Cost','Selling Price','Reorder','VAT Variable'],...db.products.map(p=>[p.sku,p.barcode,p.name,p.category,p.subcategory,p.brand,p.model,p.specs,p.uom,totalQty(p),p.cost,p.price,p.reorder,p.variable?'Yes':'No'])];download('joebz-inventory.csv',rows.map(r=>r.map(csv).join(',')).join('\n'),'text/csv')}
function exportTransactions(){const rows=[['Type','Date','Reference','Party','Gross','VAT','Inventory Cost/Total','Payment'],...db.purchases.map(p=>['Purchase',p.date,p.reference,supplier(p.supplierId)?.name||'',p.gross,p.inputVAT,p.inventoryCost,p.payment]),...db.sales.map(s=>['Sale',s.date,s.id,s.customer,s.gross,s.outputVAT,s.total,s.payment])];download('joebz-transactions.csv',rows.map(r=>r.map(csv).join(',')).join('\n'),'text/csv')}
function csv(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}function download(n,d,t){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([d],{type:t}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

function bind(){
 const q=document.getElementById('iq');if(q)q.oninput=filterInventory;
 const c=document.getElementById('ic');if(c)c.onchange=filterInventory;
 const f=document.getElementById('if');if(f)f.onchange=filterInventory;
 const sq=document.getElementById('sq');if(sq)sq.oninput=filterSuppliers;
 document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>action(b.dataset.a,b.dataset.id));
 const form=document.getElementById('modalForm');
 if(form){
  const refreshDocTotals=()=>{const rows=[...form.querySelectorAll('.doc-item-row')];let total=0;rows.forEach(row=>{const line=num(row.querySelector('.doc-item-qty').value)*num(row.querySelector('.doc-item-cost').value);total+=line;row.querySelector('.doc-item-line-total').textContent=money(line)});const count=form.querySelector('#docItemCount'),sum=form.querySelector('#docTotal');if(count)count.textContent=rows.length;if(sum)sum.textContent=money(total)};
  form.addEventListener('click',e=>{const add=e.target.closest('[data-a="addDocItem"]'),remove=e.target.closest('[data-a="removeDocItem"]');if(add){const body=form.querySelector('#docItemsBody');if(!body)return;const p=db.products[0];if(!p)return toast('Add inventory items first','error');body.insertAdjacentHTML('beforeend',purchaseItemRow({productId:p.id,qty:1,uom:p.uom||'Unit',unitCost:p.cost||0,vatFlag:!!p.variable},body.children.length,(selected)=>db.products.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.name)} — ${esc(x.sku)}</option>`).join('')));refreshDocTotals()}else if(remove){const rows=form.querySelectorAll('.doc-item-row');if(rows.length<=1)return toast('At least one item is required','error');remove.closest('tr').remove();refreshDocTotals()}});
  form.addEventListener('input',e=>{if(e.target.matches('.doc-item-qty,.doc-item-cost'))refreshDocTotals()});
  form.addEventListener('change',e=>{if(e.target.matches('.doc-item-product')){const row=e.target.closest('tr'),p=product(e.target.value);if(p){row.querySelector('.doc-item-uom').value=p.uom||'Unit';row.querySelector('.doc-item-cost').value=num(p.cost).toFixed(2);row.querySelector('.doc-item-vat').value=p.variable?'yes':'no';refreshDocTotals()}}});

  ['#purchaseQty','#purchaseUnitCost','#purchaseExempt','#purchaseZero','#purchaseWithholding'].forEach(s=>{const e=form.querySelector(s);if(e)e.addEventListener('input',()=>calcPurchase(form))});
  const si=form.querySelector('#purchaseWithSI');if(si)si.addEventListener('change',()=>calcPurchase(form));
  const pp=form.querySelector('#purchaseProduct');if(pp)pp.addEventListener('change',()=>{const p=product(pp.value);form.querySelector('#purchaseUnitCost').value=num(p?.cost).toFixed(2);calcPurchase(form)});
  const ex=form.querySelector('#purchaseExact');if(ex)ex.addEventListener('input',()=>{const qty=num(form.querySelector('#purchaseQty').value);form.querySelector('#purchaseUnitCost').value=(qty?num(ex.value)/qty:0).toFixed(2);calcPurchase(form)});
 }
}
function action(a,id){
  if(a==='newProduct')openProduct();
  if(a==='editProduct')openProduct(id);
  if(a==='deleteProduct'){if(confirm('Delete this inventory item?')){db.products=db.products.filter(p=>p.id!==id);save();render();toast('Item deleted')}}
  if(a==='newSupplier')openSupplier();
  if(a==='editSupplier')openSupplier(id);
  if(a==='deleteSupplier'){if(confirm('Delete this supplier?')){db.suppliers=db.suppliers.filter(s=>s.id!==id);save();render();toast('Supplier deleted')}}
  if(a==='newPurchase')openPurchase();
  if(a==='newPQ')openPurchaseDocument('pq');
  if(a==='newPO')openPurchaseDocument('po');
  if(a==='newPI')openPurchaseDocument('pi');
  if(a==='editDoc')openPurchaseDocument(id==='x'?'pq':document.querySelector(`[data-a="editDoc"][data-id="${id}"]`)?.dataset.type||'pq',id);
  if(a==='viewDoc')viewPurchaseDocument(document.querySelector(`[data-a="viewDoc"][data-id="${id}"]`)?.dataset.type||'pq',id);
  if(a==='deleteDoc')deletePurchaseDocument(document.querySelector(`[data-a="deleteDoc"][data-id="${id}"]`)?.dataset.type||'pq',id);
  if(a==='copyDoc')copyToMenu(document.querySelector(`[data-a="copyDoc"][data-id="${id}"]`)?.dataset.type||'pq',id);
  if(a==='receivePO')receivePurchaseOrder(id);
  if(a==='printDoc')printPurchaseDocument(document.querySelector(`[data-a="printDoc"][data-id="${id}"]`)?.dataset.type||'pq',id);
  if(a==='exportDoc')exportPurchaseDocument(document.querySelector(`[data-a="exportDoc"][data-id="${id}"]`)?.dataset.type||'pq',id);
  if(a==='newTransfer')openTransfer();
  if(a==='newSale')openSale();
  if(a==='pay')pay(id);
  if(a==='exportInventory')exportInventory();
  if(a==='exportTransactions')exportTransactions();
  if(a==='saveSettings'){db.settings.company=document.getElementById('setCompany').value;db.settings.currency=document.getElementById('setCurrency').value;db.settings.vatRate=num(document.getElementById('setVat').value)||12;save();render();toast('Settings saved')}
  if(a==='resetData'){if(confirm('Reset all data to demo data?')){db=clone(defaultDB);save();render();toast('Demo data restored')}}
}
function filterInventory(){const q=(document.getElementById('iq')?.value||'').toLowerCase(),cat=document.getElementById('ic')?.value||'',st=document.getElementById('if')?.value||'';let a=db.products.filter(p=>{const hay=[p.sku,p.barcode,p.name,p.brand,p.model,p.category,p.subcategory].join(' ').toLowerCase();const okq=!q||hay.includes(q),okc=!cat||p.category===cat,oks=!st||(st==='low'&&totalQty(p)<=p.reorder)||(st==='out'&&totalQty(p)===0);return okq&&okc&&oks});document.querySelector('#it-body').innerHTML=productRows(a)}
function filterSuppliers(){const q=(document.getElementById('sq')?.value||'').toLowerCase();document.querySelector('#st-body').innerHTML=supplierRows(db.suppliers.filter(s=>[s.code,s.name,s.tin,s.address].join(' ').toLowerCase().includes(q)))}

ensureLocations();save();render();
