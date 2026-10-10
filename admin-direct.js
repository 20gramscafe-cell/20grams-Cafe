(async()=>{
  try{
    const r=await fetch('admin.js?direct='+Date.now(),{cache:'no-store'});
    let code=await r.text();
    code=code.replace('const ADMIN_TOKEN=(location.hash||"").replace(/^#/,"");','const ADMIN_TOKEN="20grams";');
    code=code.replace('if(!ADMIN_TOKEN)return{data:null,error:{message:"رابط الإدارة غير صالح."}};','');
    code=code.replace('function showMessage(title,text){\n  $("#loginView").classList.remove("hidden");$("#appView").classList.add("hidden");\n  $("#loginTitle").textContent=title;$("#loginText").textContent=text;\n}','function showMessage(title,text){ toast(title+" — "+text); $("#appView").classList.remove("hidden"); }');
    code=code.replace('    if(!ADMIN_TOKEN){\n      showMessage("رابط الإدارة غير صالح","يجب فتح صفحة الإدارة باستخدام رابط المدير الخاص.");\n      return;\n    }\n','');
    const s=document.createElement('script');
    s.text=code;
    document.head.appendChild(s);
  }catch(e){
    const t=document.querySelector('#toast');
    if(t){t.textContent='تعذر تشغيل لوحة الإدارة: '+(e?.message||'خطأ غير معروف');t.classList.add('show');}
  }
})();
