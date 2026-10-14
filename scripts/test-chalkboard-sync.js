// Playwright browser_run_code_unsafe function file; opens only local template HTML.
async (page) => {
  const results = [];
  const errors = [];
  const check = (condition, name) => {
    if (!condition) throw new Error(name);
    results.push(name);
  };
  const monitor = target => target.on('pageerror', error => errors.push(error.message));
  monitor(page);
  for (const target of page.context().pages()) if (target !== page) await target.close();
  // Open this template's course.html before running this function file.
  const courseURL = new URL('course.html', page.url());
  if (courseURL.protocol !== 'file:') throw new Error('Start on the local template course.html');
  await page.goto(courseURL.href);
  await page.waitForFunction(() => window.Reveal?.isReady());
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => Reveal.slide(2));
  await page.waitForTimeout(950);
  const data = frame => frame.evaluate(() => JSON.parse(Reveal.getPlugin('RevealChalkboard').getData()));
  const count = (value, id = 0, h = 2, type = 'draw') => value[id].data
    .filter(s => s.slide.h === h).flatMap(s => s.events).filter(e => e.type === type).length;
  const mode = frame => frame.evaluate(() => document.querySelector('#chalkboard').style.visibility);
  async function pen(frame) {
    await frame.evaluate(() => {
      if (document.querySelector('#notescanvas').style.pointerEvents === 'none')
        Reveal.getPlugin('RevealChalkboard').toggleNotesCanvas();
    });
  }
  async function stroke(frame, owner, id, y, button = 'left') {
    const locator = frame.locator(id === 0 ? '#notescanvas canvas' : '#chalkboard canvas');
    const box = await locator.boundingBox();
    const size = await frame.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    const scale = Math.min(size.width / 1024, size.height / 768);
    const offsetX = (size.width - 1024 * scale) / 2;
    const offsetY = (size.height - 768 * scale) / 2;
    // The stock sponge cursor's hotspot is its upper-left corner.
    const radius = button === 'right' ? 20 : 0;
    const point = x => ({ x: box.x + (offsetX + (x - radius) * scale) * box.width / size.width,
      y: box.y + (offsetY + (y - radius) * scale) * box.height / size.height });
    await owner.bringToFront();
    const start = point(300), end = point(650);
    await owner.mouse.move(start.x, start.y);
    await owner.mouse.down({ button });
    await owner.mouse.move(end.x, end.y, { steps: 12 });
    await owner.mouse.up({ button });
    await page.waitForTimeout(180);
  }
  const ink = (frame, id, y) => frame.evaluate(({ id, y }) => {
    const canvas = document.querySelector(id === 0 ? '#notescanvas canvas' : '#chalkboard canvas');
    const scale = Math.min(canvas.width / 1024, canvas.height / 768);
    const x = (canvas.width - 1024 * scale) / 2 + 320 * scale;
    const top = (canvas.height - 768 * scale) / 2 + y * scale;
    const values = canvas.getContext('2d').getImageData(Math.round(x), Math.round(top - 5), Math.round(300 * scale), 11).data;
    let amount = 0;
    for (let i = 3; i < values.length; i += 4) {
      // Exclude the stock blackboard's dark grid; count the white chalk itself.
      if (values[i] && (id === 0 || values[i - 3] > 100 || values[i - 2] > 100 || values[i - 1] > 100)) amount++;
    }
    return amount;
  }, { id, y });
  async function openSpeaker() {
    await page.bringToFront();
    await page.waitForTimeout(150);
    const opening = page.waitForEvent('popup', { timeout: 5000 });
    await page.keyboard.press('s');
    const popup = await opening;
    monitor(popup);
    await popup.setViewportSize({ width: 1200, height: 900 });
    await popup.waitForTimeout(1800);
    const current = popup.frames().find(f => f.url().includes('postMessageEvents=true'));
    check(!!current, 'current-slide iframe exists');
    await current.waitForFunction(() => window.Reveal?.isReady());
    return { popup, current, upcoming: popup.frames().find(f => f.url().includes('controls=false')) };
  }

  await pen(page);
  await stroke(page, page, 0, 240);
  let { popup, current, upcoming } = await openSpeaker();
  check(count(await data(current)) === 12, 'opening restores pre-existing main-window strokes');
  check(await ink(current, 0, 240) > 200, 'restored strokes are painted in the current iframe');
  await pen(current);
  await stroke(current, popup, 0, 400);
  check(count(await data(page)) === 24 && count(await data(current)) === 24, 'speaker-to-main stroke exactly once');
  check(await ink(page, 0, 400) > 200, 'speaker stroke painted at matching normalized coordinates');
  await stroke(page, page, 0, 520);
  check(count(await data(current)) === 36, 'main-to-speaker stroke exactly once');
  await stroke(current, popup, 0, 400, 'right');
  check(await ink(page, 0, 400) === 0 && await ink(current, 0, 400) === 0, 'speaker eraser removes the same pixels in both windows');
  check(count(await data(page), 0, 2, 'erase') === count(await data(current), 0, 2, 'erase'), 'eraser events do not loop');
  await current.getByRole('button', { name: '删除涂鸦', exact: true }).click();
  await page.waitForTimeout(150);
  check(await ink(page, 0, 240) === 0 && await ink(page, 0, 520) === 0, 'speaker clear removes the current annotation canvas');
  await stroke(current, popup, 0, 300);

  await current.evaluate(() => Reveal.getPlugin('RevealChalkboard').toggleChalkboard());
  await page.waitForTimeout(150);
  check(await mode(page) === 'visible', 'speaker opens the main blackboard');
  await stroke(current, popup, 1, 300);
  check(count(await data(page), 1) === 12, 'blackboard zero drawing is synchronized');
  await current.locator('#nextboard').click();
  await stroke(current, popup, 1, 500);
  check((await data(page))[1].data.flatMap(s => s.events).some(e => e.type === 'draw' && e.board === 1), 'blackboard one retains its own drawing');
  await current.locator('#previousboard').click();
  await page.waitForTimeout(150);
  check(await ink(page, 1, 300) > await ink(page, 1, 500) + 200, 'switching to board zero restores its stroke only');
  await current.locator('#nextboard').click();
  await page.waitForTimeout(150);
  check(await ink(page, 1, 500) > await ink(page, 1, 300) + 200, 'switching to board one restores its stroke only');
  await popup.close();
  ({ popup, current, upcoming } = await openSpeaker());
  check(await mode(current) === 'visible', 'reopening restores an open blackboard');
  check(await ink(current, 1, 500) > await ink(current, 1, 300) + 100, 'reopening restores the selected blackboard');
  check(count(await data(current), 1) === 24, 'reopening restores all blackboard events');
  await current.evaluate(() => Reveal.getPlugin('RevealChalkboard').toggleChalkboard());
  await page.waitForTimeout(150);
  check(await mode(page) === 'hidden', 'speaker closes the main blackboard');
  await page.evaluate(() => Reveal.getPlugin('RevealChalkboard').toggleChalkboard());
  await page.waitForTimeout(150);
  check(await mode(current) === 'visible', 'main opens the speaker blackboard');
  await page.evaluate(() => Reveal.getPlugin('RevealChalkboard').toggleChalkboard());
  await page.waitForTimeout(150);
  check(await mode(current) === 'hidden', 'main closes the speaker blackboard');

  await page.evaluate(() => Reveal.slide(4));
  await page.waitForTimeout(1000);
  check((await current.evaluate(() => Reveal.getIndices())).h === 4, 'normal notes navigation still synchronizes');
  check(await ink(page, 0, 300) === 0 && await ink(current, 0, 300) === 0, 'page change does not carry previous-page ink');
  await pen(current);
  await stroke(current, popup, 0, 450);
  check(count(await data(page), 0, 4) === 12, 'new-page drawing is stored on the new page');
  await current.evaluate(() => Reveal.slide(2));
  await page.waitForTimeout(1000);
  check((await page.evaluate(() => Reveal.getIndices())).h === 2, 'speaker navigation still drives the main window');
  check(await ink(page, 0, 300) > 200 && await ink(current, 0, 300) > 200, 'returning restores original-page ink');
  check(await ink(page, 0, 450) === 0, 'returning does not mix pages');
  await popup.setViewportSize({ width: 1500, height: 700 });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(300);
  check(await ink(page, 0, 300) > 200 && await ink(current, 0, 300) > 100, 'different resized windows repaint the correct coordinates');

  // A real message from the upcoming WindowProxy must be ignored by the host.
  const before = JSON.stringify(await data(page));
  await upcoming.evaluate(() => parent.opener.postMessage(JSON.stringify({
    namespace: 'course-chalkboard-sync-v1', type: 'operation', data: {
      slide: { h: 2, v: 0 }, page: 2, content: { sender: 'chalkboard-plugin', type: 'clear', mode: 0, board: 0, timestamp: 999999 }
    }
  }), '*'));
  await page.waitForTimeout(100);
  check(JSON.stringify(await data(page)) === before, 'upcoming preview cannot modify main-window ink');
  check(count(await data(upcoming)) === 0, 'upcoming preview receives no synchronized strokes');

  // Deliver an old-page event through the legitimate current WindowProxy.
  await page.evaluate(() => Reveal.slide(4));
  await page.waitForTimeout(1000);
  const oldCount = count(await data(page));
  await current.evaluate(() => parent.opener.postMessage(JSON.stringify({
    namespace: 'course-chalkboard-sync-v1', type: 'operation', data: {
      slide: { h: 2, v: 0 }, page: 2, content: { sender: 'chalkboard-plugin', type: 'draw', mode: 0, board: 0, timestamp: 999999,
        fromX: 300, fromY: 620, toX: 650, toY: 620, color: 0 }
    }
  }), '*'));
  await page.waitForTimeout(150);
  check(count(await data(page)) === oldCount + 1 && count(await data(page), 0, 4) === 12, 'late message remains on its original page');
  check(await ink(page, 0, 620) === 0, 'late message does not paint on the new page');
  await page.evaluate(() => Reveal.slide(2));
  await page.waitForTimeout(950);
  check(await ink(page, 0, 620) > 200, 'late message is restored on return to its original page');
  await popup.close();
  ({ popup, current } = await openSpeaker());
  check(count(await data(current)) === count(await data(page)), 'reopening restores the authoritative main-window history');
  check(await ink(current, 0, 620) > 100, 'reopening repaints late-message history');
  const stable = count(await data(page));
  await page.waitForTimeout(500);
  check(count(await data(page)) === stable && count(await data(current)) === stable, 'idle synchronization causes no duplicate events');
  await current.evaluate(() => Reveal.getPlugin('RevealChalkboard').toggleChalkboard());
  await current.evaluate(() => Reveal.getPlugin('RevealChalkboard').clear());
  await page.waitForTimeout(150);
  check(await ink(page, 1, 500) < 150, 'clearing board one removes its stroke in the main window');
  await current.locator('#previousboard').click();
  await page.waitForTimeout(150);
  check(await ink(page, 1, 300) > 200, 'clearing board one preserves board zero');
  await current.locator('#nextboard').click();
  await popup.close();
  ({ popup, current } = await openSpeaker());
  check(await mode(current) === 'visible' && await ink(current, 1, 500) < 150,
    'reopening restores the selected cleared blackboard');
  await current.locator('#previousboard').click();
  await page.waitForTimeout(150);
  check(await ink(current, 1, 300) > 200, 'reopening retains the other blackboard');
  await current.evaluate(() => Reveal.getPlugin('RevealChalkboard').toggleChalkboard());
  await page.evaluate(() => Reveal.getPlugin('RevealChalkboard').clear());
  await page.waitForTimeout(150);
  check(await ink(current, 0, 300) === 0 && await ink(current, 0, 620) === 0, 'main-window clear synchronizes to the speaker');
  await page.evaluate(() => Reveal.slide(4));
  await page.waitForTimeout(950);
  check(await ink(page, 0, 450) > 200, 'clearing page two preserves page four');
  await pen(page);
  await stroke(page, page, 0, 450, 'right');
  check(await ink(page, 0, 450) === 0 && await ink(current, 0, 450) === 0, 'main-window eraser synchronizes to the smaller speaker canvas');
  await popup.setViewportSize({ width: 1400, height: 750 });
  await page.waitForTimeout(150);
  check(await ink(current, 0, 450) === 0, 'resize replay retains normalized erasure');
  check(errors.length === 0, 'no page JavaScript errors');
  return { browser: page.context().browser().version(), protocol: 'file:', passed: results.length, results, errors };
}
