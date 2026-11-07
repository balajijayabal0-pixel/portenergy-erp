/* © 2026 Port Energy Private Limited. All rights reserved.
   PORT ENERGY ERP - English auto-correct + voice typing.
   Fixes common spelling mistakes as you type (after space / full stop / leaving the box) in every text box,
   shows a small "Corrected" chip with Undo, and adds English voice typing to PEPL Intelligence and Team chat. */
(function () {
  'use strict';
  var P = function () { return window.PE; };
  var W = ('accomodate:accommodate acheive:achieve acknowledgement:acknowledgement adress:address agian:again agreeement:agreement allready:already alot:a lot amout:amount ammount:amount ammout:amount anual:annual aplication:application ' +
    'apporval:approval aproval:approval aprove:approve aproved:approved approvel:approval arrangment:arrangement artical:article asap:ASAP assesment:assessment attatch:attach attatched:attached attachement:attachment avaiable:available availabe:available availible:available ' +
    'balence:balance becuase:because becasue:because beacuse:because begining:beginning beleive:believe benifit:benefit buisness:business bussiness:business busness:business calender:calendar catagory:category cheque:cheque comission:commission commitee:committee ' +
    'compnay:company comapny:company compeleted:completed completly:completely confirmaton:confirmation contarct:contract contracter:contractor contrator:contractor corect:correct correspondance:correspondence curent:current custmer:customer custamer:customer ' +
    'deadine:deadline definately:definitely deliverd:delivered delievery:delivery delivary:delivery delivey:delivery departmant:department deparment:department dept.:dept. descripton:description detials:details deatils:details diffrent:different discription:description ' +
    'docuement:document documnet:document dosent:does not doesnt:doesn\'t dont:don\'t enviroment:environment equipement:equipment equiptment:equipment estimaton:estimation excecute:execute existance:existence expence:expense expences:expenses expenss:expenses ' +
    'finaly:finally folow:follow followup:follow-up foward:forward fowarded:forwarded freind:friend goverment:government gaurantee:guarantee guarentee:guarantee happend:happened immediatly:immediately imediately:immediately independant:independent ' +
    'infomation:information informaton:information instalation:installation intrested:interested invioce:invoice invocie:invoice invoce:invoice iam:I am im:I\'m isnt:isn\'t knowlege:knowledge labour:labour lenght:length liason:liaison maintainance:maintenance maintanence:maintenance mantenance:maintenance ' +
    'managment:management manger:manager materail:material meterial:material matarial:material neccessary:necessary necesary:necessary noticable:noticeable occured:occurred ocurred:occurred offical:official oppurtunity:opportunity ' +
    'paymnet:payment payemnt:payment pament:payment paymet:payment percentge:percentage permision:permission permisson:permission posible:possible preffered:preferred prefered:preferred procurment:procurement procuremnt:procurement ' +
    'projcet:project porject:project prject:project proposel:proposal purchse:purchase purhcase:purchase quantitiy:quantity quantiy:quantity qty.:qty. quatation:quotation quotaion:quotation qoutation:quotation quation:quotation ' +
    'recieve:receive recieved:received reciept:receipt recomend:recommend reffer:refer refered:referred regading:regarding regrads:regards regarsd:regards reminer:reminder requst:request reuqest:request requirment:requirement requirments:requirements resposible:responsible ' +
    'schdule:schedule shedule:schedule seperate:separate sheduled:scheduled sincerly:sincerely speciality:speciality sucess:success succesful:successful sucessful:successful suplier:supplier supplyer:supplier submited:submitted submision:submission ' +
    'teh:the thier:their tommorow:tomorrow tommorrow:tomorrow tomorow:tomorrow tendor:tender tendar:tender transporation:transportation truely:truly untill:until usally:usually vechile:vehicle vehical:vehicle vendar:vendor vender:vendor ' +
    'wether:whether wich:which wiht:with wierd:weird wont:won\'t writting:writing yesturday:yesterday yestarday:yesterday wroking:working wokring:working woking:working welding:welding wellding:welding pipline:pipeline pipleine:pipeline').split(' ');
  var D = {}; W.forEach(function (p) { var i = p.indexOf(':'); D[p.slice(0, i)] = p.slice(i + 1); });
  var SKIP = /^(number|email|tel|password|date|time|url|search)$/i;
  function ok(el) {
    if (!el || el.readOnly || el.disabled) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT' || SKIP.test(el.type || 'text')) return false;
    if (/^(lid|lpin|q|mpQ|cmdIn|topQ)$/.test(el.id) || el.closest('#login') || el.closest('.search') || el.closest('.cmdk')) return false;
    var k = el.getAttribute('data-k') || el.name || ''; if (/(no|id|gst|pan|ifsc|code|mobile|phone|email|serial|ref|utr|hsn|account)/i.test(k)) return false;
    return true;
  }
  function match(word) {
    var lw = word.toLowerCase(), fix = D[lw]; if (!fix || fix === lw) return null;
    if (word === word.toUpperCase() && word.length > 1) return fix.toUpperCase();
    if (word[0] === word[0].toUpperCase()) return fix[0].toUpperCase() + fix.slice(1);
    return fix;
  }
  var chip = null, undo = null;
  function show(el, from, to) {
    if (!chip) { chip = document.createElement('div'); chip.className = 'sp-chip'; document.body.appendChild(chip); }
    chip.innerHTML = '<span>✓ Corrected <s></s> → <b></b></span><button type="button">Undo</button>';
    chip.querySelector('s').textContent = from; chip.querySelector('b').textContent = to;
    var r = el.getBoundingClientRect(); chip.style.left = Math.max(8, Math.min(window.innerWidth - 260, r.left)) + 'px'; chip.style.top = Math.max(8, r.top - 38) + 'px';
    chip.classList.add('on'); clearTimeout(chip._t); chip._t = setTimeout(function () { chip.classList.remove('on'); undo = null; }, 3500);
    chip.querySelector('button').onclick = function () { if (undo) undo(); chip.classList.remove('on'); };
  }
  function fixAt(el, end) {
    var v = el.value, upto = v.slice(0, end), m = /([A-Za-z.']+)([^A-Za-z']*)$/.exec(upto); if (!m) return;
    var word = m[1].replace(/\.$/, ''), to = match(word); if (!to) return;
    var start = upto.length - m[0].length, nv = v.slice(0, start) + to + v.slice(start + word.length);
    var caret = el.selectionStart + (to.length - word.length);
    el.value = nv; try { el.setSelectionRange(caret, caret); } catch (x) { }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    undo = function () { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    show(el, word, to);
  }
  document.addEventListener('input', function (e) {
    var el = e.target; if (!ok(el) || e.inputType === 'insertFromPaste' || !e.data) return;
    if (/[\s.,!?;:)]/.test(e.data)) fixAt(el, el.selectionStart - 1);
  }, true);
  document.addEventListener('focusin', function (e) { var el = e.target; if (ok(el)) { el.spellcheck = true; el.setAttribute('lang', 'en-IN'); if (el.tagName === 'TEXTAREA') el.setAttribute('autocapitalize', 'sentences'); } });
  document.addEventListener('focusout', function (e) { var el = e.target; if (ok(el) && el.value) fixAt(el, el.value.length); }, true);

  /* ---------- English voice typing ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, recBtn = null;
  function dictate(btn, box) {
    if (!SR) { P().toast('Voice typing needs Chrome or Edge.', true); return; }
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = true; rec.continuous = true;
    var base = box.value ? box.value.replace(/\s*$/, ' ') : '';
    recBtn = btn; btn.classList.add('rec');
    rec.onresult = function (ev) {
      var fin = '', tmp = '';
      for (var i = 0; i < ev.results.length; i++) { var t = ev.results[i][0].transcript; if (ev.results[i].isFinal) fin += t; else tmp += t; }
      fin = fin.replace(/\b\w+\b/g, function (w) { return match(w) || w; });
      box.value = base + (fin ? fin.charAt(0).toUpperCase() + fin.slice(1) : '') + tmp; box.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = function (ev) { if (ev.error === 'not-allowed') P().toast('Allow the microphone for this app to use voice typing.', true); };
    rec.onend = function () { btn.classList.remove('rec'); rec = null; box.focus(); };
    try { rec.start(); P().toast('Listening… speak in English. Tap the mic again to stop.'); } catch (x) { rec = null; btn.classList.remove('rec'); }
  }
  function wire() {
    var m = document.getElementById('aiMic'); if (m && !m.__w) { m.__w = 1; m.onclick = function () { dictate(m, document.getElementById('aiIn')); }; }
    var f = document.getElementById('peChF'); if (f && !f.querySelector('.ai-mic')) {
      f.insertAdjacentHTML('afterbegin', '<button type="button" class="btn ghost ai-mic ch-mic" aria-label="Voice typing"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg></button>');
      var b = f.querySelector('.ch-mic'); b.onclick = function () { dictate(b, document.getElementById('peChIn')); };
    }
  }
  new MutationObserver(wire).observe(document.documentElement, { childList: true, subtree: true });
  window.PE_SPELL = { fix: match };
})();
