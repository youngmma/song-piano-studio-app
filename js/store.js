/* Song Piano Studio Manager — 데이터 스토어
 * Supabase 연결 시 실제 DB, 미연결 시 데모 모드(localStorage).
 * 모든 메서드는 Promise를 반환한다.
 */
(function () {
  var sb = null; // supabase client

  function useSupabase() {
    return window.SPS_CONFIG.isConfigured() && typeof window.supabase !== "undefined";
  }
  function client() {
    if (!sb) {
      sb = window.supabase.createClient(
        window.SPS_CONFIG.SUPABASE_URL,
        window.SPS_CONFIG.SUPABASE_ANON_KEY
      );
    }
    return sb;
  }
  function resetClient() { sb = null; }

  function genToken() {
    var bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  var Demo = {
    listStudents: function () { return Promise.resolve(window.SPS_DEMO.listStudents()); },
    getStudent: function (id) { return Promise.resolve(window.SPS_DEMO.getStudent(id)); },
    saveStudent: function (d) { window.SPS_DEMO.saveStudent(d); return Promise.resolve(); },
    setStudentActive: function (id, a) { window.SPS_DEMO.setStudentActive(id, a); return Promise.resolve(); },
    listSlots: function (sid) { return Promise.resolve(window.SPS_DEMO.listSlots(sid)); },
    addSlot: function (sid, wd, t, dur) { window.SPS_DEMO.addSlot(sid, wd, t, dur); return Promise.resolve(); },
    deleteSlot: function (id) { window.SPS_DEMO.deleteSlot(id); return Promise.resolve(); },
    todayLessons: function (ds, wd) { return Promise.resolve(window.SPS_DEMO.todayLessons(ds, wd)); },
    markAttendance: function (sid, ds, st) { return Promise.resolve(window.SPS_DEMO.markAttendance(sid, ds, st)); },
    listAttendance: function (sid, n) { return Promise.resolve(window.SPS_DEMO.listAttendance(sid, n)); },
    creditBalance: function (sid) { return Promise.resolve(window.SPS_DEMO.creditBalance(sid)); },
    creditHistory: function (sid) { return Promise.resolve(window.SPS_DEMO.creditHistory(sid)); },
    getToken: function (sid) { return Promise.resolve(window.SPS_DEMO.getToken(sid)); },
    issueToken: function (sid) { return Promise.resolve(window.SPS_DEMO.issueToken(sid)); },
    portalView: function (tok) { return Promise.resolve(window.SPS_DEMO.portalView(tok)); }
  };

  var Live = {
    _check: function (res) {
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    listStudents: function () {
      return client().from("students").select("*").order("name")
        .then(this._check);
    },
    getStudent: function (id) {
      return client().from("students").select("*").eq("id", id).single()
        .then(this._check);
    },
    saveStudent: function (d) {
      var payload = { name: d.name, grade_level: d.grade_level || null,
        parent_name: d.parent_name || null, contact_phone: d.contact_phone || null };
      var q = d.id
        ? client().from("students").update(payload).eq("id", d.id)
        : client().from("students").insert(payload);
      return q.then(this._check).then(function () {});
    },
    setStudentActive: function (id, active) {
      return client().from("students").update({ active: active }).eq("id", id)
        .then(this._check).then(function () {});
    },
    listSlots: function (sid) {
      return client().from("lesson_slots").select("*").eq("student_id", sid).eq("active", true)
        .order("weekday").order("start_time").then(this._check);
    },
    addSlot: function (sid, wd, t, dur) {
      return client().from("lesson_slots")
        .insert({ student_id: sid, weekday: wd, start_time: t, duration_min: dur || 30 })
        .then(this._check).then(function () {});
    },
    deleteSlot: function (id) {
      return client().from("lesson_slots").update({ active: false }).eq("id", id)
        .then(this._check).then(function () {});
    },
    todayLessons: function (ds, wd) {
      var self = this;
      return client().from("lesson_slots").select("*, students(*)")
        .eq("weekday", wd).eq("active", true)
        .then(self._check)
        .then(function (slots) {
          slots = slots.filter(function (l) { return l.students && l.students.active; });
          return client().from("attendance").select("*").eq("lesson_date", ds)
            .then(self._check)
            .then(function (atts) {
              var map = {};
              atts.forEach(function (a) { map[a.student_id] = a; });
              return slots
                .map(function (l) {
                  return { slot: l, student: l.students, attendance: map[l.students.id] || null };
                })
                .sort(function (a, b) { return a.slot.start_time.localeCompare(b.slot.start_time); });
            });
        });
    },
    markAttendance: function (sid, ds, status) {
      // upsert: 같은 (student_id, lesson_date)는 한 행만 유지. 크레딧은 DB 트리거가 처리.
      return client().from("attendance")
        .upsert({ student_id: sid, lesson_date: ds, status: status },
                { onConflict: "student_id,lesson_date" })
        .then(this._check).then(function () {});
    },
    listAttendance: function (sid, n) {
      return client().from("attendance").select("*").eq("student_id", sid)
        .order("lesson_date", { ascending: false }).limit(n || 30).then(this._check);
    },
    creditBalance: function (sid) {
      return client().rpc("credit_balance", { p_student: sid }).then(this._check);
    },
    creditHistory: function (sid) {
      return client().from("makeup_credits").select("*").eq("student_id", sid)
        .order("created_at", { ascending: false }).limit(50).then(this._check);
    },
    getToken: function (sid) {
      return client().from("portal_tokens").select("token").eq("student_id", sid)
        .eq("revoked", false).order("created_at", { ascending: false }).limit(1)
        .then(this._check)
        .then(function (rows) { return rows.length ? rows[0].token : null; });
    },
    issueToken: function (sid) {
      var self = this;
      var token = genToken();
      return client().from("portal_tokens").update({ revoked: true }).eq("student_id", sid)
        .then(self._check)
        .then(function () {
          return client().from("portal_tokens").insert({ student_id: sid, token: token });
        })
        .then(self._check)
        .then(function () { return token; });
    },
    portalView: function (tok) {
      return client().rpc("portal_view", { p_token: tok }).then(this._check);
    }
  };

  window.SPS_STORE = {
    isLive: useSupabase,
    resetClient: resetClient,
    auth: {
      session: function () {
        if (!useSupabase()) return Promise.resolve(null);
        return client().auth.getSession().then(function (r) { return r.data.session; });
      },
      signIn: function (email, password) {
        return client().auth.signInWithPassword({ email: email, password: password })
          .then(function (r) {
            if (r.error) throw new Error(r.error.message);
            return r.data.session;
          });
      },
      signOut: function () {
        if (!useSupabase()) return Promise.resolve();
        return client().auth.signOut();
      }
    }
  };

  ["listStudents","getStudent","saveStudent","setStudentActive","listSlots","addSlot",
   "deleteSlot","todayLessons","markAttendance","listAttendance","creditBalance",
   "creditHistory","getToken","issueToken","portalView"].forEach(function (name) {
    window.SPS_STORE[name] = function () {
      var args = arguments;
      var impl = useSupabase() ? Live : Demo;
      return impl[name].apply(impl, args);
    };
  });
})();
