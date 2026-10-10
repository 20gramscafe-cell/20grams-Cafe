/* 20grams Cafe public admin entrypoint. The backend gateway is responsible for the single-device admin lock. */
(function(){
  const script=document.createElement('script');
  script.src='admin-core.js?v=2026101001';
  script.defer=true;
  document.head.appendChild(script);
})();
