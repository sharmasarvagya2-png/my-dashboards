/* ═══════════════════════════════════════════════════════════════════
   SARVAGYA HUB — Wealth, rebuilt
   Loaded by sarvagya-hub.html via a <script src> line before </body>.

   WHY THIS EXISTS — three things the old Wealth tab got wrong,
   found 17 Oct 2026. (Figures deliberately not repeated here: this
   file is committed to a PUBLIC repo. The numbers live only in your
   browser. Described structurally instead.)

   1. "In Bank" summed every account together — one savings account
      and four credit cards — into a single figure, so a positive
      balance and a larger card debt netted off into a negative
      "bank" number. You cannot have minus money in a bank.
      Cash and debt are different things and are now shown apart.

   2. "Net Worth" was the identical number, because it was the same
      sum. It counted no investments and no policies at all. Two tiles
      showing the same figure under different names is the tell.

   3. "Mutual Funds ₹0" — there is one folio recorded with units:0 and
      a NAV from 30 Jun 2025. Meanwhile the mailbox holds SBI MF annual
      statements for THREE folios (…751, …664, …085) and redemption
      confirmations. ₹0 is not the value of that holding; it is the
      absence of data. It now says so instead of printing a number.

   The design rule throughout: a gap is drawn as a gap. A zero is only
   ever shown when something is genuinely zero.

   NO FINANCIAL VALUES ARE HARDCODED HERE. This file is rendering logic
   only, and the repo is public. Every figure is read at runtime from
   sv-wealth / sv-mailreview in your own browser's localStorage.

   Built 2026-10-17. Additive: it replaces the contents of #tab-wealth
   and touches nothing else. Delete the <script src> line to revert.
   ═══════════════════════════════════════════════════════════════════ */

(function(){
  try{
    if(window.__wealthRebuilt) return;
    window.__wealthRebuilt = true;

    var MONTHS = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};

    function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

    function inr(n, opts){
      opts = opts || {};
      var v = Number(n);
      if(!isFinite(v)) return '—';
      var neg = v < 0; v = Math.abs(v);
      var s = v.toLocaleString('en-IN', {maximumFractionDigits: opts.paise?2:0});
      return (neg?'-':'') + '₹' + s;
    }

    /* Dates arrive as human strings — "21 Mar 2027", "30 Sep 2026 (bill,
       due 21 Oct)". Parse what is there; return null rather than guess.
       A wrong due date is worse than no due date. */
    function parseDate(str, assumeYear){
      if(!str) return null;
      var m = String(str).match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?\s*(\d{4})?/);
      if(!m) return null;
      var mon = MONTHS[m[2].toLowerCase()];
      if(mon === undefined) return null;
      var year = m[3] ? +m[3] : (assumeYear || new Date().getFullYear());
      var d = new Date(year, mon, +m[1]);
      // A bare "due 21 Oct" that already passed this year means next year.
      if(!m[3]){
        var today = new Date(); today.setHours(0,0,0,0);
        if(d < today) d = new Date(year+1, mon, +m[1]);
      }
      return d;
    }

    function daysUntil(d){
      if(!d) return null;
      var t = new Date(); t.setHours(0,0,0,0);
      return Math.round((d - t) / 86400000);
    }

    function dayLabel(n){
      if(n === null) return '';
      if(n < 0)  return Math.abs(n)+'d overdue';
      if(n === 0) return 'today';
      if(n === 1) return 'tomorrow';
      return 'in '+n+' days';
    }

    function urgencyColour(n){
      if(n === null) return 'var(--mu)';
      if(n < 0)   return 'var(--col-red)';
      if(n <= 3)  return 'var(--col-red)';
      if(n <= 10) return 'var(--col-yellow)';
      return 'var(--t2)';
    }

    var isCard = function(a){ return /credit\s*card/i.test(a.type||''); };

    /* ─── staleness ────────────────────────────────────────────────
       A figure from last year presented without comment is a lie of
       omission. Anything older than 90 days gets labelled. */
    function staleness(asOf){
      var d = parseDate(asOf);
      if(!d) return null;
      var age = -daysUntil(d);
      if(age < 90) return null;
      return age > 400 ? Math.round(age/365*10)/10 + ' years old' : age + ' days old';
    }

    function card(icon, title, meta, body){
      return '<div class="card" style="margin-bottom:14px">'+
        '<div class="chdr"><div class="chdr-l"><div class="cic">'+icon+'</div>'+
        '<div class="ctit">'+esc(title)+'</div></div>'+
        (meta?'<div class="cmeta">'+meta+'</div>':'')+'</div>'+
        body+'</div>';
    }

    function statTile(label, value, sub, colour){
      return '<div style="background:var(--tg);border:1px solid var(--bd);border-radius:var(--rs);'+
        'padding:13px 15px;min-width:0">'+
        '<div style="color:var(--mu);font-size:10px;letter-spacing:.1em;text-transform:uppercase;'+
          'font-family:Syne,sans-serif;font-weight:700">'+esc(label)+'</div>'+
        '<div style="color:'+(colour||'var(--tx)')+';font-family:Syne,sans-serif;font-weight:700;'+
          'font-size:21px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+value+'</div>'+
        (sub?'<div style="color:var(--mu);font-size:11px;margin-top:3px">'+sub+'</div>':'')+
      '</div>';
    }

    function emptyNote(t){
      return '<div style="color:var(--mu);font-size:12.5px;padding:8px 2px;line-height:1.5">'+t+'</div>';
    }

    /* ─── payments that are BOUNCING ───────────────────────────────
       Added 17 Oct 2026, after finding ICICI "Transaction failure for
       Standing Instruction" notices for three different merchants,
       repeating over more than a week, sitting unread in the inbox.

       This outranks everything else on the page. A bill you have not
       paid yet is a plan; a payment that keeps being refused is a
       subscription quietly dying, and in one case the cloud billing
       behind your own automation. It renders first and in red. */
    function renderFailing(w){
      var si = (w.standingInstructions||[]).filter(function(s){
        return /fail/i.test(s.status||'');
      });
      if(!si.length) return '';
      var total = si.reduce(function(s,x){ return s+(Number(x.amount)||0); },0);
      var rows = si.map(function(s){
        var n = Number(s.attempts)||0;
        return '<div class="irow" style="justify-content:space-between;align-items:baseline;gap:12px">'+
          '<div style="min-width:0;flex:1">'+
            '<div style="color:var(--tx);font-size:13.5px">'+esc(s.payee||'—')+
              (s.card?' <span style="color:var(--mu);font-size:12px">'+esc(s.card)+'</span>':'')+'</div>'+
            '<div style="color:var(--col-red);font-size:11.5px;margin-top:2px">'+
              (n?('refused '+n+' time'+(n===1?'':'s')):'refused')+
              (s.lastFailed?' · last '+esc(s.lastFailed):'')+'</div>'+
          '</div>'+
          '<div style="color:var(--col-red);font-family:Syne,sans-serif;font-weight:700;font-size:14px">'+
            inr(s.amount,{paise:true})+'</div></div>';
      }).join('');
      var note = '<div style="color:var(--t2);font-size:11.5px;margin-top:11px;padding-top:11px;'+
        'border-top:1px solid var(--bd);line-height:1.5">'+
        'Repeated refusals on one card usually mean the card is at its limit, blocked, or the '+
        'e-mandate has lapsed — not that the merchants are at fault. Worth fixing at the card, once, '+
        'rather than per merchant.</div>';
      return '<div class="card" style="margin-bottom:14px;border-color:var(--col-red)">'+
        '<div class="chdr"><div class="chdr-l"><div class="cic">⚠</div>'+
        '<div class="ctit" style="color:var(--col-red)">Payments being refused</div></div>'+
        '<div class="cmeta"><span style="color:var(--col-red)">'+inr(total,{paise:true})+' across '+si.length+'</span></div></div>'+
        rows + note + '</div>';
    }

    /* ─── the one that matters: money leaving soon ──────────────── */
    function collectDues(w){
      var out = [];
      (w.accounts||[]).forEach(function(a){
        if(!isCard(a)) return;
        // "30 Sep 2026 (bill, due 21 Oct)"
        var m = String(a.asOf||'').match(/due\s+([^),]+)/i);
        if(!m) return;
        var d = parseDate(m[1]);
        if(!d) return;
        out.push({ what: (a.bank||'Card')+' bill', detail: a.masked||'', amount: Math.abs(Number(a.balance)||0),
                   date: d, kind:'card' });
      });
      (w.policies||[]).forEach(function(p){
        var d = parseDate(p.renewalDate);
        if(!d) return;
        out.push({ what: (p.insurer||'Policy')+' premium', detail: p.type||'',
                   amount: Number(p.premium)||0, date: d, kind:'policy' });
      });
      (w.standingInstructions||[]).forEach(function(s){
        var d = parseDate(s.date || s.due);
        out.push({ what: s.payee||'Standing instruction', detail: s.card||'',
                   amount: Number(s.amount)||0, date: d, kind:'si' });
      });
      return out.filter(function(x){ return x.date; })
                .sort(function(a,b){ return a.date - b.date; });
    }

    function renderDues(w){
      var dues = collectDues(w);
      var soon = dues.filter(function(d){ var n=daysUntil(d.date); return n!==null && n<=45; });
      if(!soon.length){
        return card('📆','Due soon','next 45 days',
          emptyNote('Nothing falls due in the next 45 days from what has been captured.'));
      }
      var total = soon.reduce(function(s,x){ return s+x.amount; },0);
      var rows = soon.map(function(d){
        var n = daysUntil(d.date), col = urgencyColour(n);
        return '<div class="irow" style="justify-content:space-between;align-items:baseline;gap:12px">'+
          '<div style="min-width:0;flex:1">'+
            '<div style="color:var(--tx);font-size:13.5px">'+esc(d.what)+
              (d.detail?' <span style="color:var(--mu)">'+esc(d.detail)+'</span>':'')+'</div>'+
            '<div style="color:'+col+';font-size:11.5px;margin-top:2px">'+
              d.date.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.date.getMonth()]+
              ' · '+dayLabel(n)+'</div>'+
          '</div>'+
          '<div style="color:var(--tx);font-family:Syne,sans-serif;font-weight:700;font-size:14px;'+
            'white-space:nowrap">'+inr(d.amount)+'</div>'+
        '</div>';
      }).join('');
      return card('📆','Due soon','<span style="color:var(--ac)">'+inr(total)+' over '+soon.length+'</span>', rows);
    }

    function renderCash(w){
      var banks = (w.accounts||[]).filter(function(a){ return !isCard(a); });
      if(!banks.length) return card('🏦','Cash','', emptyNote('No bank account captured yet.'));
      var total = banks.reduce(function(s,a){ return s+(Number(a.balance)||0); },0);
      var rows = banks.map(function(a){
        var st = staleness(a.asOf);
        return '<div class="irow" style="justify-content:space-between;align-items:baseline;gap:12px">'+
          '<div style="min-width:0;flex:1"><div style="color:var(--tx);font-size:13.5px">'+esc(a.bank||'—')+
            ' <span style="color:var(--mu);font-size:12px">'+esc(a.masked||'')+'</span></div>'+
            '<div style="color:var(--mu);font-size:11.5px;margin-top:2px">'+esc(a.type||'')+
              (a.asOf?' · as of '+esc(a.asOf):'')+
              (st?' <span style="color:var(--col-yellow)">· '+st+'</span>':'')+'</div></div>'+
          '<div style="color:var(--col-green);font-family:Syne,sans-serif;font-weight:700;font-size:14px">'+
            inr(a.balance,{paise:true})+'</div></div>';
      }).join('');
      return card('🏦','Cash','<span style="color:var(--col-green)">'+inr(total,{paise:true})+'</span>', rows);
    }

    function renderOwed(w){
      var cards = (w.accounts||[]).filter(isCard);
      if(!cards.length) return card('💳','Owed','', emptyNote('No credit card captured yet.'));
      var total = cards.reduce(function(s,a){ return s+Math.abs(Number(a.balance)||0); },0);
      var rows = cards.map(function(a){
        var bal = Math.abs(Number(a.balance)||0);
        var m = String(a.asOf||'').match(/due\s+([^),]+)/i);
        var n = m ? daysUntil(parseDate(m[1])) : null;
        return '<div class="irow" style="justify-content:space-between;align-items:baseline;gap:12px">'+
          '<div style="min-width:0;flex:1"><div style="color:var(--tx);font-size:13.5px">'+esc(a.bank||'—')+
            ' <span style="color:var(--mu);font-size:12px">'+esc(a.masked||'')+'</span></div>'+
            '<div style="color:'+(n!==null?urgencyColour(n):'var(--mu)')+';font-size:11.5px;margin-top:2px">'+
              (bal===0 ? 'clear' : (n!==null ? 'due '+dayLabel(n) : esc(a.asOf||'')))+'</div></div>'+
          '<div style="color:'+(bal?'var(--col-red)':'var(--mu)')+';font-family:Syne,sans-serif;'+
            'font-weight:700;font-size:14px">'+(bal?inr(bal,{paise:true}):'—')+'</div></div>';
      }).join('');
      return card('💳','Owed','<span style="color:var(--col-red)">'+inr(total,{paise:true})+'</span>', rows);
    }

    function renderInvestments(w){
      var funds = w.funds||[];

      /* "Nothing held" and "we failed to capture it" look identical if
         you only ever draw an empty state. They are opposite facts.
         17 Oct 2026: the MF folios were all redeemed and there is no
         trading account in use — so this is genuinely nil, and saying
         "not captured" here would send you looking for data that does
         not exist. w.investmentsNote carries the explanation. */
      if(!funds.length && w.investmentsNote){
        return card('📈','Investments','<span style="color:var(--mu)">none held</span>',
          '<div style="color:var(--t2);font-size:12.5px;padding:6px 2px;line-height:1.55">'+
            esc(w.investmentsNote)+'</div>');
      }

      var known = funds.filter(function(f){ return Number(f.value) > 0; });
      var unknown = funds.filter(function(f){ return !(Number(f.value) > 0); });
      var total = known.reduce(function(s,f){ return s+Number(f.value); },0);
      var meta = known.length ? inr(total) : '<span style="color:var(--col-yellow)">not captured</span>';

      var rows = funds.map(function(f){
        var val = Number(f.value)||0, units = Number(f.units)||0;
        var st = staleness(f.asOf);
        var incomplete = !(val>0);
        return '<div class="irow" style="justify-content:space-between;align-items:baseline;gap:12px">'+
          '<div style="min-width:0;flex:1">'+
            '<div style="color:var(--tx);font-size:13.5px">'+esc(f.scheme||f.house||'—')+'</div>'+
            '<div style="color:var(--mu);font-size:11.5px;margin-top:2px">'+
              esc(f.house||'')+(f.folio?' · '+esc(f.folio):'')+
              (f.nav?' · NAV '+inr(f.nav,{paise:true}):'')+
              (f.asOf?' · '+esc(f.asOf):'')+
              (st?' <span style="color:var(--col-yellow)">· '+st+'</span>':'')+'</div>'+
            (incomplete ? '<div style="color:var(--col-yellow);font-size:11.5px;margin-top:4px;line-height:1.45">'+
               'Units were never captured, so this cannot be valued. The NAV is here but the holding is not. '+
               'Your mailbox has SBI MF annual statements for three folios — those carry the unit balances.</div>' : '')+
          '</div>'+
          '<div style="font-family:Syne,sans-serif;font-weight:700;font-size:14px;color:'+
            (incomplete?'var(--col-yellow)':'var(--tx)')+'">'+(incomplete?'?':inr(val))+'</div></div>';
      }).join('');

      var note = unknown.length ? '<div style="color:var(--mu);font-size:11.5px;margin-top:10px;'+
        'padding-top:10px;border-top:1px solid var(--bd);line-height:1.5">'+
        'The old tile read <strong style="color:var(--t2)">₹0</strong> here. That was not a valuation — '+
        'it was missing data wearing a number. Shown as unknown until the units are in.</div>' : '';

      return card('📈','Investments', meta, (funds.length?rows:emptyNote('No holding captured yet.'))+note);
    }

    function renderCommitments(w){
      var pol = w.policies||[];
      if(!pol.length) return card('🛡','Commitments','', emptyNote('No policy captured yet.'));
      var annual = pol.reduce(function(s,p){
        var prem = Number(p.premium)||0;
        var f = String(p.frequency||'').toLowerCase();
        var mult = f.indexOf('month')>-1 ? 12 : f.indexOf('quarter')>-1 ? 4 :
                   f.indexOf('half')>-1 ? 2 : 1;
        return s + prem*mult;
      },0);
      var rows = pol.map(function(p){
        var n = daysUntil(parseDate(p.renewalDate));
        var noSum = !(Number(p.sumAssured)>0);
        return '<div class="irow" style="justify-content:space-between;align-items:baseline;gap:12px">'+
          '<div style="min-width:0;flex:1">'+
            '<div style="color:var(--tx);font-size:13.5px">'+esc(p.insurer||'—')+' · '+esc(p.type||'')+'</div>'+
            '<div style="color:'+(n!==null?urgencyColour(n):'var(--mu)')+';font-size:11.5px;margin-top:2px">'+
              esc(p.frequency||'')+(p.renewalDate?' · renews '+esc(p.renewalDate)+' ('+dayLabel(n)+')':'')+'</div>'+
            '<div style="color:var(--mu);font-size:11.5px;margin-top:2px">'+
              (noSum ? '<span style="color:var(--col-yellow)">sum assured not captured</span>'
                     : 'cover '+inr(p.sumAssured))+'</div>'+
          '</div>'+
          '<div style="color:var(--tx);font-family:Syne,sans-serif;font-weight:700;font-size:14px">'+
            inr(p.premium)+'</div></div>';
      }).join('');
      return card('🛡','Commitments','<span style="color:var(--ac)">'+inr(annual)+' a year</span>', rows);
    }

    function renderSpend(w, m){
      var spend = (m && m.items && m.items.length) ? m.items : (w.spend||[]);
      if(!spend.length) return card('🧾','Recent spend','', emptyNote('Nothing logged yet.'));
      var total = spend.reduce(function(s,x){ return s+(Number(x.amount)||0); },0);
      var avoidable = spend.filter(function(x){ return /avoid/i.test(x.verdict||''); })
                           .reduce(function(s,x){ return s+(Number(x.amount)||0); },0);
      var rows = spend.map(function(s){
        var bad = /avoid/i.test(s.verdict||'');
        return '<div class="irow" style="justify-content:space-between;align-items:baseline;gap:12px">'+
          '<div style="min-width:0;flex:1">'+
            '<div style="color:var(--tx);font-size:13.5px">'+esc(s.merchant||'—')+'</div>'+
            '<div style="color:var(--mu);font-size:11.5px;margin-top:2px">'+esc(s.what||'')+
              (s.date?' · '+esc(s.date):'')+'</div></div>'+
          '<div style="text-align:right;white-space:nowrap">'+
            '<div style="color:var(--tx);font-family:Syne,sans-serif;font-weight:700;font-size:14px">'+
              inr(s.amount,{paise:true})+'</div>'+
            (s.verdict?'<span class="badge '+(bad?'bg-r':'bg-g')+'" style="margin-top:3px;display:inline-block">'+
              esc(s.verdict)+'</span>':'')+
          '</div></div>';
      }).join('');
      var meta = inr(total,{paise:true}) + (avoidable? ' · <span style="color:var(--col-red)">'+
                 inr(avoidable,{paise:true})+' avoidable</span>' : '');
      return card('🧾','Recent spend', meta, rows);
    }

    function renderMail(m){
      if(!m || (!m.attention && !m.actions)) return '';
      var att = (m.attention||[]).map(function(a){
        return '<div class="irow" style="gap:9px;align-items:flex-start">'+
          '<div style="color:var(--col-yellow);font-size:13px;line-height:1.4">▸</div>'+
          '<div style="color:var(--t2);font-size:13px;line-height:1.45;flex:1">'+esc(a)+'</div></div>';
      }).join('');
      var act = (m.actions||[]).map(function(a){
        var txt = (typeof a === 'string') ? a : (a.text || a.action || JSON.stringify(a));
        return '<div class="irow" style="gap:9px;align-items:flex-start">'+
          '<div style="color:var(--ac);font-size:13px;line-height:1.4">□</div>'+
          '<div style="color:var(--t2);font-size:13px;line-height:1.45;flex:1">'+esc(txt)+'</div></div>';
      }).join('');
      var body =
        (att?'<div class="slbl" style="margin-bottom:8px">Needs attention</div>'+att:'')+
        (act?'<div class="slbl" style="margin:16px 0 8px">Actions</div>'+act:'');
      return card('📬','From your mail', esc(m.date||''), body || emptyNote('Nothing flagged.'));
    }

    /* ─── hero ─────────────────────────────────────────────────── */
    function renderHero(w){
      var acc = w.accounts||[];
      var cashTotal = acc.filter(function(a){ return !isCard(a); })
                         .reduce(function(s,a){ return s+(Number(a.balance)||0); },0);
      var owedTotal = acc.filter(isCard)
                         .reduce(function(s,a){ return s+Math.abs(Number(a.balance)||0); },0);
      var funds = w.funds||[];
      var invTotal  = funds.reduce(function(s,f){ return s+(Number(f.value)||0); },0);
      // Only "unknown" if something IS held and we failed to value it.
      // Nothing held is a known quantity: nil.
      var invUnknown = funds.some(function(f){ return !(Number(f.value)>0); });
      var invNil = !funds.length;
      var net = cashTotal + invTotal - owedTotal;

      var dues = collectDues(w).filter(function(d){ var n=daysUntil(d.date); return n!==null && n>=0 && n<=30; });
      var dueTotal = dues.reduce(function(s,x){ return s+x.amount; },0);

      return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-bottom:16px">'+
        statTile('Cash', inr(cashTotal), 'in the bank', 'var(--col-green)')+
        statTile('Owed', inr(owedTotal), (acc.filter(isCard).length)+' cards', 'var(--col-red)')+
        statTile('Investments',
                 invNil ? '—' : (invUnknown ? 'incomplete' : inr(invTotal)),
                 invNil ? 'none held' : (invUnknown ? 'units not captured' : 'valued'),
                 invNil ? 'var(--mu)' : (invUnknown ? 'var(--col-yellow)' : 'var(--tx)'))+
        statTile('Net', inr(net),
                 invNil ? 'cash − cards' : (invUnknown ? 'excludes funds' : 'cash + funds − cards'),
                 net<0?'var(--col-red)':'var(--col-green)')+
        statTile('Next 30 days', inr(dueTotal), dues.length+' payment'+(dues.length===1?'':'s'), 'var(--ac)')+
      '</div>';
    }

    window.renderWealthRebuilt = function(){
      var tab = document.getElementById('tab-wealth');
      if(!tab) return;
      var w={}, m={};
      try{ w = JSON.parse(localStorage.getItem('sv-wealth')||'{}'); }catch(e){}
      try{ m = JSON.parse(localStorage.getItem('sv-mailreview')||'{}'); }catch(e){}

      var host = document.getElementById('wealth-rebuilt');
      if(!host){
        host = document.createElement('div');
        host.id = 'wealth-rebuilt';
        tab.insertBefore(host, tab.firstChild);
        // Hide the original blocks rather than delete them: if anything
        // here is wrong, one line in the console brings them back.
        [].slice.call(tab.children).forEach(function(c){
          if(c !== host) c.style.display = 'none';
        });
      }

      host.innerHTML =
        '<div class="phdr" style="margin-bottom:4px">'+
          '<div><div class="ptitle">Wealth</div>'+
          '<div class="psub">Cash, debt and commitments — kept apart, because they are different things</div></div>'+
        '</div>'+
        '<div style="color:var(--mu);font-size:11.5px;margin:6px 0 16px">'+
          'Source: '+esc(w.source||'—')+' · updated '+esc(w.updatedAt||'never')+
        '</div>'+
        renderHero(w)+
        renderFailing(w)+
        renderDues(w)+
        renderCash(w)+
        renderOwed(w)+
        renderInvestments(w)+
        renderCommitments(w)+
        renderSpend(w, m)+
        renderMail(m);
    };

    // Restore the original tab if ever needed: __wealthRestore() in console.
    window.__wealthRestore = function(){
      var tab = document.getElementById('tab-wealth');
      if(!tab) return;
      [].slice.call(tab.children).forEach(function(c){
        c.style.display = (c.id === 'wealth-rebuilt') ? 'none' : '';
      });
    };
  }catch(e){ console.error('wealth rebuild failed', e); }
})();

setTimeout(function(){
  try{ if(window.renderWealthRebuilt) renderWealthRebuilt(); }catch(e){ console.error(e); }
}, 200);
