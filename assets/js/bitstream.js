/* Animated ASN.1 UPER bitstream.
   Bits stream past a fixed parse head; fields are bracketed and named as they
   are consumed. Cyan = field contained in one byte, amber = field straddling a
   byte boundary, which is the case UPER makes routine and parsers get wrong. */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TYPES = [
    ['SEQUENCE',3],['BOOLEAN',1],['INTEGER(0..255)',8],['LENGTH',7],
    ['CHOICE',2],['ENUMERATED',3],['BIT STRING',12],['INTEGER(0..7)',3],
    ['OCTET STRING',16],['INTEGER(0..15)',4],['OPTIONAL',1],['CONSTRAINED',5],
    ['EXTENSION',1],['INTEGER(0..63)',6]
  ];
  var MONO = '"Red Hat Mono",ui-monospace,monospace';

  function hash(n){
    var x=(n^0x9E3779B9)>>>0;
    x=Math.imul(x^(x>>>16),0x85EBCA6B)>>>0;
    x=Math.imul(x^(x>>>13),0xC2B2AE35)>>>0;
    return (x^(x>>>16))>>>0;
  }

  function Stream(seed){ this.seed=seed|0; this.fields=[]; this.end=0; this.idx=0; }
  Stream.prototype.bit=function(i){ return hash(i*2+1+this.seed*7919)&1; };
  Stream.prototype.ensure=function(limit){
    while(this.end<limit){
      var t=TYPES[hash(this.idx+7717+this.seed*131)%TYPES.length];
      this.fields.push({start:this.end,w:t[1],name:t[0],
        straddle:Math.floor(this.end/8)!==Math.floor((this.end+t[1]-1)/8)});
      this.end+=t[1]; this.idx++;
    }
  };
  Stream.prototype.prune=function(before){
    while(this.fields.length && this.fields[0].start+this.fields[0].w<before)
      this.fields.shift();
  };
  Stream.prototype.reset=function(){ this.fields.length=0; this.end=0; this.idx=0; };

  function drawTrack(ctx,W,s,o){
    var cw=o.cellW, rowY=o.rowY, headX=o.headX, off=o.offset;
    function xOf(b){ return headX+(b-off)*cw; }
    var lead=Math.ceil((W-headX)/cw)+2, trail=Math.ceil(headX/cw)+2;
    var b0=Math.max(0,Math.floor(off)-trail), b1=Math.floor(off)+lead;
    s.ensure(b1+64); s.prune(b0-400);
    ctx.globalAlpha=o.alpha;

    if(o.detail){
      ctx.strokeStyle='rgba(79,209,197,.26)'; ctx.lineWidth=1;
      ctx.font='400 '+Math.max(8,cw*0.36).toFixed(1)+'px '+MONO;
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle='#6A8189';
      for(var b=Math.ceil(b0/8)*8;b<=b1;b+=8){
        var xt=xOf(b); if(xt<-40||xt>W+40) continue;
        ctx.beginPath(); ctx.moveTo(Math.round(xt)+.5,rowY-30);
        ctx.lineTo(Math.round(xt)+.5,rowY+28); ctx.stroke();
        ctx.fillText('byte '+(b/8),xt,rowY-40);
      }
      for(var f=0;f<s.fields.length;f++){
        var fl=s.fields[f];
        if(fl.start>off||fl.start+fl.w<b0||fl.start>b1) continue;
        var x0=xOf(fl.start), x1=xOf(Math.min(fl.start+fl.w,off));
        if(x1<-60||x0>W+60) continue;
        var col=fl.straddle?'240,168,104':'79,209,197';
        ctx.fillStyle='rgba('+col+',.12)'; ctx.fillRect(x0,rowY-19,x1-x0,38);
        ctx.strokeStyle='rgba('+col+',.72)'; ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(x0+.5,rowY+19); ctx.lineTo(x0+.5,rowY+25);
        ctx.lineTo(x1-.5,rowY+25); ctx.lineTo(x1-.5,rowY+19); ctx.stroke();
        if(fl.start+fl.w<=off && (x1-x0)>cw*1.2){
          var age=Math.min(1,(off-(fl.start+fl.w))/2.2);
          ctx.globalAlpha=o.alpha*age;
          ctx.font='400 '+Math.max(8.5,cw*0.38).toFixed(1)+'px '+MONO;
          ctx.fillStyle=fl.straddle?'#F5BE87':'#7FD8CE';
          ctx.textAlign='center'; ctx.textBaseline='top';
          ctx.fillText(fl.name,(x0+x1)/2,rowY+31);
          ctx.globalAlpha=o.alpha;
        }
      }
    }

    ctx.font='500 '+(cw*0.62).toFixed(1)+'px '+MONO;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    var fi=0;
    for(var i=b0;i<=b1;i++){
      var x=xOf(i); if(x<-cw||x>W+cw) continue;
      if(i<off){
        while(fi<s.fields.length && s.fields[fi].start+s.fields[fi].w<=i) fi++;
        var cur=s.fields[fi];
        ctx.fillStyle=(cur&&cur.straddle)?'#F0A868':'#4FD1C5';
      } else ctx.fillStyle='#5A7178';
      ctx.fillText(s.bit(i)?'1':'0',x+cw/2,rowY);
    }

    if(o.detail){
      ctx.strokeStyle='rgba(79,209,197,.8)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(Math.round(headX)+.5,rowY-50);
      ctx.lineTo(Math.round(headX)+.5,rowY+50); ctx.stroke();
      ctx.fillStyle='#4FD1C5';
      ctx.beginPath(); ctx.moveTo(headX-4.5,rowY-50); ctx.lineTo(headX+4.5,rowY-50);
      ctx.lineTo(headX,rowY-43); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  function fadeEdges(ctx,W,H){
    var g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(.035,'rgba(0,0,0,0)');
    g.addColorStop(.965,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,1)');
    ctx.globalCompositeOperation='destination-out';
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
  }

  function fit(canvas,ctx){
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var r=canvas.getBoundingClientRect();
    canvas.width=Math.round(r.width*dpr); canvas.height=Math.round(r.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {W:r.width,H:r.height};
  }

  /* ---- paper page: full-bleed background, three tracks ---- */
  function initBackground(canvas){
    var ctx=canvas.getContext('2d');
    var tracks=[
      {s:new Stream(1),yf:.20,cwf:1.00,sp:1.00,a:.82},
      {s:new Stream(2),yf:.50,cwf:1.16,sp:0.68,a:.62},
      {s:new Stream(3),yf:.80,cwf:0.88,sp:1.34,a:.76}
    ];
    var W=0,H=0,cell=24,head=0,off=0,boost=0,last=0,raf=0;

    function resize(){
      var d=fit(canvas,ctx); W=d.W; H=d.H;
      cell = W<640?15:(W<1000?19:24);
      head = W*(W<640?.24:.32);
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<tracks.length;i++){
        var t=tracks[i];
        drawTrack(ctx,W,t.s,{cellW:cell*t.cwf,rowY:H*t.yf,headX:head,
          offset:off*t.sp,alpha:t.a,detail:true});
      }
      fadeEdges(ctx,W,H);
    }
    function frame(t){
      if(!last) last=t;
      var dt=Math.min((t-last)/1000,.05); last=t;
      off += dt*(2.6+boost);
      boost *= Math.exp(-dt*2.0);
      draw();
      raf=requestAnimationFrame(frame);
    }

    resize();
    // Arriving on this page starts the parse: it rips through the stream and
    // decelerates into an ambient crawl.
    off=0; boost=reduce?0:46;
    tracks.forEach(function(t){ t.s.reset(); });
    if(reduce){ off=120; draw(); }
    else raf=requestAnimationFrame(frame);
    requestAnimationFrame(function(){ canvas.classList.add('lit'); });

    window.addEventListener('resize',function(){ resize(); draw(); },{passive:true});
    document.addEventListener('visibilitychange',function(){
      if(reduce) return;
      if(document.hidden){ if(raf){cancelAnimationFrame(raf); raf=0;} }
      else if(!raf){ last=0; raf=requestAnimationFrame(frame); }
    });
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){resize();draw();});
  }

  /* ---- home page: quiet strip inside the paper card ---- */
  function initStrip(canvas){
    var ctx=canvas.getContext('2d');
    var s=new Stream(9), W=0,H=0,off=0,last=0,raf=0;
    function resize(){ var d=fit(canvas,ctx); W=d.W; H=d.H; }
    function draw(){
      ctx.clearRect(0,0,W,H);
      drawTrack(ctx,W,s,{cellW:13,rowY:H/2,headX:W*.34,offset:off,alpha:.85,detail:false});
      fadeEdges(ctx,W,H);
    }
    function frame(t){
      if(!last) last=t;
      var dt=Math.min((t-last)/1000,.05); last=t;
      off+=dt*2.2; draw();
      raf=requestAnimationFrame(frame);
    }
    resize();
    if(reduce){ off=60; draw(); }
    else raf=requestAnimationFrame(frame);
    window.addEventListener('resize',function(){ resize(); draw(); },{passive:true});
    document.addEventListener('visibilitychange',function(){
      if(reduce) return;
      if(document.hidden){ if(raf){cancelAnimationFrame(raf); raf=0;} }
      else if(!raf){ last=0; raf=requestAnimationFrame(frame); }
    });
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){resize();draw();});
  }

  function boot(){
    var bg=document.getElementById('bg');     if(bg) initBackground(bg);
    var st=document.getElementById('strip');  if(st) initStrip(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
