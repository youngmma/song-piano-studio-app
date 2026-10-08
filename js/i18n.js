/* Song Piano Studio Manager — 한/영 사전.
 * UI 카피는 구어체 한국어 우선. em dash 사용 금지.
 */
window.SPS_I18N = {
  ko: {
    appName: "송 피아노 스튜디오",
    appSub: "수업 관리",
    today: "오늘의 수업",
    students: "원생",
    credits: "보강 크레딧",
    settings: "설정",
    noLessonsToday: "오늘 예정된 수업이 없어요.",
    noStudents: "등록된 원생이 없어요. 원생 탭에서 추가해 주세요.",
    addStudent: "원생 추가",
    editStudent: "원생 정보 수정",
    name: "이름",
    gradeLevel: "학년 / 레벨",
    gradePh: "예: 초3, Level 4",
    parentName: "학부모 이름",
    contact: "학부모 연락처",
    lessonDay: "수업 요일",
    lessonTime: "수업 시간",
    addSlot: "수업 시간 추가",
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    close: "닫기",
    present: "출석",
    absent: "결석",
    makeup: "보강",
    creditBalance: "보강 잔액",
    creditUnit: "회",
    portalLink: "학부모 포털 링크",
    copyLink: "링크 복사",
    copied: "복사됐어요.",
    newToken: "새 링크 발급",
    tokenNewWarn: "새 링크를 발급하면 이전 링크는 사용할 수 없어요. 계속할까요?",
    setupNeeded: "데이터베이스 연결이 필요해요",
    setupDesc: "Supabase 프로젝트를 만들고 설정 탭에서 URL과 키를 입력하면 실제 데이터로 동작해요. 지금은 데모 모드로 화면만 확인할 수 있어요.",
    goSettings: "설정으로 이동",
    demoMode: "데모 모드",
    supabaseUrl: "Supabase URL",
    supabaseKey: "Supabase anon key",
    keyWarn: "anon key만 입력하세요. service_role 키는 절대 입력하지 마세요.",
    connect: "연결하기",
    disconnect: "연결 해제",
    signIn: "로그인",
    signOut: "로그아웃",
    email: "이메일",
    password: "비밀번호",
    language: "언어 / Language",
    confirmDelete: "정말 삭제할까요?",
    saved: "저장됐어요.",
    attendanceSaved: "출석이 기록됐어요.",
    portalTitle: "우리 아이 수업 기록",
    portalBalance: "남은 보강 횟수",
    portalHistory: "최근 수업 기록",
    portalInvalid: "유효하지 않은 링크예요. 원장에게 새 링크를 요청해 주세요.",
    footer: "© 2026 Young Ma Studio",
    sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토",
    min: "분",
    active: "재원 중",
    inactive: "휴원/퇴원",
    deactivate: "휴원 처리",
    reactivate: "재원 처리",
    status: "상태",
    noHistory: "아직 수업 기록이 없어요.",
    setupGuide: "설치 안내 보기",
    manualCreditNote: "보강 크레딧은 결석/보강 기록 시 자동으로 계산돼요.",
    todayLessonsCount: "오늘 수업",
    unmarked: "미기록",
  },
  en: {
    appName: "Song Piano Studio",
    appSub: "Lesson Manager",
    today: "Today's Lessons",
    students: "Students",
    credits: "Makeup Credits",
    settings: "Settings",
    noLessonsToday: "No lessons scheduled for today.",
    noStudents: "No students yet. Add one from the Students tab.",
    addStudent: "Add Student",
    editStudent: "Edit Student",
    name: "Name",
    gradeLevel: "Grade / Level",
    gradePh: "e.g. Grade 3, Level 4",
    parentName: "Parent Name",
    contact: "Parent Contact",
    lessonDay: "Lesson Day",
    lessonTime: "Lesson Time",
    addSlot: "Add Lesson Time",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    close: "Close",
    present: "Present",
    absent: "Absent",
    makeup: "Makeup",
    creditBalance: "Makeup Balance",
    creditUnit: "",
    portalLink: "Parent Portal Link",
    copyLink: "Copy Link",
    copied: "Copied.",
    newToken: "Issue New Link",
    tokenNewWarn: "Issuing a new link will disable the previous one. Continue?",
    setupNeeded: "Database Connection Needed",
    setupDesc: "Create a Supabase project and enter the URL and key in Settings to use real data. For now, demo mode shows the screens only.",
    goSettings: "Go to Settings",
    demoMode: "Demo Mode",
    supabaseUrl: "Supabase URL",
    supabaseKey: "Supabase anon key",
    keyWarn: "Enter the anon key only. Never enter the service_role key.",
    connect: "Connect",
    disconnect: "Disconnect",
    signIn: "Sign In",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    language: "Language",
    confirmDelete: "Delete this?",
    saved: "Saved.",
    attendanceSaved: "Attendance recorded.",
    portalTitle: "My Child's Lesson Records",
    portalBalance: "Makeup Lessons Remaining",
    portalHistory: "Recent Lessons",
    portalInvalid: "This link is not valid. Please ask the studio for a new link.",
    footer: "© 2026 Young Ma Studio",
    sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat",
    min: "min",
    active: "Active",
    inactive: "Inactive",
    deactivate: "Mark Inactive",
    reactivate: "Mark Active",
    status: "Status",
    noHistory: "No lesson records yet.",
    setupGuide: "View Setup Guide",
    manualCreditNote: "Makeup credits are calculated automatically when absence or makeup is recorded.",
    todayLessonsCount: "lessons today",
    unmarked: "Not marked",
  },
};

(function () {
  var lang = "ko";
  try { lang = localStorage.getItem("sps_lang") || "ko"; } catch (e) {}
  if (!window.SPS_I18N[lang]) lang = "ko";

  window.SPS = window.SPS || {};
  window.SPS.lang = lang;
  window.SPS.t = function (key) {
    var d = window.SPS_I18N[window.SPS.lang] || window.SPS_I18N.ko;
    return d[key] !== undefined ? d[key] : key;
  };
  window.SPS.setLang = function (l) {
    if (!window.SPS_I18N[l]) return;
    window.SPS.lang = l;
    try { localStorage.setItem("sps_lang", l); } catch (e) {}
    window.SPS.applyI18n();
  };
  window.SPS.applyI18n = function () {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = window.SPS.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", window.SPS.t(el.getAttribute("data-i18n-ph")));
    });
    document.documentElement.lang = window.SPS.lang === "ko" ? "ko" : "en";
  };
  window.SPS.weekdayName = function (wd) {
    return window.SPS.t(["sun", "mon", "tue", "wed", "thu", "fri", "sat"][wd]);
  };
})();
