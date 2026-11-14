/* Icon presentation only: follow Dashboard's existing data-d2-theme selector.
   iOS installed home-screen icons may remain cached by the operating system. */
(function () {
  "use strict";
  const root = document.documentElement;
  const pref = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  let last = "";
  function apply() {
    const current = root.getAttribute("data-d2-theme");
    const dark = current === "dark" || (!current && pref && pref.matches);
    const theme = dark ? "dark" : "light";
    if (last === theme) return;
    last = theme;
    const favicon = document.querySelector('link[data-dashboard-icon="favicon"]');
    const touch = document.querySelector('link[data-dashboard-icon="touch"]');
    const manifest = document.querySelector('link[data-dashboard-icon="manifest"]');
    if (favicon) favicon.href = "./app-icon-" + theme + ".svg?v=3";
    if (touch) touch.href = "./app-icon-" + theme + "-180.png?v=3";
    if (manifest) manifest.href = "./manifest-" + theme + ".webmanifest?v=3";
  }
  function start() {
    apply();
    new MutationObserver(apply).observe(root, {attributes:true,attributeFilter:["data-d2-theme"]});
    if (pref) {
      if (pref.addEventListener) pref.addEventListener("change",apply);
      else if (pref.addListener) pref.addListener(apply);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
