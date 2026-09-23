(function(){
  'use strict';

  /* Section menu: highlight the link for the section currently in view, and
     keep that link scrolled into view when the menu overflows on narrow screens. */
  var bar=document.querySelector('.menu .in');
  if(bar && 'IntersectionObserver' in window){
    var links={};
    bar.querySelectorAll('a[href^="#"]').forEach(function(a){ links[a.hash.slice(1)]=a; });

    var activate=function(id){
      var a=links[id]; if(!a||a.classList.contains('on')) return;
      for(var k in links) links[k].classList.remove('on');
      a.classList.add('on');
      bar.scrollTo({left:a.offsetLeft-bar.offsetLeft-(bar.clientWidth-a.offsetWidth)/2,behavior:'smooth'});
    };

    // A section counts as current once it crosses a line just below the menu.
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) activate(e.target.id); });
    },{rootMargin:'-80px 0px -60% 0px'});
    Object.keys(links).forEach(function(id){
      var s=document.getElementById(id); if(s) io.observe(s);
    });

    // The last sections are too short to reach the line at the bottom of the page.
    window.addEventListener('scroll',function(){
      if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)
        activate(Object.keys(links).pop());
    },{passive:true});
  }

  /* Scrolling lists: fade the bottom edge only while there is more to scroll. */
  document.querySelectorAll('.scroll').forEach(function(el){
    var update=function(){
      el.classList.toggle('more',el.scrollTop+el.clientHeight<el.scrollHeight-2);
    };
    el.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    update();
  });

  /* Copy buttons for code blocks. */
  document.querySelectorAll('.code').forEach(function(box){
    var pre=box.querySelector('pre'); if(!pre) return;
    var btn=document.createElement('button');
    btn.type='button'; btn.className='copy'; btn.textContent='Copy';
    btn.setAttribute('aria-label','Copy BibTeX to clipboard');
    btn.addEventListener('click',function(){
      var text=pre.textContent, done=function(){
        btn.textContent='Copied'; btn.classList.add('done');
        setTimeout(function(){ btn.textContent='Copy'; btn.classList.remove('done'); },1600);
      };
      if(navigator.clipboard && window.isSecureContext){
        navigator.clipboard.writeText(text).then(done,fallback);
      } else fallback();
      function fallback(){
        var ta=document.createElement('textarea');
        ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        try{ document.execCommand('copy'); done(); }catch(e){}
        document.body.removeChild(ta);
      }
    });
    box.appendChild(btn);
  });
})();
