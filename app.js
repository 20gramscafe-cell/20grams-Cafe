const SUPABASE_URL="https://qnkddysjbiauplefuxaq.supabase.co";
const SUPABASE_KEY="";
function restBuilder(table,method="GET",payload=null){
 let selectText="*";let filters=[];let orderText="";let limitValue=null;let wantSingle=false;let returnRep=false;
 async function run(){
  try{
   let url=SUPABASE_URL+"/rest/v1/"+table;
   const q=[];
   if(method==="GET")q.push("select="+encodeURIComponent(selectText));
   filters.forEach(x=>q.push(x));if(orderText)q.push("order="+orderText);if(limitValue)q.push("limit="+limitValue);
   if(q.length)url+="?"+q.join("&");
   const headers={"Content-Type":"application/json"};
   if(method==="POST")headers.Prefer=returnRep?"return=representation":"return=minimal";
   const res=await fetch(url,{method,headers,body:method==="POST"?JSON.stringify(payload):undefined});
   const raw=await res.text();let data=raw?JSON.parse(raw):null;
   if(!res.ok)return {data:null,error:{message:data?.message||data?.error||raw||("HTTP "+res.status),code:data?.code}};
   if(wantSingle&&Array.isArray(data)){
    if(data.length===0)return {data:null,error:null};
    if(data.length>1)return {data:null,error:{message:"Multiple rows returned"}};
    data=data[0];
   }
   return {data,error:null};
  }catch(error){return {data:null,error}};
 }
 const api={
  select(cols="*"){selectText=cols;if(method==="POST")returnRep=true;return api},
  eq(col,val){filters.push(col+"=eq."+encodeURIComponent(String(val)));return api},
  is(col,val){filters.push(col+"=is."+String(val));return api},
  order(col,opts={}){orderText=col+(opts.ascending===false?".desc":".asc");return api},
  limit(n){limitValue=n;return api},
  maybeSingle(){wantSingle=true;return run()},
  single(){wantSingle=true;return run()},
  then(resolve,reject){return run().then(resolve,reject)}
 };
 return api;
}
const db={
 from(table){
  return {
   select(cols="*"){return restBuilder(table,"GET").select(cols)},
   insert(payload){return restBuilder(table,"POST",payload)}
  };
 },
 functions:{async invoke(name,{body}={}){try{const res=await fetch(SUPABASE_URL+"/functions/v1/"+name,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await res.json().catch(()=>null);return res.ok?{data,error:null}:{data:null,error:{message:data?.error||"Function request failed"}}}catch(error){return {data:null,error}}}}
};
const state={settings:null,categories:[],products:[],groups:[],modifiers:[],links:[],category:null,cart:[],trackingToken:null,trackingTimer:null,trackingTokens:[],myOrdersSignature:null};
function loadTrackingTokens(){try{const x=JSON.parse(localStorage.getItem("as_cafe_order_tokens")||"[]");state.trackingTokens=Array.isArray(x)?x.slice(0,20):[]}catch(e){state.trackingTokens=[]}}
function saveTrackingToken(token,orderNumber){if(!token)return;state.trackingTokens=[{token:token,order_number:orderNumber||null},...state.trackingTokens.filter(function(x){return x.token!==token})].slice(0,20);try{localStorage.setItem("as_cafe_order_tokens",JSON.stringify(state.trackingTokens))}catch(e){}renderTrackingBadge()}
function renderTrackingBadge(){const b=$("#ordersCount");if(b)b.textContent=state.trackingTokens.length}
async function fetchTrackedOrder(entry){const r=await db.functions.invoke("customer-gateway",{body:{action:"get_order",token:entry.token}});return r.error||!r.data?.order?null:r.data.order}
async function renderMyOrders(){
 const box=$("#myOrdersList");if(!box)return;
 const rows=await Promise.all(state.trackingTokens.map(fetchTrackedOrder));
 const valid=rows.map(function(o,n){return {order:o,entry:state.trackingTokens[n]}}).filter(function(x){return x.order});
 const signature=JSON.stringify(valid.map(function(x){const o=x.order;return {token:x.entry.token,order_number:o.order_number||x.entry.order_number||"----",status:o.status,created_at:o.created_at,estimated_ready_at:o.estimated_ready_at||null}}));
 if(signature===state.myOrdersSignature)return;
 state.myOrdersSignature=signature;
 if(!valid.length){
  box.innerHTML='<div class="empty">مفيش طلبات محفوظة على الجهاز لحد دلوقتي.<br>بعد ما تعمل طلب هتلاقيه هنا تلقائيًا.</div>';
  return;
 }
 box.innerHTML=valid.map(function(x){const o=x.order;return '<article class="tracked-order"><div class="tracked-order-head"><strong>#'+esc(o.order_number||x.entry.order_number||"----")+'</strong><span>تيك أواي</span></div><div class="tracked-status">'+esc(statusLabel(o.status))+'</div><div class="tracked-meta"><span>وقت الطلب<br><b>'+new Date(o.created_at).toLocaleString("ar-EG",{dateStyle:"short",timeStyle:"short"})+'</b></span><span>المتوقع<br><b>'+(o.estimated_ready_at?new Date(o.estimated_ready_at).toLocaleString("ar-EG",{dateStyle:"short",timeStyle:"short"}):"لم يتم تحديده")+'</b></span></div><button class="track-open" data-token="'+esc(x.entry.token)+'">متابعة الطلب</button></article>'}).join("");
 box.querySelectorAll("[data-token]").forEach(function(b){b.onclick=function(){state.trackingToken=b.dataset.token;closeModal("myOrdersModal");$("#customerInvoice").innerHTML="";$("#successModal").classList.remove("hidden");refreshCustomerOrder();if(state.trackingTimer)clearInterval(state.trackingTimer);state.trackingTimer=setInterval(refreshCustomerOrder,4000)}});
}
async function refreshMyOrders(){if(!$("#myOrdersModal")||$("#myOrdersModal").classList.contains("hidden"))return;await renderMyOrders()}
function openMyOrders(){renderMyOrders();$("#myOrdersModal").classList.remove("hidden");if(state.trackingTimer)clearInterval(state.trackingTimer);state.trackingTimer=setInterval(refreshMyOrders,4000)}
const $=s=>document.querySelector(s);
const money=n=>Number(n||0).toFixed(2)+" EGP";
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
function imgUrl(p){return p.image_url||"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"}
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]})}
async function loadQuery(label,query){
 try{
  const result=await Promise.race([
   query,
   new Promise(function(resolve){setTimeout(function(){resolve({data:null,error:{message:"انتهت مهلة تحميل "+label}})},10000)})
  ]);
  if(result.error)console.error("20grams Cafe load failure:",label,result.error);
  return {label:label,data:result.data,error:result.error||null};
 }catch(error){console.error("20grams Cafe load exception:",label,error);return {label:label,data:null,error:error}}
}
async function init(){
 loadTrackingTokens();renderTrackingBadge();
 const menuResult=await loadQuery("المنيو",db.functions.invoke("customer-gateway",{body:{action:"get_menu"}}).then(function(r){return r.error?{data:null,error:r.error}:{data:r.data||null,error:null}}));
 state.settings=menuResult.data?.settings||{tax_percent:14,service_percent:8,cafe_name:"20grams Cafe"};
 state.categories=menuResult.data?.categories||[];state.products=menuResult.data?.products||[];state.groups=menuResult.data?.groups||[];state.modifiers=menuResult.data?.modifiers||[];state.links=menuResult.data?.links||[];
 $("#taxRate").textContent=state.settings.tax_percent;$("#serviceRate").textContent=state.settings.service_percent;
 renderCategories();renderProducts();updateCart();
 if(menuResult.error){console.error("20grams Cafe data loading failures:",[menuResult]);toast("تعذر تحميل المنيو بالكامل؛ حاول تحديث الصفحة.");}
}
function renderCategories(){
 let html='<button class="chip '+(!state.category?"active":"")+'" data-cat="">الكل</button>';
 html+=state.categories.map(function(c){return '<button class="chip '+(state.category===c.id?"active":"")+'" data-cat="'+c.id+'">'+esc(c.icon||"•")+" "+esc(c.name)+"</button>"}).join("");
 $("#categories").innerHTML=html;
 document.querySelectorAll("[data-cat]").forEach(function(b){b.onclick=function(){state.category=b.dataset.cat||null;renderCategories();renderProducts()}});
}
function renderProducts(){
 const list=state.products.filter(function(p){return !state.category||p.category_id===state.category});
 $("#products").innerHTML=list.length?list.map(function(p){
  const image=imgUrl(p).replace(/'/g,"%27");
  return `
   <article class="product">
    <div class="product-img" style="background-image:url('${image}')"></div>
    <div class="product-body">
     <h3>${esc(p.name)}</h3>
     <p>${esc(p.description||"اختيار فاخر من 20grams Cafe.")}</p>
     <div class="price-row"><span class="price">${money(p.price)}${p.price_unit==="kg"?" / كجم":""}</span><button class="add" data-product="${p.id}">+</button></div>
    </div>
   </article>`;
 }).join(""):'<div class="empty">لا توجد منتجات في هذا القسم.</div>';
 $("#products").onclick=function(e){const b=e.target.closest("[data-product]");if(!b)return;e.preventDefault();e.stopPropagation();openProduct(b.dataset.product)};
}
function openProduct(id){
 const p=state.products.find(function(x){return x.id===id}); if(!p)return;
 const groupIds=state.links.filter(function(x){return x.product_id===id}).map(function(x){return x.group_id});
 const groups=state.groups.filter(function(g){return groupIds.includes(g.id)}), hasModifiers=groups.length>0;
 const groupsHtml=groups.map(function(g){const opts=state.modifiers.filter(function(m){return m.group_id===g.id && m.active!==false}).map(function(m){return '<button type="button" class="mod-option" data-group="'+g.id+'" data-mod="'+m.id+'" data-min="'+Number(g.min_select||0)+'">'+esc(m.name)+' · '+money(Number(p.price)+Number(m.price_delta||0))+(p.price_unit==="kg"?" / كجم":"")+"</button>"}).join("");return '<div class="mod-group"><div class="mod-head"><b>'+esc(g.name)+'</b><small>'+(Number(g.min_select||0)>0?"إجباري":"اختياري")+(g.max_select===1?" · اختيار واحد":" · اختيارات")+'</small></div><div class="mod-options">'+opts+"</div></div>"}).join("");
 const qtyHtml='<div class="product-qty"><span>'+(p.price_unit==="kg"?"الوزن بالكيلو":"الكمية")+'</span><div class="qty"><button type="button" id="productQtyMinus">−</button><b id="productQty">'+(p.price_unit==="kg"?"0.1":"1")+'</b><button type="button" id="productQtyPlus">+</button></div></div>';
 const noteHtml=p.notes_enabled?'<label class="product-note"><span>ملاحظات على المنتج (اختياري)</span><textarea id="productNote" maxlength="500" placeholder="مثلاً: بدون سكر، سخن، ..."></textarea></label>':"";
 $("#productModalBody").innerHTML='<div class="modal-product-img" style="background-image:url(\''+imgUrl(p).replace(/\\x27/g,"%27")+'\')"></div><span class="eyebrow">20grams Cafe SELECTION</span><h2>'+esc(p.name)+'</h2><p>'+esc(p.description||"اختيار فاخر من 20grams Cafe.")+'</p>'+groupsHtml+qtyHtml+noteHtml+'<button class="primary-btn" id="addConfigured">إضافة للسلة · '+money(p.price)+"</button>";
 function refreshConfiguredPrice(){const selected=[...document.querySelectorAll(".mod-option.selected")].map(function(x){return state.modifiers.find(function(m){return m.id===x.dataset.mod})}).filter(Boolean);const total=Number(p.price)+selected.reduce(function(s,m){return s+Number(m.price_delta||0)},0);const addButton=$("#addConfigured");if(addButton)addButton.textContent="إضافة للسلة · "+money(total)+(p.price_unit==="kg"?" / كجم":"")}document.querySelectorAll(".mod-option").forEach(function(btn){btn.onclick=function(){const g=state.groups.find(function(x){return x.id===btn.dataset.group});if(g.max_select===1)document.querySelectorAll('[data-group="'+g.id+'"]').forEach(function(x){x.classList.remove("selected")});btn.classList.toggle("selected");refreshConfiguredPrice()}});
 let qty=p.price_unit==="kg"?0.1:1;const qtyStep=p.price_unit==="kg"?0.1:1;$("#productQtyMinus").onclick=function(){qty=Math.max(qtyStep,Math.round((qty-qtyStep)*10)/10);$("#productQty").textContent=Number(qty.toFixed(1))};$("#productQtyPlus").onclick=function(){qty=Math.min(50,Math.round((qty+qtyStep)*10)/10);$("#productQty").textContent=Number(qty.toFixed(1))};
 $("#addConfigured").onclick=function(){const selected=[...document.querySelectorAll(".mod-option.selected")].map(function(x){return state.modifiers.find(function(m){return m.id===x.dataset.mod})}).filter(Boolean);const requiredGroups=groups.filter(function(g){return Number(g.min_select||0)>0});const missing=requiredGroups.some(function(g){return !selected.some(function(m){return m.group_id===g.id})});if(missing){toast("اختار حجم العبوة الأول");return}const total=Number(p.price)+selected.reduce(function(s,m){return s+Number(m.price_delta||0)},0);state.cart.push({key:(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random()),product:p,qty:qty,mods:selected,unit:total,note:p.notes_enabled?(($("#productNote").value||"").trim()):""});updateCart();closeModal("productModal");toast("تمت الإضافة إلى السلة")};
 $("#productModal").classList.remove("hidden");
}
function closeModal(id){$("#"+id).classList.add("hidden")}
function updateCart(){
 $("#cartCount").textContent=state.cart.length;
 const subtotal=state.cart.reduce(function(s,i){return s+i.unit*i.qty},0);
 const tax=subtotal*Number(state.settings?.tax_percent||0)/100;
 const service=subtotal*Number(state.settings?.service_percent||0)/100;
 $("#subtotal").textContent=money(subtotal);$("#tax").textContent=money(tax);$("#service").textContent=money(service);$("#total").textContent=money(subtotal+tax+service);
 $("#cartItems").innerHTML=state.cart.length?state.cart.map(function(i){
  return `
   <div class="cart-item">
    <div class="cart-item-top"><div><h4>${esc(i.product.name)}</h4><small>${esc(i.product.price_unit==="kg"?"سعر الكيلو · "+money(i.unit):money(i.unit))} · ${esc(i.mods.map(function(m){return m.name}).join(" · ")||"بدون إضافات")}${i.note?" · "+esc(i.note):""}</small></div><b>${money(i.unit*i.qty)}</b></div>
    <div class="qty">${i.mods.length?"<b>1</b>":"<button data-minus=\""+i.key+"\">−</button><b>"+i.qty+"</b><button data-plus=\""+i.key+"\">+</button>"}<button data-remove="${i.key}" style="margin-right:auto;color:#e88989">حذف</button></div>
   </div>`;
 }).join(""):'<div class="empty">السلة فارغة.<br>اختار حاجة تحبها من المنيو ☕</div>';
 document.querySelectorAll("[data-minus]").forEach(function(b){b.onclick=function(){changeQty(b.dataset.minus,-1)}});
 document.querySelectorAll("[data-plus]").forEach(function(b){b.onclick=function(){changeQty(b.dataset.plus,1)}});
 document.querySelectorAll("[data-remove]").forEach(function(b){b.onclick=function(){state.cart=state.cart.filter(function(x){return x.key!==b.dataset.remove});updateCart()}});
}
function changeQty(key,d){const i=state.cart.find(function(x){return x.key===key});if(!i)return;const step=i.product.price_unit==="kg"?0.1:1;i.qty=Math.round((i.qty+d*step)*10)/10;if(i.qty<step)i.qty=step;updateCart()}
function openCart(){$("#cartDrawer").classList.add("open");$("#drawerBackdrop").classList.add("show")}
function closeCart(){$("#cartDrawer").classList.remove("open");$("#drawerBackdrop").classList.remove("show")}
function statusLabel(s){return({new:"جديد — وصل للكاشير",confirmed:"تم تأكيد الطلب",preparing:"جاري التحضير",ready:"الطلب جاهز",served:"تم التقديم",completed:"مكتمل",cancelled:"تم إلغاء الطلب"})[s]||s}
function renderCustomerInvoice(order, cartItems){
 const box=$("#customerInvoice"); if(!box)return;
 const items=Array.isArray(cartItems)?cartItems:[];
 const subtotal=items.reduce(function(s,i){return s+Number(i.unit||0)*Number(i.qty||1)},0);
 const taxPercent=Number(order?.tax_percent ?? state.settings?.tax_percent ?? 0);
 const servicePercent=Number(order?.service_percent ?? state.settings?.service_percent ?? 0);
 const tax=Number(order?.tax_amount ?? subtotal*taxPercent/100);
 const service=Number(order?.service_amount ?? subtotal*servicePercent/100);
 const total=Number(order?.total ?? subtotal+tax+service);
 const rows=items.map(function(i){
  const mods=i.mods&&i.mods.length?'<div class="customer-invoice-mod">'+i.mods.map(function(m){return esc(m.name)+(Number(m.price_delta)?' · +'+money(m.price_delta):"")}).join(" · ")+'</div>':"";
  const note=i.note?'<div class="customer-invoice-note">ملاحظة: '+esc(i.note)+'</div>':"";
  return '<div class="customer-invoice-item"><div><b>'+esc(i.product.name)+'</b><small>'+(i.product.price_unit==="kg"?Number(i.qty||0).toFixed(1)+" كجم":Number(i.qty||1)+" ×")+' × '+money(i.unit)+'</small>'+mods+note+'</div><strong>'+money(Number(i.unit)*Number(i.qty||1))+'</strong></div>';
 }).join("");
 const orderNumber=esc(order?.order_number||"----");
 const orderDate=order?.created_at?new Date(order.created_at).toLocaleDateString("ar-EG"):"—";
 const orderTime=order?.created_at?new Date(order.created_at).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"—";
 box.innerHTML='<div class="customer-invoice-title">🧾 تفاصيل الفاتورة</div><div class="customer-invoice-meta"><span>رقم الطلب <b>#'+orderNumber+'</b></span><span>📅 '+orderDate+'</span><span>🕐 '+orderTime+'</span></div>'+rows+'<div class="customer-invoice-totals"><div><span>المجموع الفرعي</span><b>'+money(subtotal)+'</b></div><div><span>الضريبة ('+taxPercent+'%)</span><b>'+money(tax)+'</b></div><div><span>الخدمة ('+servicePercent+'%)</span><b>'+money(service)+'</b></div><div class="customer-invoice-total"><span>الإجمالي</span><strong>'+money(total)+'</strong></div></div>';
}
async function refreshCustomerOrder(){if(!state.trackingToken)return;const r=await db.functions.invoke("customer-gateway",{body:{action:"get_order",token:state.trackingToken}});if(r.error||!r.data?.order)return;const o=r.data.order;$("#successNumber").textContent="#"+(o.order_number||"----");$("#customerStatus").textContent=statusLabel(o.status);$("#customerStaff").textContent=(o.assigned_staff_name||"لم يبدأ التجهيز بعد")+(o.assigned_at?" · "+new Date(o.assigned_at).toLocaleString("ar-EG",{dateStyle:"short",timeStyle:"short"}):"");$("#customerCreated").textContent=new Date(o.created_at).toLocaleString("ar-EG",{dateStyle:"short",timeStyle:"short"});$("#customerEta").textContent=o.estimated_ready_at?new Date(o.estimated_ready_at).toLocaleString("ar-EG",{dateStyle:"short",timeStyle:"short"}):"لم يتم تحديده";if(o.status==="completed"||o.status==="cancelled"){clearInterval(state.trackingTimer);state.trackingTimer=null}}
async function sendOrder(){
 if(!state.cart.length)return toast("السلة فارغة");
 const customerName=$("#customerName").value.trim();
 if(!customerName)return toast("اسم الزبون مطلوب قبل تأكيد الطلب");
 const btn=$("#sendOrder");btn.disabled=true;btn.textContent="جاري إرسال الطلب…";

 const payload={
  action:"create_order",
  customer_name:customerName,
  customer_phone:$("#customerPhone").value.trim()||null,
  customer_note:$("#orderNote").value.trim()||null,
  items:state.cart.map(function(i){return {
   product_id:i.product.id,
   quantity:i.qty,
   modifier_ids:i.mods.map(function(m){return m.id}),notes:i.note||null
  }})
 };

 const created=await db.functions.invoke("customer-gateway",{body:payload});
 if(created.error||!created.data?.order){
  console.error(created.error||created.data);
  btn.disabled=false;btn.textContent="إرسال الطلب →";
  return toast(created.error?.message||created.data?.error||"حصل خطأ أثناء إرسال الطلب");
 }

 closeCart();
 $("#successNumber").textContent="#"+created.data.order.order_number; renderCustomerInvoice(created.data.order, state.cart);
 state.trackingToken=created.data.tracking_token;
 saveTrackingToken(created.data.tracking_token,created.data.order.order_number);
 $("#successModal").classList.remove("hidden");
 state.cart=[];$("#orderNote").value="";$("#customerName").value="";$("#customerPhone").value="";
 updateCart();btn.disabled=false;btn.textContent="إرسال الطلب →";
 await refreshCustomerOrder();
 if(state.trackingTimer)clearInterval(state.trackingTimer);
 state.trackingTimer=setInterval(refreshCustomerOrder,4000);
}
$("#cartBtn").onclick=openCart;$("#closeCart").onclick=closeCart;$("#drawerBackdrop").onclick=closeCart;$("#sendOrder").onclick=sendOrder;function dismissOrderReceipt(){closeModal("successModal");state.trackingToken=null;if(state.trackingTimer)clearInterval(state.trackingTimer);state.trackingTimer=null;}$("#newOrder").onclick=dismissOrderReceipt;const doneOrderButton=$("#doneOrder");if(doneOrderButton)doneOrderButton.onclick=dismissOrderReceipt;$("#ordersBtn").onclick=openMyOrders;$("#closeMyOrders").onclick=function(){closeModal("myOrdersModal");if(state.trackingTimer)clearInterval(state.trackingTimer);state.trackingTimer=null;};$("#closeProduct").onclick=function(){closeModal("productModal")};init();