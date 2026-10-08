/* Song Piano Studio Manager — Supabase 설정 로더
 *
 * 규칙: Supabase URL / anon key를 코드에 하드코딩하지 않는다.
 * 1) 아래 PLACEHOLDER를 실제 값으로 바꾸는 방식은 "배포자가 직접 입력"하는
 *    용도로만 남겨 둔다 (이 파일은 GitHub에 공개되어도 키가 들어가지 않게
 *    실제 키를 넣지 말 것).
 * 2) 실제 운영에서는 앱의 설정 화면에서 입력하면 localStorage에만 저장된다
 *    (기기 로컬, 서버 전송 없음, 코드/깃에 남지 않음).
 */
window.SPS_CONFIG = {
  SUPABASE_URL: "",      // 예: https://xyzcompany.supabase.co  (설정 화면에서 입력)
  SUPABASE_ANON_KEY: "", // anon public key (설정 화면에서 입력, service_role 키 절대 금지)
};

(function () {
  try {
    var saved = JSON.parse(localStorage.getItem("sps_supabase") || "{}");
    if (saved.url) window.SPS_CONFIG.SUPABASE_URL = saved.url;
    if (saved.anonKey) window.SPS_CONFIG.SUPABASE_ANON_KEY = saved.anonKey;
  } catch (e) { /* 저장값 파싱 실패 시 무시 */ }

  window.SPS_CONFIG.isConfigured = function () {
    return !!(window.SPS_CONFIG.SUPABASE_URL && window.SPS_CONFIG.SUPABASE_ANON_KEY);
  };
  window.SPS_CONFIG.save = function (url, anonKey) {
    localStorage.setItem("sps_supabase", JSON.stringify({ url: url, anonKey: anonKey }));
    window.SPS_CONFIG.SUPABASE_URL = url;
    window.SPS_CONFIG.SUPABASE_ANON_KEY = anonKey;
  };
  window.SPS_CONFIG.clear = function () {
    localStorage.removeItem("sps_supabase");
    window.SPS_CONFIG.SUPABASE_URL = "";
    window.SPS_CONFIG.SUPABASE_ANON_KEY = "";
  };
})();
