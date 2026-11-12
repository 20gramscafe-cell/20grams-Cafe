(function(){
  function hasUnsavedChanges(){
    // The in-memory cart is the source of truth while the customer is ordering.
    try{
      if(Array.isArray(window.state?.cart) && window.state.cart.length > 0)return true;
    }catch(e){}
    // Keep compatibility with any cart items rendered in the page.
    const cartItems=document.querySelectorAll("#cartItems .cart-item, #cartItems [data-cart-item]");
    if(cartItems.length)return true;
    // Warn if the customer has typed checkout details or an order note.
    const fields=["customerName","customerPhone","orderNote"];
    return fields.some(function(id){
      const el=document.getElementById(id);
      return !!(el && typeof el.value==="string" && el.value.trim());
    });
  }
  window.addEventListener("beforeunload",function(e){
    if(!hasUnsavedChanges())return;
    e.preventDefault();
    // Modern browsers show their own standard confirmation message.
    e.returnValue="";
  });
})();