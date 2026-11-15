// 草稿纸：Apple Pencil 书写（压感），用过笔之后手指 / 手掌的触碰不画线（防误触）
export class Pad {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.strokes = []; this.cur = null; this.tool = 'pen'; this.color = '#1d2433';
    this.penSeen = false;
    const ro = new ResizeObserver(() => this.resize()); ro.observe(canvas.parentElement);
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) canvas.addEventListener(ev, (e) => this.up(e));
    // 阻止 iOS 长按菜单、双指缩放
    canvas.addEventListener('touchstart', (e) => { if (e.touches.length === 1) e.preventDefault(); }, { passive: false });
    this.resize();
  }
  resize() {
    const r = this.c.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.w = Math.max(50, r.width); this.h = Math.max(50, r.height);
    this.c.width = this.w * dpr; this.c.height = this.h * dpr;
    this.c.style.width = this.w + 'px'; this.c.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.redraw();
  }
  pos(e) { const r = this.c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, e.pressure || 0.5]; }
  accept(e) {
    if (e.pointerType === 'pen') { this.penSeen = true; return true; }
    return !(this.penSeen && e.pointerType === 'touch');
  }
  down(e) {
    if (!this.accept(e)) return;
    e.preventDefault(); this.c.setPointerCapture?.(e.pointerId);
    const p = this.pos(e);
    if (this.tool === 'eraser') { this.cur = { erase: true, id: e.pointerId }; this.eraseAt(p); return; }
    this.cur = { id: e.pointerId, color: this.color, w: e.pointerType === 'pen' ? 2.2 : 3, pts: [p] };
    this.strokes.push(this.cur);
    this.onChange?.();
  }
  move(e) {
    if (!this.cur || e.pointerId !== this.cur.id) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (this.cur.erase) { evs.forEach((ev) => this.eraseAt(this.pos(ev))); return; }
    for (const ev of evs) this.cur.pts.push(this.pos(ev));
    this.drawStroke(this.cur, Math.max(0, this.cur.pts.length - evs.length - 1));
  }
  up(e) { if (this.cur && e.pointerId === this.cur.id) { this.cur = null; this.onChange?.(); } }
  eraseAt([x, y]) {
    const before = this.strokes.length;
    this.strokes = this.strokes.filter((s) => !s.pts.some(([px, py]) => Math.hypot(px - x, py - y) < 14));
    if (this.strokes.length !== before) { this.redraw(); this.onChange?.(); }
  }
  drawStroke(s, from = 0, ctx = this.ctx) {
    ctx.strokeStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pts = s.pts;
    if (pts.length === 1) { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], s.w * 0.8, 0, 7); ctx.fill(); return; }
    for (let i = Math.max(1, from); i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1, p] = pts[i];
      ctx.lineWidth = s.w * (0.55 + p * 0.9);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
  }
  redraw() { this.ctx.clearRect(0, 0, this.w, this.h); this.strokes.forEach((s) => this.drawStroke(s)); }
  undo() { this.strokes.pop(); this.redraw(); this.onChange?.(); }
  clear() { this.strokes = []; this.redraw(); this.onChange?.(); }
  hasInk() { return this.strokes.some((s) => s.pts.length > 2); }
  /** 导出有字迹的区域（白底 PNG，最长边 ≤ 1100） */
  toDataURL() {
    if (!this.hasInk()) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of this.strokes) for (const [x, y] of s.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const m = 24; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(this.w, x1 + m); y1 = Math.min(this.h, y1 + m);
    const w = x1 - x0, h = y1 - y0, k = Math.min(2, 1100 / Math.max(w, h));
    const out = document.createElement('canvas'); out.width = Math.round(w * k); out.height = Math.round(h * k);
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
    ctx.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
    this.strokes.forEach((s) => this.drawStroke(s, 0, ctx));
    return out.toDataURL('image/png');
  }
}
