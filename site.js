(function () {
  "use strict";
  const config = window.KYORILOG_CONFIG || {};
  function driveLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "drive.google.com" && !url.username && !url.password ? url.href : "";
    } catch (_) { return ""; }
  }
  const folder = driveLink(config.driveFolderUrl);
  const zip = driveLink(config.driveZipUrl);
  const destination = zip || folder;
  const buttons = Array.from(document.querySelectorAll(".download-link"));
  buttons.forEach(function (button) {
    if (!destination) return;
    button.href = destination;
    button.target = "_blank";
    button.rel = "noopener";
    button.removeAttribute("aria-disabled");
    button.textContent = zip ? "無料試用版をダウンロード" : "ダウンロードページを開く";
    button.setAttribute("aria-label", button.textContent + "（Googleドライブ・新しいタブ）");
  });
  document.querySelectorAll(".folder-link").forEach(function (link) {
    if (!folder) return;
    link.hidden = false;
    link.href = folder;
    link.target = "_blank";
    link.rel = "noopener";
  });

  const id = /^G-[A-Z0-9]+$/.test(config.measurementId || "") ? config.measurementId : "";
  const local = location.protocol !== "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const key = "kyorilog-analytics-optout";
  const toggle = document.getElementById("analytics-toggle");
  const status = document.getElementById("analytics-status");
  let optedOut = false;
  try { optedOut = localStorage.getItem(key) === "yes"; } catch (_) {}
  let loaded = false;
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  function renderPreference() {
    toggle.textContent = optedOut ? "このブラウザーでアクセス解析を許可する" : "このブラウザーでアクセス解析を停止する";
    status.textContent = optedOut ? "このブラウザーではアクセス解析を停止しています。" : privacySignal ? "ブラウザーのプライバシー設定により、アクセス解析を停止しています。" : "";
  }
  function startAnalytics() {
    if (!id || local || optedOut || privacySignal || loaded) return;
    loaded = true;
    window["ga-disable-" + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, {
      send_page_view: true,
      page_location: location.origin + location.pathname,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);
  }
  if (id && !local) {
    document.getElementById("analytics-description").textContent = "この紹介ページでは、Googleアナリティクスで閲覧数と配付先へのボタンのクリック数を計測します。ダウンロードの完了数やアプリの起動回数は計測しません。きょりログの交信ログ・コールサイン・GPS位置は取得しません。";
    toggle.hidden = false;
    renderPreference();
    toggle.addEventListener("click", function () {
      optedOut = !optedOut;
      try { localStorage.setItem(key, optedOut ? "yes" : "no"); } catch (_) {}
      window["ga-disable-" + id] = optedOut || privacySignal;
      if (!optedOut) startAnalytics();
      renderPreference();
    });
    startAnalytics();
  }
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (!destination || !loaded || optedOut || privacySignal || typeof window.gtag !== "function") return;
      // This is a request to open the distribution page, not a completed download.
      window.gtag("event", "kyorilog_download", {
        app_name: "KyoriLog",
        app_version: config.version,
        button_position: button.dataset.placement,
        destination_type: zip ? "drive_zip" : "drive_folder",
        send_to: id
      });
    });
  });
}());
