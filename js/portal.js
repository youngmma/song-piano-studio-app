/* Song Piano Studio Manager — 학부모 포털 (?token=...) */
(function () {
  "use strict";
  var S = window.SPS_STORE;
  var t = function (k) { return window.SPS.t(k); };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  var STATUS_CHIP = { present: "present", absent: "absent", makeup: "makeup" };
  var STATUS_KEY = { present: "present", absent: "absent", makeup: "makeup" };

  function tokenFromUrl() {
    var m = /[?&]token=([^&#]*)/.exec(location.search);
    if (!m) return "";
    var tok = decodeURIComponent(m[1]);
    // 토큰은 16진수 48자만 허용 (allowlist 검증)
    return /^[0-9a-f]{48}$/.test(tok) ? tok : "";
  }

  function render() {
    var body = document.getElementById("portalBody");
    body.innerHTML = "";
    var tok = tokenFromUrl();
    if (!tok) {
      body.appendChild(el("div", "empty", t("portalInvalid")));
      return;
    }
    S.portalView(tok).then(function (data) {
      if (!data || !data.ok) {
        body.appendChild(el("div", "empty", t("portalInvalid")));
        return;
      }
      var card = el("div", "balance-card");
      card.appendChild(el("div", "label",
        data.student.name + (data.student.grade_level ? " · " + data.student.grade_level : "") +
        " · " + t("portalBalance")));
      card.appendChild(el("div", "num", String(data.balance) + t("creditUnit")));
      body.appendChild(card);

      body.appendChild(el("h2", null, t("portalHistory")));
      var list = data.attendance || [];
      if (!list.length) {
        body.appendChild(el("div", "empty", t("noHistory")));
        return;
      }
      list.forEach(function (a) {
        var row = el("div", "history-row");
        row.appendChild(el("span", "d", a.date));
        row.appendChild(el("span", "chip " + (STATUS_CHIP[a.status] || ""), t(STATUS_KEY[a.status] || "unmarked")));
        body.appendChild(row);
      });
    }).catch(function () {
      body.appendChild(el("div", "empty", t("portalInvalid")));
    });
  }

  document.getElementById("langToggle").addEventListener("click", function () {
    window.SPS.setLang(window.SPS.lang === "ko" ? "en" : "ko");
    document.getElementById("langToggle").textContent = window.SPS.lang === "ko" ? "EN" : "한";
    render();
  });

  window.SPS.applyI18n();
  document.getElementById("langToggle").textContent = window.SPS.lang === "ko" ? "EN" : "한";
  render();
})();
