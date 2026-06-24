import { useState } from "react";

// ─────────────────────────────────────────────────────────
// 실제 WBS 데이터 (전송자격인증_특부가재등록_WBS 기준)
// ─────────────────────────────────────────────────────────

const DEV_P0 = [
  { id:"DEV-01", name:"발신번호 등록·변경·삭제 이력 관리 시스템", owner:"기획+개발", status:"기획필요", note:"FAQ Q19 핵심 — 시스템적으로 통제 필수" },
  { id:"DEV-02", name:"계정별 발신번호 회선수 자동 카운팅·초과 제한", owner:"개발", status:"개발필요", note:"DEV-03과 연계 설계 필요" },
  { id:"DEV-03", name:"초과 등록 보류 처리·관리자 승인 흐름", owner:"개발", status:"개발필요", note:"DEV-02와 연계 설계 필요" },
  { id:"DEV-24", name:"KTOA 이용증명원 실시간 검증 연동", owner:"기획+개발", status:"기획필요", note:"Swagger 원문 확인 선행 필요 — 외부 문의 아직 미진행", risk:true },
  { id:"DEV-08", name:"금칙어·악성URL·차단전화번호 자동 차단체계", owner:"개발", status:"기획필요", note:"메시지허브 X-ray 미구현 확인 → 자체 구축 검토 필수", risk:true },
  { id:"DEV-09", name:"차단/보류 발생 시 이용자 안내 팝업", owner:"기획+개발", status:"기획필요", note:"DEV-08 확정 후 화면 설계 가능" },
  { id:"DEV-10", name:"금칙어 관리 리스트 & 주기적 업데이트 체계", owner:"기획+개발", status:"기획필요", note:"KISA 연동 또는 자체 리스트 방향 결정 필요" },
  { id:"DEV-19", name:"문자 발송 시 추가인증(발신번호 확인) 팝업", owner:"개발", status:"기획전달예정", note:"심사기관 6/18 문의 — 진입 인증 인정 여부 회신 대기" },
  { id:"DEV-12", name:"역할별 접근권한 설계 (RBAC) + 계정별 이력", owner:"기획+개발", status:"개발필요", note:"발신번호 사용관리 권한 변경 이력 저장 포함" },
];

const DEV_P1 = [
  { id:"DEV-04", name:"문자발송 API 진입점 국외 IP 차단 미들웨어", owner:"개발", status:"소명예정", note:"Azure/Imperva 설정 캡처 증적 준비" },
  { id:"DEV-05", name:"국외 IP 예외 허용 관리자 승인 기능", owner:"개발", status:"소명예정", note:"예외 정책 자체를 운영 안 하는 방향으로 소명" },
  { id:"DEV-06", name:"VPN·프록시 우회접속 탐지 조치", owner:"개발", status:"소명예정", note:"Imperva/Penta WAF 활용 여부 확인" },
  { id:"DEV-17", name:"인사이동·퇴직 시 권한 즉시 회수 프로세스", owner:"개발", status:"개발필요", note:"학교알리미 교직원 삭제 연동 증빙" },
  { id:"DEV-20", name:"이용자 접속·발송·결제 로그 저장체계", owner:"개발", status:"개발필요", note:"최소 1년 이상 보관 요건(FAQ Q63)" },
  { id:"DEV-21", name:"관리자 접속·개인정보 조회 시스템 로그", owner:"개발", status:"개발필요", note:"현행 확인 후 누락 항목 개발" },
];

const DEV_P2 = [
  { id:"DEV-11", name:"회원가입 본인확인·1인 1계정 중복 차단", owner:"개발", status:"소명예정", note:"6/22 회신: 중복가입 차단 절차 소명 가능성 확인" },
  { id:"DEV-13", name:"약관 동의 화면·이력 시스템 저장", owner:"기획", status:"증빙필요", note:"동의 이력 저장 여부 개발 확인 필요" },
  { id:"DEV-14", name:"이용료 계정별 귀속·명의 불일치 보류", owner:"개발", status:"소명예정", note:"학교단위 계약 구조로 소명 가능 여부 확인" },
  { id:"DEV-27", name:"세션 내 재인증 기준 정책 및 시스템 반영", owner:"개발+기획", status:"소명예정", note:"대량발송 사유 입력 → 재인증 수단 아닌 사후 추적 근거로 정리" },
  { id:"DEV-28", name:"API·모듈 발송 기업관리자 사후승인 체계", owner:"개발", status:"소명예정", note:"직접 API 발송 아님 소명 가능 여부 확인" },
];

const EXTERNAL = [
  { id:"DEV-11", name:"문자 진입 본인인증 → 회원가입 대체 소명", target:"심사기관", status:"답변대기", note:"6/18 문의완료 / 중복탐지 절차 소명 필요", risk:false },
  { id:"DEV-18", name:"간편비밀번호 = 다중인증 수단 인정 여부", target:"심사기관", status:"긍정회신", note:"6/22 회신: 인정 가능성 있다고 답변", risk:false },
  { id:"DEV-19", name:"진입 인증 → 문자 발송 추가인증 인정 여부", target:"심사기관", status:"답변대기", note:"6/18 문의완료 / 회신 확인 필요", risk:false },
  { id:"DEV-08", name:"메시지허브 X-ray 차단체계로 자체 증빙 대체 가능 여부", target:"메시지허브", status:"리스크", note:"구축 일정 없음 회신 → P0 금칙어 항목 전체 영향", risk:true },
  { id:"DEV-24", name:"KTOA API 연동 방식·응답규격·Rate Limit 확인", target:"KTOA", status:"미문의", note:"외부 문의 즉시 필요 / Swagger 원문 미확인", risk:true },
];

const DOCS_CERT = [
  { no:"①", name:"체크리스트 v5 현황 O/X 점검 완료", due:"6/20", owner:"기획+개발", status:"수급예정" },
  { no:"②", name:"법인 등기사항증명서 또는 사업자등록증명", due:"7/11", owner:"기획(인사)", status:"수급예정" },
  { no:"③", name:"이용약관 전문 (불법스팸 금지·이용제한 조항 포함)", due:"7/11", owner:"기획", status:"수급예정" },
  { no:"④", name:"기업 간 계약서·서비스 신청서 (불법스팸 의무 포함 여부)", due:"7/11", owner:"기획", status:"소명예정" },
  { no:"⑤", name:"사무실 확보 증명서 (임대차계약서 등)", due:"7/11", owner:"기획(인사)", status:"수급예정" },
  { no:"⑥", name:"불법스팸 발송 방지계획서 (운영 프로세스 기술 포함)", due:"7/12", owner:"기획", status:"수정필요" },
  { no:"⑦", name:"전송자격인증 신청서 hwpx (대표자 날인)", due:"7/14", owner:"기획", status:"수급예정" },
  { no:"⑧", name:"체크리스트 v5 O/X 최종본 (기획+개발 공동 서명)", due:"7/14", owner:"기획+개발", status:"수급예정" },
  { no:"⑨", name:"제출서류 전체 취합 → antispam@korea.kr 발송", due:"7/14", owner:"기획", status:"-" },
];

const DOCS_REREG = [
  { no:"⑩", name:"납입자본금 1억 이상 확인서류 (등기사항증명서)", due:"9/17", owner:"기획(재무)", status:"증빙필요" },
  { no:"⑪", name:"CISO 지정·공표 확인 (홈페이지 캡처)", due:"9/17", owner:"기획", status:"증빙필요" },
  { no:"⑫", name:"전담직원 채용계약서 (대표 제외 1명 이상)", due:"9/17", owner:"기획(HR)", status:"증빙필요" },
  { no:"⑬", name:"정보보호 기술조치 (취약점 점검 연 1회) 결과", due:"9/18", owner:"기획+개발", status:"증빙필요" },
  { no:"⑭", name:"식별코드 삽입·KISA 연동 확인서 (기존 의무)", due:"9/18", owner:"개발", status:"외부문의" },
  { no:"⑮", name:"X-ray 속이는 문자 식별·차단체계 적용 확인서 (신규)", due:"9/18", owner:"개발", status:"리스크" },
];

const STATUS_STYLE = {
  "기획필요": "bg-red-100 text-red-700",
  "개발필요": "bg-red-100 text-red-700",
  "기획전달예정": "bg-amber-100 text-amber-700",
  "소명예정": "bg-blue-100 text-blue-700",
  "증빙필요": "bg-violet-100 text-violet-700",
  "완료": "bg-emerald-100 text-emerald-700",
};
const DOC_STATUS_STYLE = {
  "수급예정": "bg-slate-100 text-slate-500",
  "수정필요": "bg-amber-100 text-amber-700",
  "소명예정": "bg-blue-100 text-blue-700",
  "증빙필요": "bg-violet-100 text-violet-700",
  "리스크": "bg-red-100 text-red-700",
  "외부문의": "bg-orange-100 text-orange-700",
  "-": "bg-slate-100 text-slate-400",
  "완료": "bg-emerald-100 text-emerald-700",
};
const EXT_STATUS_STYLE = {
  "긍정회신": "bg-emerald-100 text-emerald-700",
  "답변대기": "bg-amber-100 text-amber-700",
  "리스크": "bg-red-100 text-red-700",
  "미문의": "bg-red-100 text-red-700",
};

export default function App() {
  const [tab, setTab] = useState("dev");
  const [devFilter, setDevFilter] = useState("P0");
  const [taskDone, setTaskDone] = useState({});
  const [docDone, setDocDone] = useState({});
  const [extDone, setExtDone] = useState({});

  const toggleTask = (id) => setTaskDone(p => ({ ...p, [id]: !p[id] }));
  const toggleDoc  = (k)  => setDocDone(p => ({ ...p, [k]: !p[k] }));
  const toggleExt  = (id) => setExtDone(p => ({ ...p, [id]: !p[id] }));

  const devItems = devFilter === "P0" ? DEV_P0 : devFilter === "P1" ? DEV_P1 : DEV_P2;
  const doneCount = Object.values(taskDone).filter(Boolean).length;
  const totalDev = DEV_P0.length + DEV_P1.length + DEV_P2.length;

  const extDoneCount = Object.values(extDone).filter(Boolean).length;
  const docDoneCount = Object.values(docDone).filter(Boolean).length;
  const totalDocs = DOCS_CERT.length + DOCS_REREG.length;

  return (
    <div className="min-h-screen bg-slate-50" style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif"}}>

      {/* ── 헤더 ─────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white px-4 py-5">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-slate-400 text-[11px] tracking-widest uppercase mb-1">HiClass · 규제대응 · 2026</p>
              <h1 className="text-lg font-bold">📡 전송자격인증 & 특부가 재등록</h1>
              <p className="text-slate-400 text-xs mt-0.5">전기통신사업법 제22조의11 · 법정기한 2026.10.27</p>
            </div>

            {/* 3개 D-day */}
            <div className="flex gap-3">
              {[
                { label:"전송자격 신청", date:"7/30", days:38, color:"text-amber-400" },
                { label:"특부가 재등록", date:"9/19",  days:89, color:"text-orange-400" },
                { label:"법정 데드라인", date:"10/27", days:127, color:"text-red-400" },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <div className={`text-2xl font-black ${m.color}`}>D-{m.days}</div>
                  <div className="text-slate-400 text-[10px]">{m.label}</div>
                  <div className="text-slate-500 text-[10px]">{m.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 진행률 3줄 */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label:"개발항목 완료", done:doneCount, total:totalDev, color:"bg-blue-400" },
              { label:"외부확인 완료", done:extDoneCount, total:EXTERNAL.length, color:"bg-violet-400" },
              { label:"서류 준비 완료", done:docDoneCount, total:totalDocs, color:"bg-emerald-400" },
            ].map(b => {
              const pct = b.total ? Math.round((b.done/b.total)*100) : 0;
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{b.label}</span>
                    <span className="text-white font-semibold">{b.done}/{b.total}</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full">
                    <div className={`h-1 rounded-full ${b.color}`} style={{width:`${pct}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* WBS 링크 */}
          <div className="mt-3 flex items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1alwzM9aqT8uUr7EIkLfIb07sEsVJb-F8hqKVrUEwT5I/edit"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-white underline flex items-center gap-1"
            >
              📊 전송자격인증_특부가재등록_WBS (Google Sheets)
            </a>
            <span className="text-slate-600 text-[10px]">← WBS 전체 관리는 기존 스프레드시트 유지</span>
          </div>
        </div>
      </header>

      {/* ── 탭 ───────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex">
          {[
            { id:"dev",  label:"🔴 개발 우선순위" },
            { id:"ext",  label:"📞 외부 확인 현황" },
            { id:"docs", label:"📁 서류 준비 현황" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab===t.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-5">

        {/* ── 개발 우선순위 탭 ──────────────────────────── */}
        {tab === "dev" && (
          <div>
            {/* 리스크 배너 */}
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <span className="text-red-500 text-lg shrink-0 mt-0.5">⚠</span>
              <div>
                <p className="text-red-700 text-sm font-semibold">메시지허브 X-ray 미구현 → P0 금칙어 항목 전체 리스크</p>
                <p className="text-red-600 text-xs mt-0.5">메시지허브 구축 일정 없음 회신. DEV-08~10 자체 구축 방향 즉시 결정 필요. 7/30 신청 목표 직접 영향.</p>
              </div>
            </div>

            {/* P0/P1/P2 필터 */}
            <div className="flex gap-2 mb-4">
              {[
                { key:"P0", label:`P0 필수 (${DEV_P0.length})`, color:"bg-red-100 text-red-700 border-red-200" },
                { key:"P1", label:`P1 중요 (${DEV_P1.length})`, color:"bg-amber-100 text-amber-700 border-amber-200" },
                { key:"P2", label:`P2 보완 (${DEV_P2.length})`, color:"bg-blue-100 text-blue-700 border-blue-200" },
              ].map(f => (
                <button key={f.key} onClick={() => setDevFilter(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${f.color} ${devFilter===f.key ? "ring-2 ring-offset-1 ring-current" : "opacity-60"}`}>
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-400 flex items-center">클릭해서 완료 체크</span>
            </div>

            {/* 우선순위 배지 */}
            <div className={`mb-3 text-xs font-bold px-3 py-1 rounded inline-block ${
              devFilter==="P0" ? "bg-red-600 text-white" :
              devFilter==="P1" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
            }`}>
              {devFilter==="P0" ? "🚨 신청일(7/30) 전 완료 필수" :
               devFilter==="P1" ? "⚡ 신청 후 심사 기간 내 대응 가능" : "📋 소명·보완 항목"}
            </div>

            <div className="space-y-2">
              {/* 컬럼 헤더 */}
              <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/>
                <span className="w-16 shrink-0">DEV#</span>
                <span className="flex-1">개발 항목</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">담당</span>
                <span className="w-20 shrink-0 text-right">현행 상태</span>
              </div>

              {devItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleTask(item.id)}
                  className={`flex items-start gap-3 px-4 py-3 bg-white border rounded-lg cursor-pointer hover:bg-slate-50 transition-all ${
                    taskDone[item.id] ? "opacity-50 border-slate-200" : item.risk ? "border-red-200" : "border-slate-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    taskDone[item.id] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                  }`}>
                    {taskDone[item.id] && <span className="text-white text-[9px] font-bold">✓</span>}
                  </div>
                  <span className="text-xs font-mono text-slate-400 w-16 shrink-0 pt-0.5">{item.id}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${taskDone[item.id] ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {item.name}
                      {item.risk && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">⚠ 리스크</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                  </div>
                  <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[item.status] || "bg-slate-100 text-slate-500"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 외부 확인 현황 탭 ────────────────────────── */}
        {tab === "ext" && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              <strong>이번 주 액션:</strong> KTOA API 스웨거 원문 확인 후 snb.ktoa.or.kr 문의 진행 (DEV-24 P0)
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* 헤더 */}
              <div className="flex gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/>
                <span className="w-14 shrink-0">DEV#</span>
                <span className="flex-1">확인 항목</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">확인 대상</span>
                <span className="w-20 shrink-0 text-right">상태</span>
              </div>
              <div className="divide-y divide-slate-100">
                {EXTERNAL.map(item => (
                  <div key={item.id}
                    onClick={() => toggleExt(item.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${extDone[item.id] ? "opacity-50" : ""}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      extDone[item.id] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                    }`}>
                      {extDone[item.id] && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    <span className="text-xs font-mono text-slate-400 w-14 shrink-0 pt-0.5">{item.id}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${extDone[item.id] ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {item.name}
                        {item.risk && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">⚠</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                    </div>
                    <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.target}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${EXT_STATUS_STYLE[item.status] || "bg-slate-100 text-slate-500"}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 연락처 */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-4">
              <h3 className="text-xs font-semibold text-slate-600 mb-3">📌 주요 연락처</h3>
              <div className="space-y-2">
                {[
                  { label:"전송자격인증 신청·접수", contact:"antispam@korea.kr", note:"방송미디어통신위원회" },
                  { label:"인증심사 기술지원", contact:"srt@kisa.or.kr", note:"KISA" },
                  { label:"식별코드 삽입·위변조", contact:"numbers@kisa.or.kr", note:"KISA" },
                  { label:"X-ray 악성문자 차단", contact:"x-ray@kisa.or.kr", note:"KISA" },
                  { label:"KTOA 이용증명원", contact:"snb.ktoa.or.kr", note:"한국통신사업자연합회" },
                ].map(c => (
                  <div key={c.contact} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-36 shrink-0">{c.label}</span>
                    <span className="text-xs font-mono text-blue-600">{c.contact}</span>
                    <span className="text-[10px] text-slate-400">{c.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 서류 준비 현황 탭 ────────────────────────── */}
        {tab === "docs" && (
          <div className="space-y-4">
            {/* 전송자격인증 서류 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">전송자격인증 신청 서류</h3>
                  <p className="text-xs text-amber-700 mt-0.5">제출처: antispam@korea.kr · 신청 목표: 7/30</p>
                </div>
                <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {DOCS_CERT.filter((_,i)=>docDone["c"+i]).length}/{DOCS_CERT.length} 완료
                </span>
              </div>
              <div className="flex gap-3 px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/>
                <span className="w-5 shrink-0">#</span>
                <span className="flex-1">서류명</span>
                <span className="w-14 shrink-0 text-right hidden md:block">마감</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">담당</span>
                <span className="w-20 shrink-0 text-right">상태</span>
              </div>
              <div className="divide-y divide-slate-100">
                {DOCS_CERT.map((d,i) => (
                  <div key={i} onClick={() => toggleDoc("c"+i)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${docDone["c"+i] ? "opacity-50" : ""}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${docDone["c"+i] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                      {docDone["c"+i] && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    <span className="text-xs text-slate-400 w-5 shrink-0">{d.no}</span>
                    <span className={`flex-1 text-sm ${docDone["c"+i] ? "line-through text-slate-400" : "text-slate-700"}`}>{d.name}</span>
                    <span className="text-xs text-slate-400 w-14 shrink-0 text-right hidden md:block">{d.due}</span>
                    <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{d.owner}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${DOC_STATUS_STYLE[d.status]}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 특부가 재등록 서류 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-violet-900">특부가 재등록 서류</h3>
                  <p className="text-xs text-violet-700 mt-0.5">중앙전파관리소 제출 · 재등록 신청 목표: 9/19~9/20</p>
                </div>
                <span className="text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                  {DOCS_REREG.filter((_,i)=>docDone["r"+i]).length}/{DOCS_REREG.length} 완료
                </span>
              </div>
              <div className="flex gap-3 px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/>
                <span className="w-5 shrink-0">#</span>
                <span className="flex-1">서류명</span>
                <span className="w-14 shrink-0 text-right hidden md:block">마감</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">담당</span>
                <span className="w-20 shrink-0 text-right">상태</span>
              </div>
              <div className="divide-y divide-slate-100">
                {DOCS_REREG.map((d,i) => (
                  <div key={i} onClick={() => toggleDoc("r"+i)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${docDone["r"+i] ? "opacity-50" : ""}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${docDone["r"+i] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                      {docDone["r"+i] && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    <span className="text-xs text-slate-400 w-5 shrink-0">{d.no}</span>
                    <span className={`flex-1 text-sm ${docDone["r"+i] ? "line-through text-slate-400" : d.status==="리스크" ? "text-red-700 font-medium" : "text-slate-700"}`}>{d.name}</span>
                    <span className="text-xs text-slate-400 w-14 shrink-0 text-right hidden md:block">{d.due}</span>
                    <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{d.owner}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${DOC_STATUS_STYLE[d.status]}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="max-w-4xl mx-auto px-4 pb-8 pt-2 text-center text-[10px] text-slate-400">
        하이클래스 서비스기획팀 · 2026.06.22 기준 · 법정 데드라인 2026.10.27 · WBS 전체는 Google Sheets에서 관리
      </footer>
    </div>
  );
}
