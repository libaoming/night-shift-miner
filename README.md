# Night Shift Miner (掘金夜班)

English | [简体中文](README.zh-CN.md)

A dig-and-climb puzzle platformer for your phone, in the spirit of the 1983 classic Lode Runner. One HTML file, no dependencies, no build step. Load it once and it keeps working offline, which makes it a good fit for a flight.

<img src="docs/screenshot.png" alt="Level B05 on a phone screen" width="300">

## Play

Open `index.html` in any browser. On a phone, the easiest route is GitHub Pages (Settings → Pages → deploy from `main`), then "Add to Home Screen".

| Action | Touch | Keyboard |
|---|---|---|
| Move / climb | D-pad | Arrow keys or WASD |
| Jump two tiles | 跳 | Space |
| Dig lower-left / lower-right | 挖左 / 挖右 | Z / X (or Q / E) |
| Toggle slow motion (0.1×) | 时缓 | Shift |
| Pause | Pause button | P or Esc |
| Restart level | Pause menu | R |

## Rules

- Collect every gold bar. The exit ladder then drops from the top; climb to the top row to finish the level.
- You can dig brick diagonally below you. Grey stone cannot be dug.
- You can jump: hold a direction and jump over a one-tile gap, or up onto a one-tile-high ledge. The arc is high enough to clear a guard's head. Guards cannot jump.
- Slow motion slows everything — you, the guards, and the hole countdown — to 0.1×. Press again to go back to full speed.
- Stuck? Pause and tap "Point the way" — an arrow shows the optimal next step (guards are ignored; gold a guard carries counts as being under it).
- A hole closes after 7 seconds. Anything still inside is crushed, you included.
- Guards cannot see holes. A guard that falls in is stuck for 3.4 seconds, and you can walk across its head.
- Guards pick up gold. Trap one and the gold drops at the edge of the hole.
- There are 12 levels (B01 to B12). All are open from the start; your best time per level is saved in the browser. The screen stays awake while you play.

## How it works

```
requestAnimationFrame
  └─ frame(dt)
       ├─ update(dt × timeScale)        only while state === 'play' and no menu is open
       │    ├─ holes: count down → refill → crush whatever is inside
       │    ├─ updatePlayer             playerChoose → startMove → advance → playerArrive
       │    │                           (gravity, input, dig, jump, gold pickup, exit check)
       │    ├─ updateGuard × n          guardAI (BFS towards the player; holes look solid)
       │    │                           → guardChoose → advance → guardArrive (trap, gold)
       │    └─ collision                guard within 0.6 tile of the player → die
       └─ draw()                        tiles → holes → gold → guards → player
```

Movement is tile-based with interpolation: an entity's `x, y` is the tile it is heading to, `fx, fy` the tile it left, `t` the progress between them. Every rule is decided on whole tiles, so the solver and the game agree.

## Level format

Levels are 16×16 strings near the top of the script in `index.html`:

| Char | Meaning |
|---|---|
| `#` | brick (diggable) |
| `@` | stone |
| `H` | ladder |
| `-` | rope |
| `$` | gold |
| `S` | exit ladder, hidden until all gold is collected |
| `P` | player start |
| `E` | guard start |
| `.` | empty |

## Checks

```bash
node tools/solver.js index.html
```

The solver runs a BFS over (position × collected gold) for every level and fails if a level cannot be finished. It ignores guards and uses a conservative digging model (one hole at a time), so a pass means the level is completable without multi-hole tricks. It does not prove a level is fair against the guards. Each level is solved twice, without and with jump moves; if jumping cuts the shortest solution below 55% of the no-jump one, the solver prints a WARN so the level can be reviewed by hand.

`tools/e2e.js` is a fourteen-step browser smoke test (walk, climb, dig, fall, pick up gold, jump, slow motion, hint, pause, hole refill). Paste it into the console on level B01, or run it with a headless browser.

## Credits

Built in one session with Claude Code, after seeing Boris Cherny ask Claude for a phone game to play on a flight: https://x.com/bcherny/status/2108004023249088528

This is an original game with its own levels, art and code. Lode Runner is a trademark of its respective owner; this project is not affiliated with it.

## License

MIT
