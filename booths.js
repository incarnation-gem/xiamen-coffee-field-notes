const BOOTH_SURVEY = (() => {
  const KINDS = ['生豆', '熟豆', '挂耳', '冻干／速溶', '浓缩液', '现冲／饮品', '器具设备', '其他'];
  const FIELDS = ['booth', 'name', 'notes', 'trade', 'evidence'];
  const GUIDE = [
    ['A3T046-1、A3T046-2', '咖纪', '生豆贸易', [569, 548]],
    ['A3T044-1', '巴新咖啡', '生豆杯测', [455, 545]],
    ['A3001、A3012', '新晴好窨制处理厂', '窨制生豆、烘焙体验'],
    ['A3T028', '建发轻工', '生豆进口、采购对接', [814, 401]],
    ['A3T010', '乌干达展位', '产区对接', [930, 402]],
    ['A3T036-2', '刚果金展位', '产区线索'],
    ['A3021、A3024', '思晨咖啡', '熟豆、咖啡馆批发'],
    ['A4011', 'Bonanza Coffee', '熟豆、现冲', [343, 323]],
    ['A3043、A3044', '黑胶唱片 LPCafe', '熟豆、冲煮试饮'],
    ['A4027', '柒浩豆仓精品咖啡', '熟豆、现冲'],
    ['A4031', '捕光咖啡', '熟豆、手冲'],
    ['A3T033-2', '云云南南', '挂耳'],
    ['A3T033-1、A3T033-3', '一咖工业', '挂耳'],
    ['A3039、A3040、A3045、A3046', 'TOMKAFE', '挂耳'],
    ['A3T022-3', '驰思遐享咖啡', '熟豆、巧克力'],
    ['A3T033-4', '如如咖啡 22.6', '袋装豆'],
    ['A3T008', '瑞幸即享', '冻干／速溶，现场具体品项待询', [1072, 402]],
    ['A4032', '巡游咖啡', '现冲／特调饮品', [345, 192]],
    ['A3018', 'LCShaking', '现制特调'],
    ['A3T013', '肯悦咖啡 KCOFFEE', '连锁咖啡', [1049, 305]],
    ['A3T007', '星巴克', '连锁咖啡', [1048, 486]],
    ['A3T032-6', '淳乐咖啡', '咖啡果皮茶'],
    ['A3042', 'COFFEE REPLY', '现场试饮'],
    ['A3028', '豆说咖啡', '咖啡零售'],
    ['A4T012-3', 'DiFluid', '冲煮展示、品控仪器'],
    ['A3T035', '卓越佳意', '冲煮设备、器具'],
    ['A3T015', '王力咖啡／TBC', '咖啡设备、赛事', [1070, 207]],
    ['A4008', '顽固 TOUGH', '烘焙机、器具', [294, 393]],
  ].map(([booth, name, clue, pixels]) => ({
    id: `guide-${booth.split('、')[0]}`,
    booth, name, clue,
    point: pixels ? { x: pixels[0] / 1346, y: pixels[1] / 768 } : null,
  }));

  const text = (value) => typeof value === 'string' ? value : '';
  const searchKey = (value) => value.normalize('NFKC').toLowerCase().replace(/\s+/g, '');

  function sameExhibitor(first, second) {
    const name = searchKey(first.name);
    if (name !== searchKey(second.name)) return false;
    const boothNumbers = (value) => searchKey(value).split(/[、,/;]+/).filter(Boolean);
    const firstBooths = boothNumbers(first.booth);
    const secondBooths = boothNumbers(second.booth);
    if (!firstBooths.length && !secondBooths.length) return !!name;
    return firstBooths.some((number) => secondBooths.includes(number));
  }

  function normalizePoint(point) {
    return [point?.x, point?.y].every((n) => Number.isFinite(n) && n >= 0 && n <= 1)
      ? { x: point.x, y: point.y } : null;
  }

  function normalizeRecord(raw) {
    const fields = Object.fromEntries(FIELDS.map((name) => [name, text(raw?.[name])]));
    return {
      id: text(raw?.id),
      ...fields,
      kinds: Array.isArray(raw?.kinds) ? KINDS.filter((kind) => raw.kinds.includes(kind)) : [],
      point: normalizePoint(raw?.point),
      followUp: raw?.followUp === true,
    };
  }

  function normalize(saved) {
    const records = Array.isArray(saved?.booths) ? saved.booths.map(normalizeRecord) : [];
    const booths = [...new Map(records.filter((row) => row.id && (row.booth.trim() || row.name.trim())).map((row) => [row.id, row])).values()];
    const draft = normalizeRecord(saved?.boothDraft);
    return { booths, boothDraft: draft.id ? draft : null };
  }

  function directory(booths, query = '', filter = 'all') {
    const recorded = new Set(booths.map((row) => row.id));
    const rows = [
      ...booths.slice().reverse().map((row) => ({ ...row, visited: true })),
      ...GUIDE.filter((row) => !recorded.has(row.id)),
    ];
    const needle = searchKey(query);
    return rows.filter((row) => {
      if (filter === 'guide' && row.visited) return false;
      if (filter === 'visited' && !row.visited) return false;
      if (filter === 'follow-up' && !row.followUp) return false;
      return searchKey([row.booth, row.name, row.clue, ...(row.kinds || [])].join(' ')).includes(needle);
    });
  }

  function reportLines(booths) {
    if (!booths.length) return [];
    const lines = ['', `## 逐摊记录（${booths.length} 家）`];
    for (const row of booths) {
      const heading = [row.booth, row.name].filter(Boolean).join(' · ').replace(/\s+/g, ' ');
      lines.push('', `### ${heading}`);
      if (row.kinds.length) lines.push(`- 现场品类：${row.kinds.join('、')}`);
      if (row.notes) lines.push('', '**现场观察**', '', row.notes);
      if (row.trade) lines.push('', '**售价与采购条件**', '', row.trade);
      if (row.evidence) lines.push('', '**来源与复访线索**', '', row.evidence);
      if (row.followUp) lines.push('- 待回访');
    }
    return lines;
  }

  function mount({ state, save, showMode }) {
    const byId = (id) => document.getElementById(id);
    const editor = byId('booth-editor');
    const list = byId('booth-list');
    const search = byId('booth-search');
    const filter = byId('booth-filter');
    const dialog = byId('floor-map');
    const stage = byId('map-stage');
    const mapWindow = byId('map-window');
    const formField = (name) => editor.elements.namedItem(name);
    let limit = 12;
    let zoom = 1;
    let pick = '';

    function showMessage(id, message) {
      const element = byId(id);
      element.textContent = message;
      element.hidden = !message;
    }

    function describe(row) {
      if (!row.visited) return '待访';
      return row.followUp ? '待回访' : '已记录';
    }

    function renderList() {
      const rows = directory(state.booths, search.value, filter.value);
      const visited = state.booths.length;
      byId('booth-count').textContent = `实地记录 ${visited} 家 · 展前参考 ${GUIDE.length} 家`;
      list.replaceChildren(...rows.slice(0, limit).map((row) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'booth-row';
        button.dataset.row = row.id;
        const content = document.createElement('span');
        const title = document.createElement('strong');
        title.className = 'booth-row-title';
        title.textContent = [row.booth, row.name].filter(Boolean).join(' · ');
        const subtitle = document.createElement('span');
        subtitle.className = 'booth-row-meta';
        subtitle.textContent = row.visited ? row.kinds.join('、') : row.clue;
        const status = document.createElement('span');
        status.className = 'booth-row-status';
        status.textContent = describe(row);
        content.append(title, subtitle);
        button.append(content, status);
        item.append(button);
        return item;
      }));
      showMessage('booth-empty', rows.length ? '' : '没有找到，换个关键词或新增一个展位。');
      byId('booth-more').hidden = rows.length <= limit;
    }

    function renderPosition() {
      const point = state.boothDraft?.point;
      byId('booth-position').textContent = point ? '已标在图上' : '';
      byId('place-booth').textContent = point ? '调整地图位置' : '在地图标位置';
    }

    function renderEditor(focus = false) {
      const draft = state.boothDraft;
      editor.hidden = !draft;
      byId('booth-browser').hidden = !!draft;
      byId('add-booth').hidden = !!draft;
      showMessage('booth-error', '');
      if (!draft) return;

      byId('booth-editor-title').textContent = draft.booth || draft.name ? '记录这家展商' : '新增展位';
      const reference = GUIDE.find((entry) => entry.id === draft.id);
      showMessage('booth-clue', reference ? `展前线索 · ${reference.clue}` : '');
      for (const key of FIELDS) formField(key).value = draft[key];
      formField('followUp').checked = draft.followUp;
      for (const checkbox of editor.querySelectorAll('input[name="kind"]')) {
        checkbox.checked = draft.kinds.includes(checkbox.value);
      }
      byId('booth-deep').open = !!(draft.trade || draft.evidence);
      renderPosition();
      if (focus) byId('booth-editor-title').focus();
    }

    function begin(row, point) {
      showMode('booths');
      if (state.boothDraft) {
        byId('booth-editor-title').focus();
        if (state.boothDraft.id !== row?.id) showMessage('booth-error', '先保存或取消当前草稿，再记录另一家。');
        return;
      }
      const id = row?.id || `field-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
      state.boothDraft = normalizeRecord({ ...row, id, point: point || row?.point });
      showMessage('booth-status', '');
      save();
      renderEditor(true);
    }

    function renderPins() {
      stage.querySelectorAll('.map-marker').forEach((marker) => marker.remove());
      const draft = state.boothDraft;
      const rows = directory(state.booths).filter((row) => row.point && row.id !== draft?.id);
      if (draft?.point) rows.push(draft);
      for (const row of rows) {
        const pin = document.createElement('button');
        const isDraft = row === draft;
        pin.type = 'button';
        pin.className = 'map-marker';
        pin.dataset.pin = row.id;
        pin.dataset.recorded = String(!!row.visited);
        pin.dataset.draft = String(isDraft);
        pin.style.left = `${row.point.x * 100}%`;
        pin.style.top = `${row.point.y * 100}%`;
        pin.title = [row.booth, row.name].filter(Boolean).join(' · ') || '当前草稿的位置';
        pin.setAttribute('aria-label', pin.title);
        pin.disabled = isDraft;
        stage.append(pin);
      }
    }

    function setZoom(level) {
      const beforeWidth = stage.clientWidth;
      const beforeHeight = stage.clientHeight;
      const centerX = (mapWindow.scrollLeft + mapWindow.clientWidth / 2) / (beforeWidth || 1);
      const centerY = (mapWindow.scrollTop + mapWindow.clientHeight / 2) / (beforeHeight || 1);
      zoom = Math.max(1, Math.min(4, level));
      stage.style.width = `${zoom * 100}%`;
      mapWindow.scrollLeft = centerX * stage.clientWidth - mapWindow.clientWidth / 2;
      mapWindow.scrollTop = centerY * stage.clientHeight - mapWindow.clientHeight / 2;
      byId('map-in').disabled = zoom === 4;
      byId('map-out').disabled = zoom === 1;
    }

    function setPick(intent) {
      pick = intent;
      stage.dataset.picking = String(!!pick);
      byId('map-add').setAttribute('aria-pressed', String(pick === 'new'));
      byId('map-add').textContent = pick === 'new' ? '取消标位置' : '在图上新增';
      byId('map-help').textContent = pick
        ? '放大或滑动到目标展位，再在图上点一下。'
        : '圆点可打开展位记录。其他展位可点「在图上新增」。';
    }

    function showMap(intent = '') {
      if (typeof dialog.showModal !== 'function') return false;
      renderPins();
      setPick(intent);
      dialog.showModal();
      setZoom(intent && zoom === 1 ? 2 : zoom);
      return true;
    }

    byId('booth-kinds').replaceChildren(...KINDS.map((kind) => {
      const label = document.createElement('label');
      label.className = 'check';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'kind';
      checkbox.value = kind;
      label.append(checkbox, kind);
      return label;
    }));
    byId('add-booth').addEventListener('click', () => begin());
    for (const [element, event] of [[search, 'input'], [filter, 'change']]) {
      element.addEventListener(event, () => { limit = 12; renderList(); });
    }
    byId('booth-more').addEventListener('click', () => { limit += 20; renderList(); });
    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-row]');
      if (button) begin(directory(state.booths).find((row) => row.id === button.dataset.row));
    });

    function finishEdit(message) {
      state.boothDraft = null;
      save();
      showMessage('booth-status', message);
      renderEditor();
      renderList();
    }

    editor.addEventListener('input', () => {
      const draft = state.boothDraft;
      for (const key of FIELDS) draft[key] = formField(key).value;
      draft.kinds = [...editor.querySelectorAll('input[name="kind"]:checked')].map((input) => input.value);
      draft.followUp = formField('followUp').checked;
      showMessage('booth-error', '');
      save();
    });
    editor.addEventListener('submit', (event) => {
      event.preventDefault();
      const row = state.boothDraft;
      for (const key of FIELDS) row[key] = row[key].trim();
      if (!row.booth && !row.name) {
        showMessage('booth-error', '请至少填写展位号或商家名称。');
        formField('booth').focus();
        return;
      }
      const same = state.booths.find((other) => other.id !== row.id && sameExhibitor(other, row));
      if (same) {
        showMessage('booth-error', '同一展位和商家已经记录。可从列表打开原档案，或核对这家的名称。');
        return;
      }
      const index = state.booths.findIndex((other) => other.id === row.id);
      if (index === -1) {
        const reference = GUIDE.find((entry) => sameExhibitor(entry, row) && !state.booths.some((other) => other.id === entry.id));
        if (reference) {
          row.id = reference.id;
          row.point ||= reference.point;
        }
        state.booths.push(row);
      } else state.booths[index] = row;
      finishEdit(`已保存 ${row.name || row.booth}`);
      if (event.submitter?.value === 'next') {
        begin();
        formField('booth').focus();
      } else byId('booths-title').focus();
    });
    byId('cancel-booth').addEventListener('click', () => {
      finishEdit('');
      byId('add-booth').focus();
    });

    byId('open-map').addEventListener('click', (event) => {
      if (showMap()) event.preventDefault();
    });
    byId('place-booth').addEventListener('click', () => showMap('edit'));
    byId('map-in').addEventListener('click', () => setZoom(zoom + 1));
    byId('map-out').addEventListener('click', () => setZoom(zoom - 1));
    byId('map-add').addEventListener('click', () => {
      if (state.boothDraft) {
        dialog.close();
        begin();
        return;
      }
      setPick(pick === 'new' ? '' : 'new');
      if (pick && zoom === 1) setZoom(2);
    });
    stage.addEventListener('click', (event) => {
      if (pick) {
        const rect = stage.getBoundingClientRect();
        const point = normalizePoint({
          x: (event.clientX - rect.left) / rect.width,
          y: (event.clientY - rect.top) / rect.height,
        });
        if (!point) return;
        const intent = pick;
        dialog.close();
        if (intent === 'new') begin(undefined, point);
        else {
          state.boothDraft.point = point;
          save();
          renderPosition();
        }
      } else {
        const pin = event.target.closest('[data-pin]');
        if (!pin) return;
        const row = directory(state.booths).find((entry) => entry.id === pin.dataset.pin);
        dialog.close();
        if (row) begin(row);
      }
    });

    renderList();
    renderEditor();
  }

  return { normalize, directory, normalizePoint, sameExhibitor, reportLines, mount };
})();
