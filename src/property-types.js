// Keep real anchors and all panels available until the tab interface is ready.
export function initPropertyTypes() {
  document.querySelectorAll('[data-property-showcase]').forEach((section) => {
    const selector = section.querySelector('[data-property-selector]');
    const tabs = [...selector.querySelectorAll('[data-property-tab]')];
    const panels = [...section.querySelectorAll('[data-property-panel]')];
    const select = (index, focus = false) => {
      tabs.forEach((tab, position) => {
        const active = index === position;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[position].hidden = !active;
      });
      if (focus) tabs[index].focus();
    };
    selector.setAttribute('role', 'tablist');
    selector.setAttribute('aria-orientation', 'horizontal');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[index].id);
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].tabIndex = 0;
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        select(index);
      });
      tab.addEventListener('keydown', (event) => {
        let target;
        if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
        if (event.key === 'Home') target = 0;
        if (event.key === 'End') target = tabs.length - 1;
        if (event.key === ' ') target = index;
        if (target !== undefined) {
          event.preventDefault();
          select(target, true);
        }
      });
    });
    const requested = panels.findIndex((panel) => `#${panel.id}` === window.location.hash);
    select(requested >= 0 ? requested : 0);
    section.classList.add('property-types-ready');
  });
}
