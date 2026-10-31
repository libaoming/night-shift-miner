// 指路回归：把 index.html 里 solveNext 的 BFS 复制一份，对 12 关开局逐一求解。
// ⚠️ 与 index.html 的 solveNext 保持同步（规则改这里也要改）。
const fs=require('fs');
const src=fs.readFileSync(process.argv[2]||'index.html','utf8');
const m=src.match(/\/\*LEVELS-START\*\/([\s\S]*?)\/\*LEVELS-END\*\//);
const {COLS,ROWS,LEVELS}=new Function(m[1]+';return {COLS,ROWS,LEVELS};')();
const N=COLS*ROWS;
const JUMP_ARC_MODELS=true; // 与游戏一致：平跳优先、斜上次之

let bad=0,slow=0;
LEVELS.forEach((L,li)=>{
  const grid=[],gold=new Uint8Array(N),hidden=[];
  let P=null;
  for(let y=0;y<ROWS;y++){const row=[];
    for(let x=0;x<COLS;x++){
      const ch=L.map[y][x];let t=' ';
      if(ch==='#'||ch==='@'||ch==='H'||ch==='-')t=ch;
      else if(ch==='$'){gold[y*COLS+x]=1;}
      else if(ch==='S')hidden.push([x,y]);
      else if(ch==='P'){P=[x,y];}
      row.push(t);
    }
    grid.push(row);}
  const tile=(x,y)=>(x<0||x>=COLS||y<0||y>=ROWS)?'@':grid[y][x];
  const exitOpen=false;
  const p={x:P[0],y:P[1]};
  const guards=[]; // 开局指路没有守卫带金
  // ↓↓↓ 与 index.html solveNext 同步 ↓↓↓
  const gi=new Map();
  for(let i=0;i<N;i++) if(gold[i]) gi.set(i,gi.size);
  for(const g of guards) if(!g.dead&&g.gold&&!gi.has(g.y*COLS+g.x)) gi.set(g.y*COLS+g.x,gi.size);
  const FULL=(1<<gi.size)-1;
  const hidSet=new Set(hidden.map(([hx,hy])=>hy*COLS+hx));
  const gT=(x,y,mk)=>{ if(x<0||x>=COLS||y<0||y>=ROWS) return '@'; const c=tile(x,y); if(c==='o') return ' '; if(mk===FULL&&!exitOpen&&hidSet.has(y*COLS+x)) return 'H'; return c;};
  const solC=c=>c==='#'||c==='@';
  const sol=(x,y,mk)=>solC(gT(x,y,mk));
  const sup=(x,y,mk)=>{const c=gT(x,y,mk),b=gT(x,y+1,mk);return c==='H'||c==='-'||solC(b)||b==='H';};
  const key=(x,y,mk)=>(mk*ROWS+y)*COLS+x;
  const seen=new Set([key(p.x,p.y,0)]);
  const q=[[p.x,p.y,0,null]];
  const t0=process.hrtime.bigint();
  let ans=null, isSlow=false;
  for(let h=0;h<q.length&&!ans;h++){
    if((h&8191)===0&&Number(process.hrtime.bigint()-t0)/1e6>80){isSlow=true;break;}
    const [x,y,mk,a0]=q[h];
    if(mk===FULL&&y===0){ans=a0;break;}
    const push=(nx,ny,a)=>{const i=ny*COLS+nx;let mm=mk; if(i>=0&&i<N&&gi.has(i)) mm|=1<<gi.get(i); const k=key(nx,ny,mm); if(seen.has(k))return; seen.add(k); q.push([nx,ny,mm,a0||a]);};
    const c=gT(x,y,mk);
    if(!sup(x,y,mk)){push(x,y+1,{kind:'move',dir:'D'});continue;}
    for(const d of [-1,1]){
      const D=d<0?'L':'R';
      if(!sol(x+d,y,mk)) push(x+d,y,{kind:'move',dir:D});
      if(!sol(x+d,y,mk)&&!sol(x+2*d,y,mk)) push(x+2*d,y,{kind:'jump',dir:D});
      else if(!sol(x,y-1,mk)&&!sol(x+d,y-1,mk)&&!sol(x+2*d,y-1,mk)) push(x+2*d,y-1,{kind:'jump',dir:D});
      const tx=x+d,ti=y*COLS+tx;
      const blockedByGold=gi.has(ti)&&!(mk&(1<<gi.get(ti)));
      if(gT(tx,y+1,mk)==='#'&&gT(tx,y,mk)===' '&&!blockedByGold){
        if(!sol(tx,y+2,mk)) push(tx,y+2,{kind:'dig',dir:d});
        for(const s2 of [-1,1]) if(!sol(tx+s2,y+1,mk)) push(tx+s2,y+1,{kind:'dig',dir:d});
      }
    }
    if(c==='H'&&!sol(x,y-1,mk)) push(x,y-1,{kind:'move',dir:'U'});
    if(!sol(x,y+1,mk)) push(x,y+1,{kind:'move',dir:'D'});
  }
  const tag='B'+String(li+1).padStart(2,'0')+' '+L.name;
  if(ans) console.log('OK  ',tag,'第一步',JSON.stringify(ans),'状态',seen.size);
  else if(isSlow){console.log('SLOW',tag,'80ms 内未收敛（游戏内会提示「这层太绕」）');slow++;}
  else {console.log('FAIL',tag,'无解');bad++;}
});
console.log(bad?('RESULT: '+bad+' 关指路失败'):('RESULT: HINT_OK '+(LEVELS.length-slow)+'/'+LEVELS.length+(slow?'（'+slow+' 关算不动）':'')));
process.exit(bad?1:0);
