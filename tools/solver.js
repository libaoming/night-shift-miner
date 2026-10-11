// 关卡求解器：忽略守卫，按游戏的移动规则做 BFS（位置 × 已收金块）。
// 挖洞按保守模型算：挖一个洞、立刻穿过去，洞随即视为合上（不依赖多个洞同时存在）。
const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
const m=src.match(/\/\*LEVELS-START\*\/([\s\S]*?)\/\*LEVELS-END\*\//);
const {COLS,ROWS,LEVELS}=new Function(m[1]+';return {COLS,ROWS,LEVELS};')();
let bad=0;
LEVELS.forEach((L,li)=>{
  const tag='B'+String(li+1).padStart(2,'0')+' '+L.name;
  const errs=[];
  if(L.map.length!==ROWS) errs.push('行数='+L.map.length);
  L.map.forEach((r,y)=>{ if(r.length!==COLS) errs.push('第'+y+'行宽='+r.length); if(/[^.#@H\-$SPE]/.test(r)) errs.push('第'+y+'行有非法字符'); });
  if(errs.length){console.log('FAIL',tag,errs.join('; '));bad++;return;}
  const base=[],golds=[],hid=[],guards=[];let P=null;
  for(let y=0;y<ROWS;y++){const row=[];for(let x=0;x<COLS;x++){const ch=L.map[y][x];let t=' ';
    if('#@H-'.includes(ch))t=ch; else if(ch==='$')golds.push([x,y]); else if(ch==='S')hid.push([x,y]); else if(ch==='P')P=[x,y]; else if(ch==='E')guards.push([x,y]);
    row.push(t);}base.push(row);}
  if(!P){console.log('FAIL',tag,'没有 P');bad++;return;}
  if(!hid.some(([x,y])=>y===0)) errs.push('出口梯没到第 0 行');
  const open=base.map(r=>r.slice()); hid.forEach(([x,y])=>open[y][x]='H');
  const gi=new Map(golds.map(([x,y],i)=>[y*COLS+x,i]));
  const FULL=(1<<golds.length)-1;
  const solid=c=>c==='#'||c==='@';
  const T=(g,x,y)=>(x<0||x>=COLS||y<0||y>=ROWS)?'@':g[y][x];
  const sup=(g,x,y)=>{const c=T(g,x,y),b=T(g,x,y+1);return c==='H'||c==='-'||solid(b)||b==='H';};
  [P,...guards].forEach(([x,y],i)=>{ if(!sup(base,x,y)) errs.push((i?'守卫':'矿工')+'出生点悬空 '+x+','+y); });
  golds.forEach(([x,y])=>{ if(!sup(base,x,y)) errs.push('金块悬空 '+x+','+y); });
  // BFS
  const key=(x,y,mk)=>(mk*ROWS+y)*COLS+x;
  const seen=new Map(); const q=[];
  const push=(x,y,mk,d,digs)=>{ const i=gi.get(y*COLS+x); if(i!=null) mk|=1<<i; const k=key(x,y,mk); if(seen.has(k))return; seen.set(k,1); q.push([x,y,mk,d,digs]); };
  push(P[0],P[1],0,0,0);
  let ans=null, maxGold=0;
  for(let h=0;h<q.length;h++){
    const [x,y,mk,d,digs]=q[h]; const g=mk===FULL?open:base;
    let cnt=0; for(let b=mk;b;b>>=1) cnt+=b&1; if(cnt>maxGold) maxGold=cnt;
    if(mk===FULL&&y===0){ans=[d,digs];break;}
    const c=T(g,x,y),b=T(g,x,y+1);
    if(!sup(g,x,y)){push(x,y+1,mk,d+1,digs);continue;}
    for(const dx of [-1,1]) if(!solid(T(g,x+dx,y))) push(x+dx,y,mk,d+1,digs);
    if(c==='H'&&!solid(T(g,x,y-1))) push(x,y-1,mk,d+1,digs);
    if(!solid(b)) push(x,y+1,mk,d+1,digs);
    for(const dx of [-1,1]){
      const tx=x+dx,ty=y+1, gidx=gi.get(y*COLS+tx);
      if(T(g,tx,ty)!=='#'||T(g,tx,y)!==' ') continue;
      if(gidx!=null&&!(mk&(1<<gidx))) continue;
      if(!solid(T(g,tx,ty+1))) push(tx,ty+1,mk,d+3,digs+1);      // 穿过洞往下
      for(const sx of [-1,1]) if(!solid(T(g,tx+sx,ty))) push(tx+sx,ty,mk,d+3,digs+1); // 从洞里横着走出去
    }
  }
  if(errs.length){console.log('FAIL',tag,errs.join('; '));bad++;return;}
  if(!ans){console.log('FAIL',tag,'无解，最多收到 '+maxGold+'/'+golds.length);bad++;return;}
  console.log('OK  ',tag.padEnd(10),'金块',String(golds.length).padStart(2),'守卫',guards.length,'最短',String(ans[0]).padStart(3),'步，其中挖',ans[1],'次');
});
console.log(bad?('RESULT: '+bad+' 关有问题'):'RESULT: ALL_SOLVABLE '+LEVELS.length);
process.exit(bad?1:0);
