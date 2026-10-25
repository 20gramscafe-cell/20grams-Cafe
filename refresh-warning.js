(function(){
  function hasUnsavedChanges(){
    try{
      const cart=JSON.parse(localStorage.getItem("20grams_cart")||"null");
      if(Array.isArray(cart)&&cart.length)return true;
    }catch(e){}
    const cartItems=document.querySelectorAll("#cartItems .cart-item, #cartItems [data-cart-item]");
    if(cartItems.length)return true;
    const name=document.getElementById("customerName");
    const phone=document.getElementById("customerPhone");
    const note=document.getElementById("orderNote");
    if(name&&name.value.trim())return true;
    if(phone&&phone.value.trim())return true;
    if(note&&note.value.trim())return true;
    return false;
  }
  window.addEventListener("beforeunload",function(e){
    if(!hasUnsavedChanges())return;
    e.preventDefault();
    e.returnValue="";
  });
})();