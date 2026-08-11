(function(){
'use strict';

/* ─────────── 효과음 (Web Audio · 음원 파일 없음) ─────────── */
var actx = null, on = localStorage.getItem('suda-sfx') !== 'off';
var btn = document.getElementById('sfxBtn');

function paint(){ if(!btn) return; btn.textContent = on ? '🔊' : '🔇'; btn.style.opacity = on ? '1' : '.55'; }
paint();

function ready(){
  if (!actx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function tone(freq, dur, delay, vol, type){
  var c = ready(); if (!c) return;
  var t0 = c.currentTime + (delay || 0);
  var o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

var V = 0.15; // 현장 소음 고려, 아주 작게
var SFX = {
  tap:  function(){ tone(880, 0.07, 0, V, 'sine'); },
  nav:  function(){ tone(660, 0.06, 0, V*0.9); tone(880, 0.09, 0.055, V*0.8); },
  link: function(){ tone(523.25, 0.07, 0, V*0.8); tone(659.25, 0.07, 0.055, V*0.8); tone(783.99, 0.13, 0.11, V*0.75); },
  open: function(){ tone(440, 0.07, 0, V*0.8); tone(659.25, 0.13, 0.06, V*0.7); },
  close:function(){ tone(659.25, 0.06, 0, V*0.7); tone(440, 0.11, 0.055, V*0.6); },
  off:  function(){ tone(392, 0.10, 0, V*0.7); }
};
function play(n){ if (on && SFX[n]) { try { SFX[n](); } catch(e){} } }

if (btn) {
  btn.addEventListener('click', function(){
    on = !on;
    localStorage.setItem('suda-sfx', on ? 'on' : 'off');
    paint();
    if (on) { ready(); play('tap'); }
  });
}

document.addEventListener('click', function(e){
  var el = e.target.closest('[data-sfx]');
  if (el) play(el.getAttribute('data-sfx'));
}, true);

/* iOS: 첫 사용자 제스처에서 오디오 활성화 */
['pointerdown','touchstart','keydown'].forEach(function(ev){
  window.addEventListener(ev, function once(){ if (on) ready(); }, { once:true, passive:true });
});

/* ─────────── 스크롤 등장 ─────────── */
/* rAF 스윕 방식 — 앵커 점프로 한 번에 건너뛴 요소도 반드시 나타남 */
var pending = Array.prototype.slice.call(document.querySelectorAll('.rv'));
function reveal(){
  if (!pending.length) return;
  var line = window.innerHeight * 0.92;
  pending = pending.filter(function(el){
    if (el.getBoundingClientRect().top < line) { el.classList.add('in'); return false; }
    return true;
  });
}

/* rAF는 탭이 백그라운드면 멈추므로 setTimeout 안전망을 함께 건다 */
var tick = false;
function run(){ if (!tick) return; tick = false; reveal(); }
function frame(){ if (tick) return; tick = true; requestAnimationFrame(run); setTimeout(run, 180); }
window.addEventListener('scroll', frame, { passive:true });
window.addEventListener('resize', frame, { passive:true });
window.addEventListener('load', frame);
document.addEventListener('visibilitychange', frame);
reveal();

/* ─────────── 라이트박스 (안내판 이미지) ─────────── */
var lb = document.getElementById('lb');
if (lb) {
  var lbImg = document.getElementById('lbImg'),
      lbCap = document.getElementById('lbCap'), lbX = document.getElementById('lbX'), lastFocus = null;
  var BLANK = lbImg.src;

  var openLb = function(src, cap, alt){
    lastFocus = document.activeElement;
    lbImg.src = src; lbImg.alt = alt || cap || '';
    lbCap.textContent = cap || '';
    lb.classList.add('open'); document.body.classList.add('lock'); lb.scrollTop = 0;
    void lb.offsetWidth;              /* 리플로우 강제 — rAF 없이도 트랜지션 보장 */
    lb.classList.add('show');
    lbX.focus();
  };
  var closeLb = function(){
    play('close');
    lb.classList.remove('show'); document.body.classList.remove('lock');
    setTimeout(function(){ lb.classList.remove('open'); lbImg.src = BLANK; }, 300);
    if (lastFocus) lastFocus.focus();
  };

  document.querySelectorAll('.poster').forEach(function(p){
    p.addEventListener('click', function(){
      openLb(p.getAttribute('data-src'), p.getAttribute('data-cap'), p.querySelector('img').alt);
    });
  });
  lbX.addEventListener('click', closeLb);
  lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('lb__cap')) closeLb(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });
}

})();
