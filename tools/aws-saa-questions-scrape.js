/**
 * 考试宝 (kaoshibao.com) 顺序练习页面 —— 单题抓取脚本 v3
 *
 * 和 scrape.js（v1）的区别：
 *   v1 会在当前标签页里循环点「下一题」、一口气抓 N 道题。
 *   这一版每次只处理当前这一页：捕获本题、点答题卡里的下一题、把下一题地址交回去。
 *   真正的循环由外部完成（换地址、重新打开页面、再跑一遍本脚本）。
 *
 * 整体流程（脚本只负责第 2～5 步；第 1、6 步在浏览器/外部执行）：
 *   1. 输入地址（打开目标练习页）
 *   2. 使用脚本捕获题目相关信息
 *   3. 点击答题卡中下个题目，获取下个题目的地址
 *   4. 返回题目相关信息和下个题目地址
 *   5. 输出题目 json 文件
 *   6. 使用下个地址，重新从第 1 步开始执行
 *
 * 适用页面：
 *   https://www.kaoshibao.com/online/?paperId=<xxx>&...&sequence=<n>&qtype_random_index=<n>
 *
 * 使用前必须在页面右侧「设置」面板里手动确认两个开关（和 v1 相同）：
 *   1. 「答对自动下一题」—— 关闭。
 *   2. 「背题模式」—— 开启。
 *      开启后正确答案和解析会直接显示，脚本不用点选项，也就不会写入账号作答记录。
 *
 * 用法（浏览器控制台）：
 *   1. 打开目标练习页，确认上面两个开关，停在要抓的那一题。
 *   2. 粘贴本文件全部内容并回车。脚本会立即跑一次（自执行）：
 *        - 等当前题解析区域出现
 *        - 从 DOM 抓本题
 *        - 触发浏览器下载 `<index>.json`
 *        - 点击答题卡里「当前题号 + 1」的格子
 *        - 等题号/地址变化后，把下一题地址记下来
 *   3. 返回值挂在 window.__lastScrapeV3，结构见下方。
 *      控制台也会打印 nextUrl。下一轮用这个地址重新打开页面，再粘贴本脚本。
 *   4. 已经是最后一题时：不点答题卡，nextUrl 为 null，done 为 true。
 *
 * 返回值 window.__lastScrapeV3：
 *   {
 *     question: { index, total, type, question, options, answer, qid? },
 *     nextUrl: "https://..." | null,
 *     filename: "12.json",
 *     done: false
 *   }
 *
 * 输出的题目记录结构（和 v1 一致，能从页面 Vue 状态读到时会多一个 qid）：
 *   {
 *     index: 2,
 *     total: 1018,
 *     type: "单选题",
 *     question: "...",
 *     options: ["A. ...", "B. ...", ...],
 *     answer: {
 *       "正确答案": "C",
 *       "解析": "..." | null,     // 只取「原解析」
 *       "AI解析": "..." | null    // 单独取「AI解析」区块；折叠状态下 DOM 里已有全文
 *     }
 *   }
 *
 * 已知限制：
 *   - 依赖当前页面 DOM（题目区、答题卡格子）。网站改版后选择器可能失效。
 *   - 答题卡通过「格子纯数字文案 === 下一题号」定位；点完后用题号变化确认翻页成功。
 *   - 下一题地址优先取点击后的 location.href；如果 SPA 没改 URL，则按当前地址改 sequence 拼出来。
 *   - 直接刷新带 sequence 的 URL，页面有时会回到上次做题进度（v1 实测过）。
 *     本脚本仍会返回点击后的地址，供外部流程使用；若打开后不是预期题号，先确认答题卡进度。
 */
(async function scrapeOne() {
  function text(el) { return el ? el.innerText.trim() : null; }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function getExplanation(detailEl) {
    if (!detailEl) return null;
    const blocks = Array.from(detailEl.querySelectorAll(':scope > .mb16'));
    const chosen = blocks.find(b => b.innerText.trim().startsWith('原解析'));
    if (!chosen) return null;
    let t = chosen.innerText.trim();
    t = t.replace(/^原解析\s*/, '');
    t = t.replace(/开通VIP查看完整解析\s*$/, '').trim();
    return t || null;
  }

  function getAIExplanation(detailEl) {
    if (!detailEl) return null;
    const blocks = Array.from(detailEl.querySelectorAll(':scope > .mb16'));
    const chosen = blocks.find(b => b.innerText.trim().startsWith('AI解析'));
    if (!chosen) return null;
    let p = chosen.querySelector('.answer-analysis-row > div:first-child > p');
    if (!p) p = chosen.querySelector('.answer-analysis-row p');
    if (p) return p.innerText.trim() || null;
    let t = chosen.innerText.trim().replace(/^AI解析\s*/, '');
    t = t.replace(/开通VIP查看完整解析\s*$/, '').trim();
    return t || null;
  }

  function scrapeCurrent() {
    const topic = document.querySelector('.topic.no-select');
    const scope = document.querySelector('.lianxi-left');
    if (!topic || !scope) {
      throw new Error('没找到题目区域（.topic.no-select / .lianxi-left），确认当前是顺序练习页且已加载完成');
    }
    const type = text(topic.querySelector('.topic-top .topic-type'));
    const numRaw = text(topic.querySelector('.topic-top .topic-num'));
    const questionText = text(topic.querySelector('.topic-top .qusetion-title'));
    const optionsContainer = topic.querySelector('.options-w');
    const options = optionsContainer
      ? Array.from(optionsContainer.querySelectorAll('.option')).map(o => {
          const t = o.innerText.trim();
          const m = t.match(/^([A-Z])\s*\n?([\s\S]*)$/);
          return m ? (m[1] + '. ' + m[2].trim()) : t;
        })
      : [];
    const rightText = text(scope.querySelector('.answer-right'));
    let correctAnswer = null;
    if (rightText) {
      const m = rightText.match(/正确答案\s*([A-Z]+)/);
      if (m) correctAnswer = m[1];
    }
    const detailEl = scope.querySelector('.answer-box-detail');
    const explanation = getExplanation(detailEl);
    const aiExplanation = getAIExplanation(detailEl);
    let index = null, total = null;
    if (numRaw) {
      const m = numRaw.match(/(\d+)\s*\/\s*(\d+)/);
      if (m) { index = parseInt(m[1], 10); total = parseInt(m[2], 10); }
    }
    return {
      index, total, type,
      question: questionText,
      options,
      answer: { "正确答案": correctAnswer, "解析": explanation, "AI解析": aiExplanation }
    };
  }

  function findVue(el) {
    let cur = el;
    while (cur) {
      if (cur.__vue__) return cur.__vue__;
      cur = cur.parentElement;
    }
    return null;
  }

  function attachQid(record) {
    try {
      const anchor = document.querySelector('.topic.no-select') || document.querySelector('.lianxi-left');
      const leaf = findVue(anchor);
      const vm = leaf && (leaf.$parent || leaf);
      if (vm && vm.$data && Array.isArray(vm.$data.listsIds) && record.index) {
        const qid = vm.$data.listsIds[record.index - 1];
        if (qid != null) return { qid: String(qid), ...record };
      }
    } catch (e) { /* qid 是附加字段，读不到就跳过 */ }
    return record;
  }

  async function waitReady(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const scope = document.querySelector('.lianxi-left');
      const detail = scope && scope.querySelector('.answer-box-detail');
      if (detail && detail.children[0] && detail.children[0].innerText.trim().length > 5) return true;
      await sleep(200);
    }
    return false;
  }

  function readIndex() {
    const numRaw = text(document.querySelector('.topic.no-select .topic-top .topic-num'));
    if (!numRaw) return null;
    const m = numRaw.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  function findAnswerSheetRoot() {
    const right = document.querySelector('.lianxi-right');
    const nodes = Array.from((right || document.body).querySelectorAll('div, p, span, h2, h3, h4, section'));
    const heading = nodes.find(el => {
      const own = Array.from(el.childNodes)
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent.trim())
        .join('');
      return own === '答题卡' || el.innerText.trim() === '答题卡';
    });
    if (heading) {
      let root = heading.parentElement;
      for (let i = 0; i < 4 && root; i++) {
        const numbered = collectNumberedCells(root);
        if (numbered.length >= 2) return root;
        root = root.parentElement;
      }
      return heading.parentElement || right;
    }
    return right || document.body;
  }

  function collectNumberedCells(root) {
    if (!root) return [];
    const byN = new Map();
    Array.from(root.querySelectorAll('div, li, span, a, button')).forEach(el => {
      const t = el.innerText.trim();
      if (!/^\d+$/.test(t)) return;
      const n = parseInt(t, 10);
      if (n < 1) return;
      if (el.children.length > 0) {
        const childIsSameNumber = Array.from(el.children).some(c => c.innerText.trim() === t);
        if (childIsSameNumber) return;
      }
      const prev = byN.get(n);
      if (!prev || t.length < prev.el.innerText.trim().length) {
        byN.set(n, { el, n });
      }
    });
    return Array.from(byN.values()).sort((a, b) => a.n - b.n);
  }

  function findSheetItem(n) {
    const items = collectNumberedCells(findAnswerSheetRoot());
    const hit = items.find(it => it.n === n);
    return hit ? hit.el : null;
  }

  function clickableTarget(el) {
    if (!el) return null;
    return el.closest('a, button, [role="button"]') || el;
  }

  function buildNextUrlFromLocation(nextIndex) {
    const url = new URL(location.href);
    if (url.searchParams.has('sequence')) {
      const cur = parseInt(url.searchParams.get('sequence'), 10);
      if (Number.isFinite(cur)) {
        url.searchParams.set('sequence', String(cur + 1));
        return url.toString();
      }
    }
    url.searchParams.set('sequence', String(nextIndex - 1));
    return url.toString();
  }

  function downloadQuestion(record) {
    const filename = String(record.index) + '.json';
    const blob = new Blob([JSON.stringify(record, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return filename;
  }

  async function waitIndexChange(fromIndex, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const now = readIndex();
      if (now != null && now !== fromIndex) return now;
      await sleep(150);
    }
    return readIndex();
  }

  const ready = await waitReady(6000);
  if (!ready) console.warn('等待解析区域超时，仍尝试抓取当前 DOM');

  const question = attachQid(scrapeCurrent());
  if (question.index == null) throw new Error('读不到当前题号（.topic-num），停止');

  const filename = downloadQuestion(question);
  const isLast = question.total != null && question.index >= question.total;

  if (isLast) {
    const result = { question, nextUrl: null, filename, done: true };
    window.__lastScrapeV3 = result;
    console.log('已是最后一题，json 已下载：' + filename);
    return result;
  }

  const nextIndex = question.index + 1;
  const nextCell = findSheetItem(nextIndex);
  if (!nextCell) {
    throw new Error('答题卡里找不到第 ' + nextIndex + ' 题的格子，无法点击下一题');
  }

  const hrefBefore = location.href;
  const link = nextCell.closest('a');
  const cellHref = (link && link.href) || nextCell.href || null;
  clickableTarget(nextCell).click();

  const arrived = await waitIndexChange(question.index, 5000);
  if (arrived === question.index) {
    console.warn('点击答题卡后题号未变化，仍返回根据地址推算的 nextUrl');
  }

  let nextUrl = location.href;
  if (nextUrl === hrefBefore) {
    nextUrl = cellHref || buildNextUrlFromLocation(nextIndex);
  }

  const result = { question, nextUrl, filename, done: false };
  window.__lastScrapeV3 = result;
  console.log('已抓第 ' + question.index + ' 题 → ' + filename);
  console.log('下一题地址：' + nextUrl);
  return result;
})();
