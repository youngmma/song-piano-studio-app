/* Song Piano Studio Manager — 원장 콘솔 */
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
  function toast(msg) {
    var box = document.getElementById("toast");
    box.textContent = msg;
    box.style.display = "block";
    clearTimeout(box._h);
    box._h = setTimeout(function () { box.style.display = "none"; }, 1800);
  }
  function localDateStr(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }
  function fmtTime(hhmm) {
    var p = String(hhmm).split(":");
    var h = parseInt(p[0], 10), m = p[1] || "00";
    if (window.SPS.lang === "ko") {
      var ap = h < 12 ? "오전" : "오후";
      var hh = h % 12; if (hh === 0) hh = 12;
      return ap + " " + hh + ":" + m;
    }
    var ap2 = h < 12 ? "AM" : "PM";
    var hh2 = h % 12; if (hh2 === 0) hh2 = 12;
    return hh2 + ":" + m + " " + ap2;
  }

  /* ---------- 모달 ---------- */
  var modalBack = document.getElementById("modalBack");
  function openModal(title, build) {
    document.getElementById("modalTitle").textContent = title;
    var body = document.getElementById("modalBody");
    body.innerHTML = "";
    build(body);
    modalBack.classList.add("open");
  }
  function closeModal() { modalBack.classList.remove("open"); }
  modalBack.addEventListener("click", function (e) {
    if (e.target === modalBack) closeModal();
  });

  /* ---------- 탭 ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) { b.setAttribute("aria-selected", "false"); });
      btn.setAttribute("aria-selected", "true");
      document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
      document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
      refresh(btn.dataset.tab);
    });
  });

  /* ---------- 세그먼트 컨트롤 (O / X / 보강) ---------- */
  function segControl(current, onPick) {
    var wrap = el("div", "seg");
    [["present", t("present"), "on-present"],
     ["absent", t("absent"), "on-absent"],
     ["makeup", t("makeup"), "on-makeup"]].forEach(function (opt) {
      var b = el("button", null, opt[1]);
      b.type = "button";
      if (current === opt[0]) b.classList.add(opt[2]);
      b.setAttribute("aria-pressed", current === opt[0] ? "true" : "false");
      b.addEventListener("click", function () { onPick(opt[0]); });
      wrap.appendChild(b);
    });
    return wrap;
  }

  /* ---------- 오늘의 수업 ---------- */
  function renderToday() {
    var box = document.getElementById("todayList");
    box.innerHTML = "";
    var now = new Date();
    var ds = localDateStr(now);
    S.todayLessons(ds, now.getDay()).then(function (lessons) {
      if (!lessons.length) {
        box.appendChild(el("div", "empty", t("noLessonsToday")));
        return;
      }
      var jobs = lessons.map(function (l) {
        return S.creditBalance(l.student.id).then(function (bal) { l.balance = bal; });
      });
      return Promise.all(jobs).then(function () {
        lessons.forEach(function (l) {
          var row = el("div", "lesson-row");
          var info = el("div", "lesson-info");
          info.appendChild(el("div", "name", l.student.name));
          var meta = el("div", "meta",
            fmtTime(l.slot.start_time) + " · " + l.slot.duration_min + t("min") +
            (l.student.grade_level ? " · " + l.student.grade_level : ""));
          info.appendChild(meta);
          if (l.balance > 0) {
            info.appendChild(el("div", "credit",
              t("creditBalance") + ": " + l.balance + t("creditUnit")));
          }
          row.appendChild(info);
          var cur = l.attendance ? l.attendance.status : null;
          row.appendChild(segControl(cur, function (status) {
            S.markAttendance(l.student.id, ds, status).then(function () {
              toast(t("attendanceSaved"));
              renderToday();
            }).catch(function (err) { toast(err.message); });
          }));
          box.appendChild(row);
        });
      });
    }).catch(function (err) { box.appendChild(el("div", "empty", err.message)); });
  }

  /* ---------- 원생 목록 ---------- */
  function renderStudents() {
    var box = document.getElementById("studentList");
    box.innerHTML = "";
    S.listStudents().then(function (students) {
      if (!students.length) {
        box.appendChild(el("div", "empty", t("noStudents")));
        return;
      }
      students.forEach(function (s) {
        var row = el("div", "student-row");
        var who = el("div", "who");
        who.appendChild(el("div", "name", s.name + (s.active ? "" : " (" + t("inactive") + ")")));
        who.appendChild(el("div", "sub",
          [s.grade_level, s.parent_name, s.contact_phone].filter(Boolean).join(" · ")));
        row.appendChild(who);
        var btn = el("button", "row-btn", t("editStudent"));
        btn.addEventListener("click", function () { openStudentModal(s.id); });
        row.appendChild(btn);
        box.appendChild(row);
      });
    });
  }

  /* ---------- 원생 상세 모달 ---------- */
  function field(labelText, input) {
    var w = el("div", "field");
    var lab = el("label", null, labelText);
    w.appendChild(lab); w.appendChild(input);
    return w;
  }
  function textInput(val, ph) {
    var i = document.createElement("input");
    i.value = val || ""; if (ph) i.placeholder = ph;
    return i;
  }

  function openStudentModal(studentId) {
    S.getStudent(studentId).then(function (s) {
      openModal(t("editStudent"), function (body) {
        var nameI = textInput(s.name);
        var gradeI = textInput(s.grade_level, t("gradePh"));
        var parentI = textInput(s.parent_name);
        var contactI = textInput(s.contact_phone);
        contactI.setAttribute("inputmode", "tel");
        body.appendChild(field(t("name"), nameI));
        body.appendChild(field(t("gradeLevel"), gradeI));
        body.appendChild(field(t("parentName"), parentI));
        body.appendChild(field(t("contact"), contactI));

        // 수업 시간표
        var slotH = el("h2", null, t("lessonDay") + " / " + t("lessonTime"));
        slotH.style.marginTop = "18px";
        body.appendChild(slotH);
        var slotBox = el("div");
        body.appendChild(slotBox);
        function renderSlots() {
          slotBox.innerHTML = "";
          S.listSlots(s.id).then(function (slots) {
            slots.forEach(function (sl) {
              var r = el("div", "student-row");
              r.appendChild(el("div", "who",
                el("div", "name", window.SPS.weekdayName(sl.weekday) + " " + fmtTime(sl.start_time) +
                                " · " + sl.duration_min + t("min"))));
              var del = el("button", "row-btn danger", t("delete"));
              del.addEventListener("click", function () {
                if (!confirm(t("confirmDelete"))) return;
                S.deleteSlot(sl.id).then(renderSlots);
              });
              r.appendChild(del);
              slotBox.appendChild(r);
            });
            // 추가 폼
            var addRow = el("div", "field");
            var wdSel = document.createElement("select");
            for (var d = 0; d < 7; d++) {
              var o = document.createElement("option");
              o.value = d; o.textContent = window.SPS.weekdayName(d);
              wdSel.appendChild(o);
            }
            var timeI = document.createElement("input");
            timeI.type = "time"; timeI.value = "15:30";
            var addBtn = el("button", "row-btn primary", t("addSlot"));
            addBtn.style.marginTop = "8px";
            addBtn.addEventListener("click", function () {
              S.addSlot(s.id, parseInt(wdSel.value, 10), timeI.value, 30).then(renderSlots);
            });
            addRow.appendChild(wdSel); addRow.appendChild(timeI); addRow.appendChild(addBtn);
            slotBox.appendChild(addRow);
          });
        }
        renderSlots();

        // 학부모 포털 링크
        var tokH = el("h2", null, t("portalLink"));
        tokH.style.marginTop = "18px";
        body.appendChild(tokH);
        var tokBox = el("div", "token-box");
        var tokCode = el("code", null, "");
        var copyBtn = el("button", "row-btn", t("copyLink"));
        var newBtn = el("button", "row-btn", t("newToken"));
        tokBox.appendChild(tokCode); tokBox.appendChild(copyBtn);
        body.appendChild(tokBox);
        body.appendChild(newBtn);
        newBtn.style.marginTop = "8px";
        function portalUrl(token) {
          return location.href.replace(/index\.html.*$/, "") + "portal.html?token=" + token;
        }
        function refreshToken() {
          S.getToken(s.id).then(function (tok) {
            tokCode.textContent = tok ? portalUrl(tok) : "";
            copyBtn.disabled = !tok;
          });
        }
        copyBtn.addEventListener("click", function () {
          var url = tokCode.textContent;
          if (!url) return;
          if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast(t("copied")); });
          else { prompt(t("copyLink"), url); }
        });
        newBtn.addEventListener("click", function () {
          if (!confirm(t("tokenNewWarn"))) return;
          S.issueToken(s.id).then(function () { refreshToken(); toast(t("saved")); });
        });
        refreshToken();

        // 하단 버튼
        var saveBtn = el("button", "btn", t("save"));
        saveBtn.style.marginTop = "18px";
        saveBtn.addEventListener("click", function () {
          var nm = nameI.value.trim();
          if (!nm) { nameI.focus(); return; }
          if (nm.length > 40) { toast(t("name") + " 40"); return; }
          S.saveStudent({ id: s.id, name: nm,
            grade_level: gradeI.value.trim().slice(0, 30),
            parent_name: parentI.value.trim().slice(0, 40),
            contact_phone: contactI.value.trim().slice(0, 20)
          }).then(function () { toast(t("saved")); closeModal(); renderStudents(); });
        });
        body.appendChild(saveBtn);

        var actBtn = el("button", "btn secondary",
          s.active ? t("deactivate") : t("reactivate"));
        actBtn.style.marginTop = "8px";
        actBtn.addEventListener("click", function () {
          S.setStudentActive(s.id, !s.active).then(function () {
            closeModal(); renderStudents(); renderToday();
          });
        });
        body.appendChild(actBtn);

        var closeBtn = el("button", "btn secondary", t("close"));
        closeBtn.style.marginTop = "8px";
        closeBtn.addEventListener("click", closeModal);
        body.appendChild(closeBtn);
      });
    });
  }

  /* ---------- 새 원생 ---------- */
  document.getElementById("addStudentBtn").addEventListener("click", function () {
    openModal(t("addStudent"), function (body) {
      var nameI = textInput("", t("name"));
      var gradeI = textInput("", t("gradePh"));
      var parentI = textInput("");
      var contactI = textInput("");
      contactI.setAttribute("inputmode", "tel");
      body.appendChild(field(t("name"), nameI));
      body.appendChild(field(t("gradeLevel"), gradeI));
      body.appendChild(field(t("parentName"), parentI));
      body.appendChild(field(t("contact"), contactI));
      var saveBtn = el("button", "btn", t("save"));
      saveBtn.style.marginTop = "8px";
      saveBtn.addEventListener("click", function () {
        var nm = nameI.value.trim();
        if (!nm) { nameI.focus(); return; }
        S.saveStudent({ name: nm.slice(0, 40),
          grade_level: gradeI.value.trim().slice(0, 30),
          parent_name: parentI.value.trim().slice(0, 40),
          contact_phone: contactI.value.trim().slice(0, 20)
        }).then(function () { toast(t("saved")); closeModal(); renderStudents(); })
          .catch(function (err) { toast(err.message); });
      });
      body.appendChild(saveBtn);
      var closeBtn = el("button", "btn secondary", t("close"));
      closeBtn.style.marginTop = "8px";
      closeBtn.addEventListener("click", closeModal);
      body.appendChild(closeBtn);
    });
  });

  /* ---------- 보강 크레딧 ---------- */
  function renderCredits() {
    var box = document.getElementById("creditList");
    box.innerHTML = "";
    S.listStudents().then(function (students) {
      var jobs = students.filter(function (s) { return s.active; }).map(function (s) {
        return S.creditBalance(s.id).then(function (b) { return { s: s, b: b }; });
      });
      return Promise.all(jobs);
    }).then(function (rows) {
      rows.sort(function (a, b) { return b.b - a.b; });
      if (!rows.length) { box.appendChild(el("div", "empty", t("noStudents"))); return; }
      rows.forEach(function (r) {
        var row = el("div", "student-row");
        var who = el("div", "who");
        who.appendChild(el("div", "name", r.s.name));
        who.appendChild(el("div", "sub", r.s.grade_level || ""));
        row.appendChild(who);
        var chip = el("span", "chip" + (r.b > 0 ? " makeup" : ""),
          t("creditBalance") + ": " + r.b + t("creditUnit"));
        row.appendChild(chip);
        box.appendChild(row);
      });
    });
  }

  /* ---------- 설정 ---------- */
  function renderSettings() {
    var live = S.isLive();
    document.getElementById("demoBanner").hidden = live;
    document.getElementById("sbUrl").value = window.SPS_CONFIG.SUPABASE_URL || "";
    document.getElementById("authBox").hidden = !live;
    document.getElementById("langSelect").value = window.SPS.lang;
    if (live) {
      S.auth.session().then(function (sess) {
        document.getElementById("authState").textContent =
          sess ? sess.user.email : "";
      });
    }
  }
  document.getElementById("connectBtn").addEventListener("click", function () {
    var url = document.getElementById("sbUrl").value.trim().replace(/\/$/, "");
    var key = document.getElementById("sbKey").value.trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) { toast("URL"); return; }
    if (key.length < 20) { toast("Key"); return; }
    window.SPS_CONFIG.save(url, key);
    S.resetClient();
    document.getElementById("sbKey").value = "";
    toast(t("saved"));
    renderSettings(); renderToday();
  });
  document.getElementById("disconnectBtn").addEventListener("click", function () {
    window.SPS_CONFIG.clear();
    S.resetClient();
    renderSettings(); renderToday();
  });
  document.getElementById("signInBtn").addEventListener("click", function () {
    var em = document.getElementById("authEmail").value.trim();
    var pw = document.getElementById("authPw").value;
    S.auth.signIn(em, pw).then(function () {
      document.getElementById("authPw").value = "";
      toast(t("saved")); renderSettings(); renderToday();
    }).catch(function (err) { toast(err.message); });
  });
  document.getElementById("signOutBtn").addEventListener("click", function () {
    S.auth.signOut().then(function () { renderSettings(); });
  });
  document.getElementById("goSettings").addEventListener("click", function () {
    document.querySelector('[data-tab="settings"]').click();
  });

  /* ---------- 언어 ---------- */
  function setLangUI() {
    document.getElementById("langToggle").textContent = window.SPS.lang === "ko" ? "EN" : "한";
    var now = new Date();
    var wd = window.SPS.weekdayName(now.getDay());
    document.getElementById("todayLabel").textContent =
      (now.getMonth() + 1) + "/" + now.getDate() + " (" + wd + ")";
  }
  document.getElementById("langToggle").addEventListener("click", function () {
    window.SPS.setLang(window.SPS.lang === "ko" ? "en" : "ko");
    setLangUI(); refresh("today"); refresh("students"); refresh("credits");
  });
  document.getElementById("langSelect").addEventListener("change", function (e) {
    window.SPS.setLang(e.target.value);
    setLangUI(); refresh("today");
  });

  function refresh(tab) {
    if (tab === "today") renderToday();
    else if (tab === "students") renderStudents();
    else if (tab === "credits") renderCredits();
    else if (tab === "settings") renderSettings();
  }

  /* ---------- 시작 ---------- */
  window.SPS.applyI18n();
  setLangUI();
  renderSettings();
  renderToday();
})();
