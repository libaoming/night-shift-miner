// 端到端冒烟测试：在浏览器里打开 index.html（从第 1 层开始），把这段脚本整体丢进控制台或 `agent-browser eval`。
// 返回 9 行 PASS/FAIL。只用键盘事件驱动，读 window.__yeban.s 判定。
(async()=>{
  const st=()=>window.__yeban.s, sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const key=(type,k)=>window.dispatchEvent(new KeyboardEvent(type,{key:k,bubbles:true}));
  const log=[]; const ok=(name,cond)=>log.push((cond?'PASS ':'FAIL ')+name+' '+JSON.stringify(st()));
  const until=async(fn,ms)=>{const t=Date.now(); while(Date.now()-t<ms){ if(fn()) return true; await sleep(16);} return false;};
  ok('开局是 ready，矿工在 (1,14)', st().state==='ready'&&st().px===1&&st().py===14);
  key('keydown','ArrowRight'); await until(()=>st().px>=5,4000); key('keyup','ArrowRight');
  ok('按右：开工并走到梯子列', st().state==='play'&&st().px===5&&st().py===14);
  key('keydown','ArrowUp'); await until(()=>st().py<=10,4000); key('keyup','ArrowUp');
  await sleep(300);
  ok('按上：爬到梯顶 (5,10)', st().px===5&&st().py===10);
  key('keydown','x'); key('keyup','x'); await until(()=>st().holes===1,1000);
  ok('按 X：右下方挖出一个洞', st().holes===1);
  key('keydown','ArrowRight'); await sleep(120); key('keyup','ArrowRight');
  await until(()=>st().py===14,3000);
  ok('走进洞：穿过砖层落到 (6,14)', st().px===6&&st().py===14);
  key('keydown','ArrowRight'); await until(()=>st().goldGot>=1,3000); key('keyup','ArrowRight');
  ok('捡到第一块金', st().goldGot===1);
  key('keydown','p'); await sleep(100);
  ok('按 P：暂停菜单打开', st().menu==='pause');
  const a=st().px; key('keydown','ArrowLeft'); await sleep(300); key('keyup','ArrowLeft');
  ok('暂停时不响应移动', st().px===a);
  key('keydown','p'); await sleep(9000);
  ok('8.5 秒后洞已回填', st().holes===0&&st().menu===null);
  return log.join('\n');
})()
