// 端到端冒烟测试：在浏览器里打开 index.html（从第 1 层开始），把这段脚本整体丢进控制台或 `agent-browser eval`。
// 返回 14 行 PASS/FAIL。只用键盘事件驱动，读 window.__yeban.s 判定。
(async()=>{
  const st=()=>window.__yeban.s, sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const key=(type,k)=>window.dispatchEvent(new KeyboardEvent(type,{key:k,bubbles:true}));
  const log=[]; const ok=(name,cond)=>log.push((cond?'PASS ':'FAIL ')+name+' '+JSON.stringify(st()));
  const until=async(fn,ms)=>{const t=Date.now(); while(Date.now()-t<ms){ if(fn()) return true; await sleep(16);} return false;};
  // 打开暂停菜单里「指个路」：算出第一步并在棋盘上画出箭头
  const pauseCard=()=>document.querySelector('#card');
  const hintOnce=async()=>{
    key('keydown','p'); await sleep(150);
    const b=[...pauseCard().querySelectorAll('button')].find(x=>x.textContent.includes('指个路'));
    if(!b) return false;
    b.click(); await sleep(150);
    return true;
  };
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
  await sleep(150);
  key('keydown','ArrowLeft'); await until(()=>st().px<=7,3000); key('keyup','ArrowLeft');
  await sleep(300);
  const jx=st().px;
  key('keydown',' '); key('keyup',' ');
  await until(()=>st().px<=jx-2,2000);
  ok('空格：朝面朝方向平跳两格', st().px===jx-2&&st().py===14);
  key('keydown','Shift'); await sleep(60); key('keyup','Shift');
  ok('按 Shift：时缓开，世界变 0.1 倍', st().tscale===0.1);
  key('keydown','Shift'); await sleep(60); key('keyup','Shift');
  ok('再按 Shift：恢复原速', st().tscale===1);
  const hinted=await hintOnce();
  ok('暂停菜单「指个路」：棋盘上出现箭头', hinted&&!!st().hint);
  key('keydown','p'); await sleep(100);
  ok('按 P：暂停菜单打开', st().menu==='pause');
  const a=st().px; key('keydown','ArrowLeft'); await sleep(300); key('keyup','ArrowLeft');
  ok('暂停时不响应移动', st().px===a);
  key('keydown','p'); await sleep(9000);
  ok('8.5 秒后洞已回填', st().holes===0&&st().menu===null);
  // B04 开局指路：曾因掩码/边界两个 bug 四关必死，回归断言
  key('keydown','p'); await sleep(150);
  const selB=[...document.querySelectorAll('#card button')].find(x=>x.textContent==='选层');
  selB.click(); await sleep(150);
  const b04=[...document.querySelectorAll('.lvbtn')].find(x=>x.textContent.startsWith('B04'));
  b04.click(); await sleep(400);
  key('keydown','p'); await sleep(150);
  const hb=[...document.querySelectorAll('#card button')].find(x=>x.textContent.includes('指个路'));
  hb.click(); await sleep(250);
  ok('B04 开局指路：给出箭头（掩码回归）', !!st().hint);
  return log.join('\n');
})()
