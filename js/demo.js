/* Song Piano Studio Manager — 데모 모드 데이터 (가짜 이름만 사용)
 * Supabase 미연결 시 화면 확인용. localStorage에 저장되며 기기에서만 유지.
 * 실제 원생 정보를 절대 여기에 넣지 말 것.
 */
(function () {
  var KEY = "sps_demo_v1";

  var FAKE_SEED = {
    students: [
      { id: "demo-s1", name: "김도윤", grade_level: "초2", parent_name: "김부모1", contact_phone: "010-0000-0001", active: true },
      { id: "demo-s2", name: "이서아", grade_level: "초4", parent_name: "이부모2", contact_phone: "010-0000-0002", active: true },
      { id: "demo-s3", name: "박지민", grade_level: "중1", parent_name: "박부모3", contact_phone: "010-0000-0003", active: true },
      { id: "demo-s4", name: "최준서", grade_level: "초6", parent_name: "최부모4", contact_phone: "010-0000-0004", active: true },
      { id: "demo-s5", name: "정하린", grade_level: "초3", parent_name: "정부모5", contact_phone: "010-0000-0005", active: false }
    ],
    slots: [
      { id: "demo-l1", student_id: "demo-s1", weekday: 1, start_time: "15:30", duration_min: 30, active: true },
      { id: "demo-l2", student_id: "demo-s2", weekday: 1, start_time: "16:10", duration_min: 30, active: true },
      { id: "demo-l3", student_id: "demo-s3", weekday: 3, start_time: "17:00", duration_min: 45, active: true },
      { id: "demo-l4", student_id: "demo-s4", weekday: 5, start_time: "15:00", duration_min: 30, active: true },
      { id: "demo-l5", student_id: "demo-s1", weekday: 4, start_time: "15:30", duration_min: 30, active: true }
    ],
    attendance: [],
    credits: [
      { id: "demo-c1", student_id: "demo-s2", delta: 1, reason: "absence", created_at: "2026-10-01T10:00:00" },
      { id: "demo-c2", student_id: "demo-s4", delta: 1, reason: "absence", created_at: "2026-10-02T10:00:00" },
      { id: "demo-c3", student_id: "demo-s4", delta: -1, reason: "makeup_lesson", created_at: "2026-10-05T10:00:00" }
    ],
    tokens: [
      { id: "demo-t1", student_id: "demo-s1", token: "demo-token-kimdoyun-0000000000000001", revoked: false }
    ]
  };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var seed = JSON.parse(JSON.stringify(FAKE_SEED));
    try { localStorage.setItem(KEY, JSON.stringify(seed)); } catch (e) {}
    return seed;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  function uid(p) {
    return p + "-" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }

  // 출석 기록 시 크레딧 자동 장부 (schema.sql 트리거와 동일 규칙)
  // 업계 표준: 보강 수업 결석 시 크레딧 반환 없음, 신규 발급 없음
  function applyCredit(db, studentId, oldStatus, newStatus, attendanceId) {
    function add(delta, reason) {
      db.credits.push({ id: uid("demo-c"), student_id: studentId, delta: delta,
        reason: reason, attendance_id: attendanceId || null, created_at: new Date().toISOString() });
    }
    if (oldStatus === null) {
      if (newStatus === "absent") add(1, "absence");
      if (newStatus === "makeup") add(-1, "makeup_lesson");
      return;
    }
    if (oldStatus === "absent" && newStatus === "present") add(-1, "correction");
    if (oldStatus === "absent" && newStatus === "makeup") { add(-1, "correction"); add(-1, "makeup_lesson"); }
    if (oldStatus === "makeup" && newStatus === "present") add(1, "correction");
    if (oldStatus === "makeup" && newStatus === "absent") { /* missed makeup: 장부 변동 없음 */ }
    if (oldStatus === "present" && newStatus === "absent") add(1, "absence");
    if (oldStatus === "present" && newStatus === "makeup") add(-1, "makeup_lesson");
  }

  window.SPS_DEMO = {
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },

    listStudents: function () {
      return load().students.slice().sort(function (a, b) {
        return a.name.localeCompare(b.name, "ko");
      });
    },
    getStudent: function (id) {
      return load().students.find(function (s) { return s.id === id; }) || null;
    },
    saveStudent: function (data) {
      var db = load();
      if (data.id) {
        var s = db.students.find(function (x) { return x.id === data.id; });
        if (s) { s.name = data.name; s.grade_level = data.grade_level;
          s.parent_name = data.parent_name; s.contact_phone = data.contact_phone; }
      } else {
        db.students.push({ id: uid("demo-s"), name: data.name, grade_level: data.grade_level,
          parent_name: data.parent_name, contact_phone: data.contact_phone, active: true });
      }
      save(db);
    },
    setStudentActive: function (id, active) {
      var db = load();
      var s = db.students.find(function (x) { return x.id === id; });
      if (s) s.active = active;
      save(db);
    },
    listSlots: function (studentId) {
      return load().slots.filter(function (l) { return l.student_id === studentId && l.active; })
        .sort(function (a, b) { return a.weekday - b.weekday || a.start_time.localeCompare(b.start_time); });
    },
    addSlot: function (studentId, weekday, startTime, durationMin) {
      var db = load();
      db.slots.push({ id: uid("demo-l"), student_id: studentId, weekday: weekday,
        start_time: startTime, duration_min: durationMin, active: true });
      save(db);
    },
    deleteSlot: function (slotId) {
      var db = load();
      var l = db.slots.find(function (x) { return x.id === slotId; });
      if (l) l.active = false;
      save(db);
    },
    todayLessons: function (dateStr, weekday) {
      var db = load();
      return db.slots
        .filter(function (l) { return l.weekday === weekday && l.active; })
        .map(function (l) {
          var st = db.students.find(function (s) { return s.id === l.student_id; });
          if (!st || !st.active) return null;
          var att = db.attendance.find(function (a) {
            return a.student_id === st.id && a.lesson_date === dateStr;
          }) || null;
          return { slot: l, student: st, attendance: att };
        })
        .filter(Boolean)
        .sort(function (a, b) { return a.slot.start_time.localeCompare(b.slot.start_time); });
    },
    markAttendance: function (studentId, dateStr, status) {
      var db = load();
      var att = db.attendance.find(function (a) {
        return a.student_id === studentId && a.lesson_date === dateStr;
      });
      var oldStatus = att ? att.status : null;
      if (att) { att.status = status; }
      else {
        att = { id: uid("demo-a"), student_id: studentId, lesson_date: dateStr,
          status: status, note: "", created_at: new Date().toISOString() };
        db.attendance.push(att);
      }
      if (oldStatus !== status) applyCredit(db, studentId, oldStatus, status, att.id);
      save(db);
      return att;
    },
    listAttendance: function (studentId, limit) {
      return load().attendance
        .filter(function (a) { return a.student_id === studentId; })
        .sort(function (a, b) { return b.lesson_date.localeCompare(a.lesson_date); })
        .slice(0, limit || 30);
    },
    creditBalance: function (studentId) {
      return load().credits
        .filter(function (c) { return c.student_id === studentId; })
        .reduce(function (sum, c) { return sum + c.delta; }, 0);
    },
    creditHistory: function (studentId) {
      return load().credits
        .filter(function (c) { return c.student_id === studentId; })
        .sort(function (a, b) { return b.created_at.localeCompare(a.created_at); });
    },
    getToken: function (studentId) {
      var t = load().tokens.find(function (x) { return x.student_id === studentId && !x.revoked; });
      return t ? t.token : null;
    },
    issueToken: function (studentId) {
      var db = load();
      db.tokens.forEach(function (x) { if (x.student_id === studentId) x.revoked = true; });
      var bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      var token = Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      db.tokens.push({ id: uid("demo-t"), student_id: studentId, token: token, revoked: false,
        created_at: new Date().toISOString() });
      save(db);
      return token;
    },
    portalView: function (token) {
      var db = load();
      var t = db.tokens.find(function (x) { return x.token === token && !x.revoked; });
      if (!t) return { ok: false };
      var s = db.students.find(function (x) { return x.id === t.student_id && x.active; });
      if (!s) return { ok: false };
      var self = this;
      return {
        ok: true,
        student: { name: s.name, grade_level: s.grade_level },
        balance: self.creditBalance(s.id),
        attendance: self.listAttendance(s.id, 30).map(function (a) {
          return { date: a.lesson_date, status: a.status };
        })
      };
    }
  };
})();
