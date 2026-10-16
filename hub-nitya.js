/* ═══════════════════════════════════════════════════════════════════
   SARVAGYA HUB — Nitya Niyam + Kids' Daily Rituals
   Loaded by sarvagya-hub.html via a single <script src> line before </body>.

   Kept in its own file deliberately. sarvagya-hub.html is 335 KB and
   3,759 lines; GitHub's web editor already struggles to open it, and
   every further kilobyte makes it worse. A separate file also means
   this change can be read, reviewed and reverted on its own instead of
   as a diff buried in a file that size.

   Additive only. It overwrites nothing in the page — same pattern as
   the three appended IIFE blocks already at lines 3681 / 3724 / 3743.
   If it ever misbehaves: delete the one <script src> line and the page
   is exactly as it was.

   Built 2026-10-16 for Vrinda (b. 23 Jun 2022) and Vedant (b. 18 Feb 2024).
   Verified by hub/test-hub-patch.js — 32 checks against a simulated Hub.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── CSS the page already references but never defined ───────────────
   --card / --fg / --border / --muted / --accent are used by the Neeta
   modal, the Activity modal and the PIN box, and resolve to nothing,
   which is why that markup renders unstyled. .btn-s is used ~15 times
   and was never defined either. Mapped onto the real tokens rather
   than invented, so they match the rest of the page.
   Injected from JS so the whole change stays one <script src> line.
*/
(function(){
  try{
    if(document.getElementById('nitya-style')) return;
    var s=document.createElement('style');
    s.id='nitya-style';
    s.textContent=`:root{
    --card:var(--sf);
    --fg:var(--tx);
    --border:var(--bd);
    --muted:var(--mu);
    --accent:var(--ac);
  }
  .btn-s{
    background:var(--tg);
    color:var(--t2);
    border:1px solid var(--bd);
    border-radius:var(--rx);
    padding:5px 11px;
    font-size:12px;
    font-family:'DM Sans',sans-serif;
    cursor:pointer;
    transition:background .15s,color .15s;
  }
  .btn-s:hover{ background:var(--tg2); color:var(--tx); }`;
    document.head.appendChild(s);
  }catch(e){ console.error('nitya style block failed', e); }
})();

/* ─── 0. SMALL CORRECTIONS ────────────────────────────────────────────
   Done at runtime so the whole of this change stays one append, rather
   than four separate edits scattered through a 3,759-line file in a
   public repo. Each one is guarded: if the thing it patches has already
   been fixed in the source, this does nothing.
*/
(function(){
  try{
    // Vedant was born 18 Feb 2024. CHILDREN said the 15th.
    if(typeof CHILDREN!=='undefined' && CHILDREN.forEach){
      CHILDREN.forEach(function(c){
        if(c.id==='vedant' && c.dob==='2024-02-15') c.dob='2024-02-18';
      });
      if(typeof renderChildren==='function'){ try{ renderChildren(); }catch(e){} }
    }
  }catch(e){ console.error('corrections block failed', e); }
})();


/* ─── 1. NITYA NIYAM — four daily practices ───────────────────────────
   These extend the EXISTING sadhana tracker (SD_ITEMS / sv-sadhana).
   That buys the streak, the percentage and the day-scheduling for free.
   A second tracker would have double-rendered into #sadhana-wrap.

   Source note, deliberately recorded: these four came from a "Cosmic
   Kendra" Instagram card. The PRACTICES are long-standing household
   ones. The chapter citations on that card (Garuda Purana Achar Kand,
   Agni Purana ch. 21, and so on) are NOT verified against the texts —
   they are repeated here as received. Worth checking before any of
   this is published on the channel, because a wrong chapter number in
   public is the kind of error a devotional account does not recover
   from quickly.
*/
(function(){
  try{
    if(typeof SD_ITEMS==='undefined') return;
    if(window.__nityaLoaded) return;          // never double-push
    window.__nityaLoaded = true;

    var NITYA = [
      { id:'gaugras', slot:'bath', title:'Gau-gras — first roti with gud',
        note:'Garuda Purana (Achar Kand) · citation unverified',
        why:'The first roti of the morning, a little jaggery pressed on top, given to a cow. Said to settle the harsh effects of Rahu and Shani.',
        text:'सुबह घर की पहली रोटी पर थोड़ा सा गुड़ रखकर गाय को खिलाना।' },

      { id:'tilarpan', slot:'bath', title:'Jal + kaale til on the Shivling',
        note:'Shiva Purana (Rudra Samhita) · citation unverified',
        why:'Water in a copper lota with a few black sesame seeds. Offered for relief from pitru dosha and the fear of untimely death.',
        text:'तांबे के लोटे में जल और थोड़े से काले तिल मिलाकर शिवलिंग पर अर्पित करना।' },

      { id:'pakshiann', slot:'wake', title:'Grain on the roof for birds',
        note:'Agni Purana (ch. 21) · citation unverified',
        why:'Raw bajra or rice put out each morning. Said to turn aside the sudden, large troubles of life.',
        text:'रोज सुबह पक्षियों के लिए छत पर कच्चा अनाज (बाजरा या चावल) डालना।' },

      { id:'sandhyadeep', slot:'evening', title:'Ghee diya at the main door',
        note:'Vishnu Purana (dvitiya amsha) · citation unverified',
        why:'Lit at sandhya-kaal, at the main entrance. For Lakshmi to stay, and for want to leave.',
        text:'संध्याकाल में मुख्य द्वार पर घी का दीपक जलाना।' },

      /* ── The two lines you sent, kept in your own wording ──
         I have not attached a chapter-and-verse to either, because I
         could not verify one. The second is close in sense to Gita 8.3
         but is not that verse word-for-word, so calling it 8.3 would be
         wrong. Recorded as you gave them. */
      { id:'aksharam', slot:'wake', days:null,
        title:'Aksharam param brahma',
        why:'On waking, before the day starts talking at you.',
        text:'अक्षरं परमं ब्रह्म ज्योतिरूपं सनातनम्।' },

      { id:'narasimha', slot:'sleep', days:[6],
        title:'Narasimha smaran — Saturday',
        note:'Saturday',
        why:'Prahlada was a child in danger and the Lord came through a pillar for him. A parent’s prayer as much as anything.',
        text:'नारायणानन्त हरे नृसिंह प्रह्लादबाधा हर हे कृपालु।' },

      { id:'sankatmochan', slot:'evening', days:[2,6],
        title:'Sankat-mochan chaupai (after Hanuman puja)',
        note:'Tuesday & Saturday · Sundar Kand',
        why:'Sita ji’s words to Hanuman ji in Ashok Vatika. Said after Hanuman puja, it reaches Shri Ram through His own bhakt.',
        text:'कहहु तात अस मोर प्रनामा।\nसब प्रकार प्रभु पूरनकामा॥\nदीन दयाल बिरिदु सँभारी।\nहरहु नाथ मम संकट भारी॥' }
    ];

    NITYA.forEach(function(it){
      // Never clobber an item that already exists under the same id.
      var dup = SD_ITEMS.some(function(x){ return x.id===it.id; });
      if(dup) return;
      var row = { id:it.id, slot:it.slot, title:it.title };
      if(it.days) row.days = it.days;
      if(it.note) row.note = it.note;
      if(it.why)  row.why  = it.why;
      if(it.text) row.text = it.text;
      SD_ITEMS.push(row);
    });

    if(typeof SD_LIB!=='undefined'){
      NITYA.forEach(function(it){
        if(it.text && !SD_LIB[it.id]) SD_LIB[it.id] = { text:it.text };
      });
    }
  }catch(e){ console.error('nitya niyam block failed', e); }
})();


/* ─── 2. KIDS' DAILY RITUAL CARD ──────────────────────────────────────
   Self-contained: its own mount point, its own storage key, its own
   renderer. It does not touch renderKidsWeek / renderKidsToday /
   sv-kids-daily, so the weekly plan your scheduled task writes keeps
   working exactly as before.

   Designed for the ages they actually are on 16 Oct 2026 —
   Vrinda 4y4m, Vedant 2y8m. That means:
     · nothing that needs reading or writing
     · nothing longer than ~10 minutes for Vrinda, ~4 for Vedant
     · Vedant's "task" is usually to be carried, to pour, or to clap
   The four Nitya Niyam above are the frame: each one has a job inside
   it that a small child can actually do. One rhythm for the house,
   not a parent track and a children's track running separately.
*/
(function(){
  try{
    if(window.__kidsRitualLoaded) return;
    window.__kidsRitualLoaded = true;

    var KR_KEY = 'sv-kids-ritual';          // sv- prefix: never ll-, which
                                            // the vault swallows when open.

    // Weekday rhythm. 0=Sun … 6=Sat, matching Date.getDay().
    var DEITY = ['Surya','Shiva','Hanuman','Ganesh','Vishnu / Guru','Lakshmi','Shani / Narasimha'];

    // Each entry: the ritual job (tied to the day's niyam) + one
    // developmental activity. Minutes are honest, not aspirational.
    var VRINDA = [
      {job:'Place the diya at the front door (you light it)', act:'Draw the family — everyone, including the cow', skill:'Pre-writing · grip', min:10},
      {job:'Press the gud onto the first roti', act:'Shape hunt — find 5 round things in the house', skill:'Geometry · vocabulary', min:10},
      {job:'Ring the bell through the whole aarti', act:'Roll clay diyas with your hands', skill:'Fine motor · strength', min:12},
      {job:'Scatter the grain for the birds', act:'Thread 10 beads onto a string, counting aloud', skill:'Numeracy to 10 · pincer', min:10},
      {job:'Carry the lota to the Shivling', act:'Hear a 2-minute story, then tell it back to Mumma', skill:'Sequencing · language', min:10},
      {job:'Choose and wash the flowers for the thali', act:'Sort the flowers by colour into three piles', skill:'Classification', min:8},
      {job:'Say the Narasimha line with Papa at bedtime', act:'Ten hops on one foot, then walk the tape line', skill:'Gross motor · balance', min:8}
    ];

    var VEDANT = [
      {job:'Clap when the aarti starts', act:'Stack five blocks without them falling', skill:'Hand-eye · patience', min:4},
      {job:'Say "Om" three times with Didi', act:'Name five body parts when asked', skill:'Vocabulary', min:3},
      {job:'Hold the bell (and ring it, loudly)', act:'Make the animal sounds from Didi’s story', skill:'Sound · imitation', min:3},
      {job:'Throw one handful of grain for the birds', act:'Pour water from the lota into a katori', skill:'Practical life · wrist', min:5},
      {job:'Carry the empty thali to the mandir', act:'Put five flowers into the thali, one at a time', skill:'Pincer grasp', min:4},
      {job:'Touch the diya tray (unlit) and fold hands', act:'Walk along a line of tape on the floor', skill:'Balance', min:4},
      {job:'Sit in Papa’s lap for one shloka', act:'Two-word sentences — "Vedant ne diya"', skill:'Speech', min:3}
    ];

    function krGet(){ try{ return JSON.parse(localStorage.getItem(KR_KEY)||'{}'); }catch(e){ return {}; } }
    function krToday(){ return new Date().toISOString().slice(0,10); }

    window.krToggle = function(k){
      var d = krGet(), t = krToday();
      d[t] = d[t] || {};
      if(d[t][k]) delete d[t][k]; else d[t][k] = true;
      // Keep 90 days, same pruning rule the rest of the page uses.
      var keys = Object.keys(d).sort();
      if(keys.length > 90) keys.slice(0, keys.length-90).forEach(function(x){ delete d[x]; });
      try{ localStorage.setItem(KR_KEY, JSON.stringify(d)); }catch(e){}
      renderKidsRitual();
    };

    function krStreak(d){
      // Same grace-day rule as _sdStreak: an untouched today does not
      // break a streak, because the day is not over yet.
      var n = 0, day = new Date();
      for(var i=0;i<400;i++){
        var k = day.toISOString().slice(0,10);
        var done = Object.keys(d[k]||{}).length;
        if(done === 0){ if(i===0){ day.setDate(day.getDate()-1); continue; } break; }
        n++; day.setDate(day.getDate()-1);
      }
      return n;
    }

    function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

    function row(key, on, label, sub, tint){
      return '<div class="irow" style="align-items:flex-start;gap:11px;margin-bottom:10px">'+
        '<div onclick="krToggle(\''+key+'\')" style="cursor:pointer;font-size:17px;line-height:1.25;user-select:none">'+
          (on?'✅':'⬜')+'</div>'+
        '<div style="min-width:0;flex:1">'+
          '<div style="color:'+(on?'var(--mu)':'var(--tx)')+';font-size:14px;line-height:1.35'+
            (on?';text-decoration:line-through':'')+'">'+esc(label)+'</div>'+
          (sub?'<div style="color:'+(tint||'var(--t2)')+';font-size:11.5px;margin-top:3px">'+esc(sub)+'</div>':'')+
        '</div>'+
      '</div>';
    }

    window.renderKidsRitual = function(){
      var host = document.getElementById('kids-ritual');
      if(!host) return;
      var d = krGet(), t = krToday(), today = d[t] || {};
      var dow = new Date().getDay();
      var v = VRINDA[dow], e = VEDANT[dow];

      var keys = ['v-job','v-act','d-job','d-act','shared'];
      var doneN = keys.filter(function(k){ return today[k]; }).length;
      var pct = Math.round(doneN/keys.length*100);

      host.innerHTML =
        '<div class="card" style="margin-bottom:14px">'+
          '<div class="chdr">'+
            '<div class="chdr-l"><div class="cic">\u{1FA94}</div>'+
            '<div class="ctit">Today’s Rituals · '+esc(DEITY[dow])+'</div></div>'+
            '<div class="cmeta">'+doneN+'/'+keys.length+' · '+krStreak(d)+'d streak</div>'+
          '</div>'+

          '<div class="pbar" style="margin:4px 0 16px"><div class="pfill" style="width:'+pct+'%"></div></div>'+

          '<div style="color:var(--ac);font-family:Syne,sans-serif;font-weight:700;font-size:10.5px;'+
            'letter-spacing:.11em;text-transform:uppercase;margin-bottom:9px">\u{1F338} Vrinda · 4y</div>'+
          row('v-job', today['v-job'], v.job, 'Her job in today’s puja', 'var(--ac)')+
          row('v-act', today['v-act'], v.act, v.skill+' · '+v.min+' min')+

          '<div class="div" style="margin:14px 0"></div>'+

          '<div style="color:var(--ac);font-family:Syne,sans-serif;font-weight:700;font-size:10.5px;'+
            'letter-spacing:.11em;text-transform:uppercase;margin-bottom:9px">⭐ Vedant · 2y</div>'+
          row('d-job', today['d-job'], e.job, 'His job in today’s puja', 'var(--ac)')+
          row('d-act', today['d-act'], e.act, e.skill+' · '+e.min+' min')+

          '<div class="div" style="margin:14px 0"></div>'+

          row('shared', today['shared'],
              'Bedtime: "Aaj kya achha hua?" — one line each',
              'Both of them · 2 min · this is the one that matters most')+

          '<div style="color:var(--mu);font-size:11px;line-height:1.5;margin-top:12px;'+
            'padding-top:11px;border-top:1px solid var(--bd)">'+
            'A missed day is a missed day, not a broken streak — they are 4 and 2. '+
            'The point is that they see it happen daily, not that they complete it.'+
          '</div>'+
        '</div>';
    };

    window.mountKidsRitual = function(){
      var tab = document.getElementById('tab-kids');
      if(!tab || document.getElementById('kids-ritual')) return;
      var host = document.createElement('div');
      host.id = 'kids-ritual';
      // Above "This Week's Focus" — the daily thing should be the first
      // thing seen, with the weekly plan underneath it.
      var anchor = tab.querySelector('#ks-profiles');
      if(anchor && anchor.nextSibling) tab.insertBefore(host, anchor.nextSibling);
      else tab.appendChild(host);
      renderKidsRitual();
    };
  }catch(e){ console.error('kids ritual block failed', e); }
})();


/* ─── 3. BOOT ─────────────────────────────────────────────────────────
   Its own try/catch group, matching the convention at line 3313: a
   throw in here cannot take the rest of the page down with it.
*/
setTimeout(function(){
  try{ if(window.mountKidsRitual) mountKidsRitual(); }catch(e){ console.error(e); }
  try{ if(window.renderSadhana) renderSadhana(); }catch(e){ console.error(e); }
}, 120);
