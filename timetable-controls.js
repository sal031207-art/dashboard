/* Theme-aware select menus; native selects retain application state and events. */
(() => {
  let serial = 0;
  function enhance(select) {
    if (select.dataset.themedSelect || select.multiple || select.size > 1) return;
    select.dataset.themedSelect = 'true';
    const wrapper = document.createElement('div');
    wrapper.className = 'themed-select';
    select.before(wrapper);
    wrapper.append(select);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'select themed-select-trigger';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    const label = select.getAttribute('aria-label') || select.labels?.[0]?.textContent || '選擇';
    const menu = document.createElement('div');
    menu.id = `themed-select-${++serial}`;
    menu.className = 'themed-select-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', label);
    menu.hidden = true;
    button.setAttribute('aria-controls', menu.id);
    wrapper.append(button);
    document.body.append(menu);
    select.hidden = true;
    let active = 0;
    let prefix = '', lastKey = 0;
    function sync() {
      button.textContent = (select.selectedOptions[0]?.textContent || label) + ' ▾';
      button.setAttribute('aria-label', label + '：' + (select.selectedOptions[0]?.textContent || ''));
      button.disabled = select.disabled;
      [...menu.querySelectorAll('[role="option"]')].forEach((option, i) => option.setAttribute('aria-selected', String(i === select.selectedIndex)));
    }
    function rebuild() {
      menu.replaceChildren();
      let group = "";
      [...select.options].forEach((option, i) => {
        const name=option.parentElement.tagName === "OPTGROUP" ? option.parentElement.label : "";
        if(name && name !== group){const heading=document.createElement("div");heading.className="themed-select-heading";heading.textContent=name;menu.append(heading);group=name;}
        const node = document.createElement('div');
        node.id = `${menu.id}-${i}`;
        node.setAttribute('role', 'option');
        node.textContent = option.textContent;
        node.setAttribute('aria-disabled', String(option.disabled));
        node.addEventListener('click', () => { if (!option.disabled) choose(i); });
        menu.append(node);
      });
      sync();
    }
    function close() {
      menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      button.removeAttribute('aria-activedescendant');
    }
    function focusOption(i) {
      active = Math.max(0, Math.min(select.options.length - 1, i));
      [...menu.querySelectorAll('[role="option"]')].forEach((node, j) => node.classList.toggle('is-active', j === active));
      if (menu.querySelectorAll('[role="option"]')[active]) {
        button.setAttribute('aria-activedescendant', menu.querySelectorAll('[role="option"]')[active].id);
        const node = menu.querySelectorAll('[role="option"]')[active];
        if (node.offsetTop < menu.scrollTop) menu.scrollTop = node.offsetTop;
        else if (node.offsetTop + node.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = node.offsetTop + node.offsetHeight - menu.clientHeight;
      }
    }
    function open() {
      sync();
      menu.hidden = false;
      button.setAttribute('aria-expanded','true');
      // Keep the popup outside overflow-clipped dashboard cards.
      const rect = button.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(rect.left, innerWidth - rect.width - 8)) + 'px';
      menu.style.width = Math.min(rect.width, innerWidth - 16) + 'px';
      const below = innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      menu.style.maxHeight = Math.max(80, Math.min(360, Math.max(below, above))) + 'px';
      menu.style.top = below >= Math.min(240, above) ? rect.bottom + 4 + 'px' : 'auto';
      menu.style.bottom = menu.style.top === 'auto' ? innerHeight - rect.top + 4 + 'px' : 'auto';
      focusOption(select.selectedIndex);
    }
    function choose(i) {
      if (select.options[i]?.disabled) return;
      select.selectedIndex = i;
      select.dispatchEvent(new Event('input', {bubbles:true}));
      select.dispatchEvent(new Event('change', {bubbles:true}));
      sync(); close(); button.focus();
    }
    button.addEventListener('click', () => menu.hidden ? open() : close());
    button.addEventListener('keydown', event => {
      if (['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape'].includes(event.key)) {
        event.preventDefault();
        if (event.key === 'Escape') return close();
        if (menu.hidden) return open();
        if (event.key === 'Enter' || event.key === ' ') return choose(active);
        focusOption(event.key === 'Home' ? 0 : event.key === 'End' ? select.options.length-1 : active + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (event.key === 'Tab') close();
      else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
        prefix = Date.now() - lastKey > 700 ? event.key : prefix + event.key;
        lastKey = Date.now();
        const i = [...select.options].findIndex(o => o.textContent.trim().toLowerCase().startsWith(prefix.toLowerCase()));
        if (i >= 0) { if (menu.hidden) choose(i); else focusOption(i); }
      }
    });
    select.addEventListener('change', sync);
    // Existing timetable shortcuts set .value directly, without a change event.
    const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    Object.defineProperty(select, 'value', {get(){return descriptor.get.call(this);}, set(value){descriptor.set.call(this,value);sync();}});
    new MutationObserver(rebuild).observe(select, {childList:true,subtree:true,attributes:true,attributeFilter:['disabled','label','selected']});
    document.addEventListener('pointerdown', e => {if (!wrapper.contains(e.target) && !menu.contains(e.target)) close();});
    document.addEventListener('focusin', e => {if (!wrapper.contains(e.target) && !menu.contains(e.target)) close();});
    window.addEventListener('resize', close);
    document.addEventListener('scroll', e => {if (!menu.contains(e.target)) close();}, true);
    [...(select.labels || [])].forEach(l => l.addEventListener('click', e => {e.preventDefault();button.focus();}));
    rebuild();
  }
  function scan() {document.querySelectorAll('select:not([data-themed-select])').forEach(enhance);}
  scan();
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
})();



