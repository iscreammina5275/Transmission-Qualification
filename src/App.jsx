import { useState, useEffect } from "react";
import { db, isConfigured } from "./firebase";
import { ref, onValue, update } from "firebase/database";

// ─── 상태 옵션 ────────────────────────────────────────────
const DEV_STATUS_OPTIONS = ["기획필요","개발필요","기획전달예정","소명예정","증빙필요","완료"];
const EXT_STATUS_OPTIONS = ["미문의","답변대기","긍정회신","리스크","완료"];
const DOC_STATUS_OPTIONS = ["수급예정","수정필요","소명예정","증빙필요","외부문의","리스크","-","완료"];

// ─── 기본 데이터 ──────────────────────────────────────────
const BASE_DEV_P0 = [
  { id:"DEV-01", name:"발신번호 등록·변경·삭제 이력 관리 시스템", owner:"기획+개발", status:"기획필요", note:"FAQ Q19 핵심 — 시스템적으로 통제 필수" },
  { id:"DEV-02", name:"계정별 발신번호 회선수 자동 카운팅·초과 제한", owner:"개발", status:"개발필요", note:"DEV-03과 연계 설계 필요" },
  { id:"DEV-03", name:"초과 등록 보류 처리·관리자 승인 흐름", owner:"개발", status:"개발필요", note:"DEV-02와 연계 설계 필요" },
  { id:"DEV-24", name:"KTOA 이용증명원 실시간 검증 연동", owner:"기획+개발", status:"기획필요", note:"Swagger 원문 확인 선행 필요 — 외부 문의 아직 미진행", risk:true },
  { id:"DEV-08", name:"금칙어·악성URL·차단전화번호 자동 차단체계", owner:"개발", status:"기획필요", note:"자체 구축 방향 즉시 결정 필요", risk:true },
  { id:"DEV-09", name:"차단/보류 발생 시 이용자 안내 팝업", owner:"기획+개발", status:"기획필요", note:"DEV-08 확정 후 화면 설계 가능" },
  { id:"DEV-10", name:"금칙어 관리 리스트 & 주기적 업데이트 체계", owner:"기획+개발", status:"기획필요", note:"KISA 연동 또는 자체 리스트 방향 결정 필요" },
  { id:"DEV-19", name:"문자 발송 시 추가인증(발신번호 확인) 팝업", owner:"개발", status:"기획전달예정", note:"심사기관 6/18 문의 — 진입 인증 인정 여부 회신 대기" },
  { id:"DEV-12", name:"역할별 접근권한 설계 (RBAC) + 계정별 이력", owner:"기획+개발", status:"개발필요", note:"발신번호 사용관리 권한 변경 이력 저장 포함" },
];
const BASE_DEV_P1 = [
  { id:"DEV-04", name:"문자발송 API 진입점 국외 IP 차단 미들웨어", owner:"개발", status:"소명예정", note:"Azure/Imperva 설정 캡처 증적 준비" },
  { id:"DEV-05", name:"국외 IP 예외 허용 관리자 승인 기능", owner:"개발", status:"소명예정", note:"예외 정책 자체를 운영 안 하는 방향으로 소명" },
  { id:"DEV-06", name:"VPN·프록시 우회접속 탐지 조치", owner:"개발", status:"소명예정", note:"Imperva/Penta WAF 활용 여부 확인" },
  { id:"DEV-17", name:"인사이동·퇴직 시 권한 즉시 회수 프로세스", owner:"개발", status:"개발필요", note:"학교알리미 교직원 삭제 연동 증빙" },
  { id:"DEV-20", name:"이용자 접속·발송·결제 로그 저장체계", owner:"개발", status:"개발필요", note:"최소 1년 이상 보관 요건(FAQ Q63)" },
  { id:"DEV-21", name:"관리자 접속·개인정보 조회 시스템 로그", owner:"개발", status:"개발필요", note:"현행 확인 후 누락 항목 개발" },
];
const BASE_DEV_P2 = [
  { id:"DEV-11", name:"회원가입 본인확인·1인 1계정 중복 차단", owner:"개발", status:"소명예정", note:"6/22 회신: 중복가입 차단 절차 소명 가능성 확인" },
  { id:"DEV-13", name:"약관 동의 화면·이력 시스템 저장", owner:"기획", status:"증빙필요", note:"동의 이력 저장 여부 개발 확인 필요" },
  { id:"DEV-14", name:"이용료 계정별 귀속·명의 불일치 보류", owner:"개발", status:"소명예정", note:"학교단위 계약 구조로 소명 가능 여부 확인" },
  { id:"DEV-27", name:"세션 내 재인증 기준 정책 및 시스템 반영", owner:"개발+기획", status:"소명예정", note:"대량발송 사유 입력 → 재인증 수단 아닌 사후 추적 근거로 정리" },
  { id:"DEV-28", name:"API·모듈 발송 기업관리자 사후승인 체계", owner:"개발", status:"소명예정", note:"직접 API 발송 아님 소명 가능 여부 확인" },
];
const BASE_EXTERNAL = [
  { id:"EXT-01", name:"문자 진입 본인인증 → 회원가입 대체 소명", target:"심사기관", status:"답변대기", note:"6/18 문의완료 / 중복탐지 절차 소명 필요", risk:false },
  { id:"EXT-02", name:"간편비밀번호 = 다중인증 수단 인정 여부", target:"심사기관", status:"긍정회신", note:"6/22 회신: 인정 가능성 있다고 답변", risk:false },
  { id:"EXT-03", name:"진입 인증 → 문자 발송 추가인증 인정 여부", target:"심사기관", status:"답변대기", note:"6/18 문의완료 / 회신 확인 필요", risk:false },
  { id:"EXT-04", name:"메시지허브 X-ray 차단체계로 자체 증빙 대체 가능 여부", target:"메시지허브", status:"리스크", note:"구축 일정 없음 회신 → P0 금칙어 항목 전체 영향", risk:true },
  { id:"EXT-05", name:"KTOA API 연동 방식·응답규격·Rate Limit 확인", target:"KTOA", status:"미문의", note:"외부 문의 즉시 필요 / Swagger 원문 미확인", risk:true },
];
const BASE_DOCS_CERT = [
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
const BASE_DOCS_REREG = [
  { no:"⑩", name:"납입자본금 1억 이상 확인서류 (등기사항증명서)", due:"9/17", owner:"기획(재무)", status:"증빙필요" },
  { no:"⑪", name:"CISO 지정·공표 확인 (홈페이지 캡처)", due:"9/17", owner:"기획", status:"증빙필요" },
  { no:"⑫", name:"전담직원 채용계약서 (대표 제외 1명 이상)", due:"9/17", owner:"기획(HR)", status:"증빙필요" },
  { no:"⑬", name:"정보보호 기술조치 (취약점 점검 연 1회) 결과", due:"9/18", owner:"기획+개발", status:"증빙필요" },
  { no:"⑭", name:"식별코드 삽입·KISA 연동 확인서 (기존 의무)", due:"9/18", owner:"개발", status:"외부문의" },
  { no:"⑮", name:"X-ray 속이는 문자 식별·차단체계 적용 확인서 (신규)", due:"9/18", owner:"개발", status:"리스크" },
];

// ─── 스타일 맵 ────────────────────────────────────────────
const STATUS_STYLE = {
  "기획필요":"bg-red-100 text-red-700", "개발필요":"bg-red-100 text-red-700",
  "기획전달예정":"bg-amber-100 text-amber-700", "소명예정":"bg-blue-100 text-blue-700",
  "증빙필요":"bg-violet-100 text-violet-700", "완료":"bg-emerald-100 text-emerald-700",
};
const DOC_STATUS_STYLE = {
  "수급예정":"bg-slate-100 text-slate-500", "수정필요":"bg-amber-100 text-amber-700",
  "소명예정":"bg-blue-100 text-blue-700", "증빙필요":"bg-violet-100 text-violet-700",
  "리스크":"bg-red-100 text-red-700", "외부문의":"bg-orange-100 text-orange-700",
  "-":"bg-slate-100 text-slate-400", "완료":"bg-emerald-100 text-emerald-700",
};
const EXT_STATUS_STYLE = {
  "긍정회신":"bg-emerald-100 text-emerald-700", "답변대기":"bg-amber-100 text-amber-700",
  "리스크":"bg-red-100 text-red-700", "미문의":"bg-red-100 text-red-700",
  "완료":"bg-emerald-100 text-emerald-700",
};

// ─── 저장소 ───────────────────────────────────────────────
const LS_KEY = "wbs_state_v3";
function loadState() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } }

// ─── 앱 ──────────────────────────────────────────────────
export default function App() {
  const saved = loadState();

  const [tab, setTab] = useState("dev");
  const [devFilter, setDevFilter] = useState("P0");

  // 상태값 (selectbox)
  const [devStatuses, setDevStatuses] = useState({
    ...Object.fromEntries([...BASE_DEV_P0,...BASE_DEV_P1,...BASE_DEV_P2].map(i=>[i.id,i.status])),
    ...(saved.devStatuses||{})
  });
  const [extStatuses, setExtStatuses] = useState({
    ...Object.fromEntries(BASE_EXTERNAL.map(i=>[i.id,i.status])),
    ...(saved.extStatuses||{})
  });
  const [docCertStatuses, setDocCertStatuses] = useState({
    ...Object.fromEntries(BASE_DOCS_CERT.map((d,i)=>[String(i),d.status])),
    ...(saved.docCertStatuses||{})
  });
  const [docReregStatuses, setDocReregStatuses] = useState({
    ...Object.fromEntries(BASE_DOCS_REREG.map((d,i)=>[String(i),d.status])),
    ...(saved.docReregStatuses||{})
  });

  // 완료 체크
  const [taskDone, setTaskDone] = useState(saved.taskDone||{});
  const [extDone, setExtDone] = useState(saved.extDone||{});
  const [docDone, setDocDone] = useState(saved.docDone||{});

  // 메모 (탭별)
  const [memos, setMemos] = useState({ dev:"", ext:"", docs:"", ...(saved.memos||{}) });

  // 커스텀 항목 (추가된 항목들)
  const [custom, setCustom] = useState({
    devP0:{}, devP1:{}, devP2:{}, ext:{}, docCert:{}, docRereg:{},
    ...(saved.custom||{})
  });

  // 기존 항목 수정 내용
  const [edits, setEdits] = useState({
    devP0:{}, devP1:{}, devP2:{}, ext:{}, docCert:{}, docRereg:{},
    ...(saved.edits||{})
  });

  // UI 상태
  const [memoEdit, setMemoEdit] = useState(false);
  const [memoTemp, setMemoTemp] = useState("");
  const [editingKey, setEditingKey] = useState(null); // "section:key"
  const [editForm, setEditForm] = useState({});
  const [addingTo, setAddingTo] = useState(null);
  const [newItem, setNewItem] = useState({});
  const [fbStatus, setFbStatus] = useState(isConfigured ? "연결 중..." : "로컬저장");

  // Firebase 리스너
  useEffect(() => {
    if (!isConfigured || !db) return;
    const stateRef = ref(db, "wbs");
    const unsub = onValue(stateRef, (snap) => {
      setFbStatus("실시간 연결됨 ✓");
      if (!snap.exists()) return;
      const d = snap.val();
      if (d.devStatuses) setDevStatuses(p=>({...p,...d.devStatuses}));
      if (d.extStatuses) setExtStatuses(p=>({...p,...d.extStatuses}));
      if (d.docCertStatuses) setDocCertStatuses(p=>({...p,...d.docCertStatuses}));
      if (d.docReregStatuses) setDocReregStatuses(p=>({...p,...d.docReregStatuses}));
      if (d.taskDone !== undefined) setTaskDone(d.taskDone||{});
      if (d.extDone !== undefined) setExtDone(d.extDone||{});
      if (d.docDone !== undefined) setDocDone(d.docDone||{});
      if (d.memos) setMemos(p=>({...p,...d.memos}));
      if (d.custom) setCustom(p=>({devP0:{},devP1:{},devP2:{},ext:{},docCert:{},docRereg:{},...p,...d.custom}));
      if (d.edits) setEdits(p=>({devP0:{},devP1:{},devP2:{},ext:{},docCert:{},docRereg:{},...p,...d.edits}));
    }, () => setFbStatus("연결 오류"));
    return () => unsub();
  }, []);

  // 저장 (localStorage + Firebase)
  const persist = (updates) => {
    const full = { devStatuses, extStatuses, docCertStatuses, docReregStatuses, taskDone, extDone, docDone, memos, custom, edits, ...updates };
    localStorage.setItem(LS_KEY, JSON.stringify(full));
    if (isConfigured && db) update(ref(db,"wbs"), updates).catch(console.error);
  };

  // 상태 핸들러
  const updDevStatus   = (id,v) => { const n={...devStatuses,[id]:v};       setDevStatuses(n);       persist({devStatuses:n}); };
  const updExtStatus   = (id,v) => { const n={...extStatuses,[id]:v};       setExtStatuses(n);       persist({extStatuses:n}); };
  const updDocCert     = (i,v)  => { const n={...docCertStatuses,[String(i)]:v};  setDocCertStatuses(n);  persist({docCertStatuses:n}); };
  const updDocRereg    = (i,v)  => { const n={...docReregStatuses,[String(i)]:v}; setDocReregStatuses(n); persist({docReregStatuses:n}); };

  // 완료 핸들러
  const toggleTask = (id) => { const n={...taskDone,[id]:!taskDone[id]}; setTaskDone(n); persist({taskDone:n}); };
  const toggleExt  = (id) => { const n={...extDone,[id]:!extDone[id]};   setExtDone(n);  persist({extDone:n}); };
  const toggleDoc  = (k)  => { const n={...docDone,[k]:!docDone[k]};     setDocDone(n);  persist({docDone:n}); };

  // 메모 핸들러
  const saveMemo = () => {
    const n={...memos,[tab]:memoTemp};
    setMemos(n); setMemoEdit(false); persist({memos:n});
  };

  // 항목 수정
  const startEdit = (sectionKey, itemKey, item) => {
    setEditingKey(`${sectionKey}:${itemKey}`);
    setEditForm({ name:item.name||"", note:item.note||"", owner:item.owner||item.target||"", due:item.due||"" });
  };
  const saveEdit = (sectionKey, itemKey, isCustom) => {
    if (isCustom) {
      const n={...custom,[sectionKey]:{...custom[sectionKey],[itemKey]:{...(custom[sectionKey][itemKey]||{}),...editForm}}};
      setCustom(n); persist({custom:n});
    } else {
      const n={...edits,[sectionKey]:{...edits[sectionKey],[itemKey]:editForm}};
      setEdits(n); persist({edits:n});
    }
    setEditingKey(null);
  };

  // 항목 추가
  const addItem = (section) => {
    if (!newItem.name) return;
    const k = Date.now().toString();
    const isDoc = section.startsWith("doc");
    const item = {
      id: newItem.id||`C-${k.slice(-4)}`,
      name: newItem.name, note: newItem.note||"",
      owner: newItem.owner||"", target: newItem.target||"",
      status: newItem.status||(isDoc?"수급예정":"기획필요"),
      due: newItem.due||"", no: newItem.no||""
    };
    const n={...custom,[section]:{...custom[section],[k]:item}};
    setCustom(n); persist({custom:n});
    setAddingTo(null); setNewItem({});
  };

  // 커스텀 항목 삭제
  const deleteCustom = (section, key) => {
    const {[key]:_,...rest} = custom[section];
    const n={...custom,[section]:rest};
    setCustom(n); persist({custom:n});
  };

  // 병합 헬퍼
  const mergeEdit = (section, key, base) => ({ ...base, ...(edits[section]?.[key]||{}) });

  // 계산
  const totalDev = BASE_DEV_P0.length + BASE_DEV_P1.length + BASE_DEV_P2.length
    + Object.keys(custom.devP0||{}).length + Object.keys(custom.devP1||{}).length + Object.keys(custom.devP2||{}).length;
  const doneCount    = Object.values(taskDone).filter(Boolean).length;
  const extDoneCount = Object.values(extDone).filter(Boolean).length;
  const totalExt     = BASE_EXTERNAL.length + Object.keys(custom.ext||{}).length;
  const docDoneCount = Object.values(docDone).filter(Boolean).length;
  const totalDocs    = BASE_DOCS_CERT.length + BASE_DOCS_REREG.length
    + Object.keys(custom.docCert||{}).length + Object.keys(custom.docRereg||{}).length;

  const devSection    = devFilter==="P0"?"devP0":devFilter==="P1"?"devP1":"devP2";
  const devBaseItems  = devFilter==="P0"?BASE_DEV_P0:devFilter==="P1"?BASE_DEV_P1:BASE_DEV_P2;
  const devCustomList = Object.entries(custom[devSection]||{});

  // ── 공통 컴포넌트 함수 ────────────────────────────────────

  const StatusSelect = ({value, options, styleMap, onChange}) => (
    <select
      value={value||""}
      onChange={e=>{e.stopPropagation();onChange(e.target.value);}}
      onClick={e=>e.stopPropagation()}
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer border-0 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-slate-400 ${styleMap[value]||"bg-slate-100 text-slate-500"}`}
    >
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );

  const EditInline = ({onSave, onCancel, showOwner=true, showDue=false, showTarget=false}) => (
    <div className="flex-1 space-y-1.5 py-0.5">
      <input value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))}
        placeholder="항목명" className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
      <input value={editForm.note} onChange={e=>setEditForm(p=>({...p,note:e.target.value}))}
        placeholder="비고" className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
      {(showOwner||showTarget) && (
        <input value={editForm.owner} onChange={e=>setEditForm(p=>({...p,owner:e.target.value}))}
          placeholder={showTarget?"확인 대상":"담당자"} className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
      )}
      {showDue && (
        <input value={editForm.due} onChange={e=>setEditForm(p=>({...p,due:e.target.value}))}
          placeholder="마감일 (예: 7/14)" className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400" />
      )}
      <div className="flex gap-1.5 pt-0.5">
        <button onClick={onSave} className="text-xs bg-slate-900 text-white px-3 py-1 rounded">저장</button>
        <button onClick={onCancel} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">취소</button>
      </div>
    </div>
  );

  const AddForm = ({section, options, showOwner=true, showDue=false, showTarget=false}) => (
    addingTo === section ? (
      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={newItem.id||""} onChange={e=>setNewItem(p=>({...p,id:e.target.value}))}
            placeholder="ID (예: DEV-30)" className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none" />
          <input value={newItem.name||""} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))}
            placeholder="항목명 *" className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none" />
          {showOwner && <input value={newItem.owner||""} onChange={e=>setNewItem(p=>({...p,owner:e.target.value}))}
            placeholder="담당자" className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none" />}
          {showTarget && <input value={newItem.target||""} onChange={e=>setNewItem(p=>({...p,target:e.target.value}))}
            placeholder="확인 대상" className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none" />}
          {showDue && <input value={newItem.due||""} onChange={e=>setNewItem(p=>({...p,due:e.target.value}))}
            placeholder="마감 (예: 7/14)" className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none" />}
          <input value={newItem.note||""} onChange={e=>setNewItem(p=>({...p,note:e.target.value}))}
            placeholder="비고" className="text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none col-span-2" />
        </div>
        <div className="flex gap-2 items-center">
          <select value={newItem.status||(section.startsWith("doc")?"수급예정":"기획필요")}
            onChange={e=>setNewItem(p=>({...p,status:e.target.value}))}
            className="text-xs border border-slate-300 rounded px-2 py-1">
            {options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          <button onClick={()=>addItem(section)} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded">추가</button>
          <button onClick={()=>{setAddingTo(null);setNewItem({});}} className="text-xs bg-slate-100 text-slate-600 px-2 py-1.5 rounded">취소</button>
        </div>
      </div>
    ) : (
      <button onClick={()=>setAddingTo(section)}
        className="mt-3 w-full text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg py-2.5 hover:bg-slate-50 hover:text-slate-600 transition-colors">
        + 항목 추가
      </button>
    )
  );

  // ── 렌더 ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50" style={{fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif"}}>

      {/* 헤더 */}
      <header className="bg-slate-900 text-white px-4 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-slate-400 text-[11px] tracking-widest uppercase mb-1">HiClass · 규제대응 · 2026</p>
              <h1 className="text-lg font-bold">📡 전송자격인증 & 특부가 재등록</h1>
              <p className="text-slate-400 text-xs mt-0.5">전기통신사업법 제22조의11 · 법정기한 2026.10.27</p>
              <p className={`text-[10px] mt-1 ${isConfigured ? "text-emerald-400" : "text-slate-500"}`}>
                💾 {fbStatus}
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { label:"전송자격 신청", date:"7/30",  days:28,  color:"text-amber-400" },
                { label:"특부가 재등록", date:"9/19",  days:79,  color:"text-orange-400" },
                { label:"법정 데드라인", date:"10/27", days:117, color:"text-red-400" },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <div className={`text-2xl font-black ${m.color}`}>D-{m.days}</div>
                  <div className="text-slate-400 text-[10px]">{m.label}</div>
                  <div className="text-slate-500 text-[10px]">{m.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 진행률 */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { label:"개발항목 완료", done:doneCount,    total:totalDev,  color:"bg-blue-400" },
              { label:"외부확인 완료", done:extDoneCount, total:totalExt,  color:"bg-violet-400" },
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

          <div className="mt-3 flex items-center gap-2">
            <a href="https://docs.google.com/spreadsheets/d/1alwzM9aqT8uUr7EIkLfIb07sEsVJb-F8hqKVrUEwT5I/edit"
              target="_blank" rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-white underline flex items-center gap-1">
              📊 전송자격인증_특부가재등록_WBS (Google Sheets)
            </a>
            <span className="text-slate-600 text-[10px]">← WBS 전체 관리는 기존 스프레드시트 유지</span>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex">
          {[
            { id:"dev",  label:"🔴 개발 우선순위" },
            { id:"ext",  label:"📞 외부 확인 현황" },
            { id:"docs", label:"📁 서류 준비 현황" },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMemoEdit(false); }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab===t.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-5">

        {/* ── 탭별 메모 ── */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center gap-3">
          <span className="text-blue-400 text-sm shrink-0">📝</span>
          {memoEdit ? (
            <>
              <input autoFocus value={memoTemp}
                onChange={e=>setMemoTemp(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&saveMemo()}
                placeholder="공유사항을 입력하세요 (최대 150자)"
                maxLength={150}
                className="flex-1 text-sm bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 text-slate-700 placeholder-blue-300"
              />
              <button onClick={saveMemo} className="text-xs bg-blue-600 text-white px-3 py-1 rounded shrink-0">저장</button>
              <button onClick={()=>setMemoEdit(false)} className="text-xs text-blue-400 shrink-0">취소</button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-slate-700">
                {memos[tab] || <span className="text-blue-300 italic">공유사항을 작성해주세요</span>}
              </span>
              <button onClick={()=>{setMemoTemp(memos[tab]);setMemoEdit(true);}}
                className="text-xs text-blue-500 border border-blue-200 px-2.5 py-1 rounded hover:bg-blue-100 shrink-0">
                ✏️ 작성
              </button>
            </>
          )}
        </div>

        {/* ── 개발 우선순위 탭 ── */}
        {tab === "dev" && (
          <div>
            {/* P0/P1/P2 필터 */}
            <div className="flex gap-2 mb-4">
              {[
                { key:"P0", label:`P0 필수 (${BASE_DEV_P0.length + Object.keys(custom.devP0||{}).length})`, color:"bg-red-100 text-red-700 border-red-200" },
                { key:"P1", label:`P1 중요 (${BASE_DEV_P1.length + Object.keys(custom.devP1||{}).length})`, color:"bg-amber-100 text-amber-700 border-amber-200" },
                { key:"P2", label:`P2 보완 (${BASE_DEV_P2.length + Object.keys(custom.devP2||{}).length})`, color:"bg-blue-100 text-blue-700 border-blue-200" },
              ].map(f => (
                <button key={f.key} onClick={()=>setDevFilter(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${f.color} ${devFilter===f.key?"ring-2 ring-offset-1 ring-current":"opacity-60"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className={`mb-3 text-xs font-bold px-3 py-1 rounded inline-block ${
              devFilter==="P0"?"bg-red-600 text-white":devFilter==="P1"?"bg-amber-500 text-white":"bg-blue-600 text-white"
            }`}>
              {devFilter==="P0"?"🚨 신청일(7/30) 전 완료 필수":devFilter==="P1"?"⚡ 신청 후 심사 기간 내 대응 가능":"📋 소명·보완 항목"}
            </div>

            <div className="space-y-2">
              {/* 헤더 */}
              <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/>
                <span className="w-16 shrink-0">DEV#</span>
                <span className="flex-1">개발 항목</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">담당</span>
                <span className="w-24 shrink-0 text-right">현행 상태</span>
                <span className="w-10 shrink-0"/>
              </div>

              {/* 기본 항목 */}
              {devBaseItems.map(baseItem => {
                const item = mergeEdit(devSection, baseItem.id, baseItem);
                const done = taskDone[baseItem.id]||false;
                const status = devStatuses[baseItem.id]||baseItem.status;
                const eKey = `${devSection}:${baseItem.id}`;
                const isEditing = editingKey === eKey;
                return (
                  <div key={baseItem.id} className={`flex items-start gap-3 px-4 py-3 bg-white border rounded-lg transition-all ${
                    done?"opacity-50 border-slate-200":baseItem.risk?"border-red-200":"border-slate-200"
                  }`}>
                    <div className="cursor-pointer shrink-0 mt-0.5" onClick={()=>toggleTask(baseItem.id)}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                        {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 w-16 shrink-0 pt-0.5">{baseItem.id}</span>
                    {isEditing ? (
                      <EditInline showOwner={true}
                        onSave={()=>saveEdit(devSection,baseItem.id,false)}
                        onCancel={()=>setEditingKey(null)} />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${done?"line-through text-slate-400":"text-slate-800"}`}>
                          {item.name}
                          {baseItem.risk&&<span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">⚠ 리스크</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                      </div>
                    )}
                    {!isEditing&&<>
                      <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner}</span>
                      <div className="w-24 shrink-0 flex justify-end">
                        <StatusSelect value={status} options={DEV_STATUS_OPTIONS} styleMap={STATUS_STYLE} onChange={v=>updDevStatus(baseItem.id,v)} />
                      </div>
                      <div className="w-10 shrink-0 flex justify-end gap-1">
                        <button onClick={e=>{e.stopPropagation();startEdit(devSection,baseItem.id,baseItem);}}
                          className="text-slate-300 hover:text-blue-400 text-xs" title="수정">✏️</button>
                      </div>
                    </>}
                  </div>
                );
              })}

              {/* 커스텀 항목 */}
              {devCustomList.map(([k,baseItem]) => {
                const item = mergeEdit(devSection, k, baseItem);
                const done = taskDone[baseItem.id]||false;
                const status = devStatuses[baseItem.id]||baseItem.status||"기획필요";
                const eKey = `${devSection}:${k}`;
                const isEditing = editingKey === eKey;
                return (
                  <div key={k} className={`flex items-start gap-3 px-4 py-3 bg-white border border-dashed rounded-lg transition-all ${done?"opacity-50 border-slate-200":"border-slate-300"}`}>
                    <div className="cursor-pointer shrink-0 mt-0.5" onClick={()=>toggleTask(baseItem.id)}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                        {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 w-16 shrink-0 pt-0.5">{item.id}</span>
                    {isEditing ? (
                      <EditInline showOwner={true}
                        onSave={()=>saveEdit(devSection,k,true)}
                        onCancel={()=>setEditingKey(null)} />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${done?"line-through text-slate-400":"text-slate-800"}`}>{item.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                      </div>
                    )}
                    {!isEditing&&<>
                      <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner}</span>
                      <div className="w-24 shrink-0 flex justify-end">
                        <StatusSelect value={status} options={DEV_STATUS_OPTIONS} styleMap={STATUS_STYLE} onChange={v=>updDevStatus(baseItem.id,v)} />
                      </div>
                      <div className="w-10 shrink-0 flex justify-end gap-1">
                        <button onClick={e=>{e.stopPropagation();startEdit(devSection,k,baseItem);}} className="text-slate-300 hover:text-blue-400 text-xs">✏️</button>
                        <button onClick={e=>{e.stopPropagation();deleteCustom(devSection,k);}} className="text-slate-300 hover:text-red-400 text-xs">🗑️</button>
                      </div>
                    </>}
                  </div>
                );
              })}
            </div>
            <AddForm section={devSection} options={DEV_STATUS_OPTIONS} showOwner={true} />
          </div>
        )}

        {/* ── 외부 확인 현황 탭 ── */}
        {tab === "ext" && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              <strong>이번 주 액션:</strong> KTOA API 스웨거 원문 확인 후 snb.ktoa.or.kr 문의 진행 (DEV-24 P0)
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/>
                <span className="w-14 shrink-0">DEV#</span>
                <span className="flex-1">확인 항목</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">확인 대상</span>
                <span className="w-24 shrink-0 text-right">상태</span>
                <span className="w-10 shrink-0"/>
              </div>
              <div className="divide-y divide-slate-100">
                {BASE_EXTERNAL.map(baseItem => {
                  const item = mergeEdit("ext", baseItem.id, baseItem);
                  const done = extDone[baseItem.id]||false;
                  const status = extStatuses[baseItem.id]||baseItem.status;
                  const eKey = `ext:${baseItem.id}`;
                  const isEditing = editingKey === eKey;
                  return (
                    <div key={baseItem.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${done?"opacity-50 bg-slate-50":""}`}>
                      <div className="cursor-pointer shrink-0 mt-0.5" onClick={()=>toggleExt(baseItem.id)}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                          {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 w-14 shrink-0 pt-0.5">{baseItem.id}</span>
                      {isEditing ? (
                        <EditInline showTarget={true}
                          onSave={()=>saveEdit("ext",baseItem.id,false)}
                          onCancel={()=>setEditingKey(null)} />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${done?"line-through text-slate-400":"text-slate-800"}`}>
                            {item.name}
                            {baseItem.risk&&<span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">⚠</span>}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                        </div>
                      )}
                      {!isEditing&&<>
                        <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner||baseItem.target}</span>
                        <div className="w-24 shrink-0 flex justify-end">
                          <StatusSelect value={status} options={EXT_STATUS_OPTIONS} styleMap={EXT_STATUS_STYLE} onChange={v=>updExtStatus(baseItem.id,v)} />
                        </div>
                        <div className="w-10 shrink-0 flex justify-end">
                          <button onClick={e=>{e.stopPropagation();startEdit("ext",baseItem.id,baseItem);}} className="text-slate-300 hover:text-blue-400 text-xs">✏️</button>
                        </div>
                      </>}
                    </div>
                  );
                })}
                {Object.entries(custom.ext||{}).map(([k,baseItem]) => {
                  const item = mergeEdit("ext", k, baseItem);
                  const done = extDone[baseItem.id]||false;
                  const status = extStatuses[baseItem.id]||baseItem.status||"미문의";
                  const eKey = `ext:${k}`;
                  const isEditing = editingKey === eKey;
                  return (
                    <div key={k} className={`flex items-start gap-3 px-4 py-3 bg-slate-50/50 transition-colors ${done?"opacity-50":""}`}>
                      <div className="cursor-pointer shrink-0 mt-0.5" onClick={()=>toggleExt(baseItem.id)}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                          {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 w-14 shrink-0 pt-0.5">{item.id}</span>
                      {isEditing ? (
                        <EditInline showTarget={true}
                          onSave={()=>saveEdit("ext",k,true)}
                          onCancel={()=>setEditingKey(null)} />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${done?"line-through text-slate-400":"text-slate-800"}`}>{item.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                        </div>
                      )}
                      {!isEditing&&<>
                        <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner||item.target}</span>
                        <div className="w-24 shrink-0 flex justify-end">
                          <StatusSelect value={status} options={EXT_STATUS_OPTIONS} styleMap={EXT_STATUS_STYLE} onChange={v=>updExtStatus(baseItem.id,v)} />
                        </div>
                        <div className="w-10 shrink-0 flex justify-end gap-1">
                          <button onClick={e=>{e.stopPropagation();startEdit("ext",k,baseItem);}} className="text-slate-300 hover:text-blue-400 text-xs">✏️</button>
                          <button onClick={e=>{e.stopPropagation();deleteCustom("ext",k);}} className="text-slate-300 hover:text-red-400 text-xs">🗑️</button>
                        </div>
                      </>}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-3 pt-1">
                <AddForm section="ext" options={EXT_STATUS_OPTIONS} showTarget={true} />
              </div>
            </div>

            {/* 연락처 */}
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-4">
              <h3 className="text-xs font-semibold text-slate-600 mb-3">📌 주요 연락처</h3>
              <div className="space-y-2">
                {[
                  { label:"전송자격인증 신청·접수", contact:"antispam@korea.kr",  note:"방송미디어통신위원회" },
                  { label:"인증심사 기술지원",       contact:"srt@kisa.or.kr",    note:"KISA" },
                  { label:"식별코드 삽입·위변조",    contact:"numbers@kisa.or.kr", note:"KISA" },
                  { label:"X-ray 악성문자 차단",     contact:"x-ray@kisa.or.kr",  note:"KISA" },
                  { label:"KTOA 이용증명원",         contact:"snb.ktoa.or.kr",    note:"한국통신사업자연합회" },
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

        {/* ── 서류 준비 현황 탭 ── */}
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
                  {BASE_DOCS_CERT.filter((_,i)=>docDone["c"+i]).length + Object.keys(custom.docCert||{}).filter(k=>docDone["cc"+k]).length}
                  /{BASE_DOCS_CERT.length + Object.keys(custom.docCert||{}).length} 완료
                </span>
              </div>
              <div className="flex gap-3 px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/><span className="w-5 shrink-0">#</span>
                <span className="flex-1">서류명</span>
                <span className="w-14 shrink-0 text-right hidden md:block">마감</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">담당</span>
                <span className="w-24 shrink-0 text-right">상태</span>
                <span className="w-6 shrink-0"/>
              </div>
              <div className="divide-y divide-slate-100">
                {BASE_DOCS_CERT.map((baseItem,i) => {
                  const item = mergeEdit("docCert", String(i), baseItem);
                  const dKey = "c"+i;
                  const done = docDone[dKey]||false;
                  const status = docCertStatuses[String(i)]||baseItem.status;
                  const eKey = `docCert:${i}`;
                  const isEditing = editingKey === eKey;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${done?"opacity-50 bg-slate-50":""}`}>
                      <div className="cursor-pointer" onClick={()=>toggleDoc(dKey)}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                          {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-5 shrink-0">{baseItem.no}</span>
                      {isEditing ? (
                        <div className="flex-1">
                          <EditInline showOwner={true} showDue={true}
                            onSave={()=>saveEdit("docCert",String(i),false)}
                            onCancel={()=>setEditingKey(null)} />
                        </div>
                      ) : (
                        <span className={`flex-1 text-sm ${done?"line-through text-slate-400":"text-slate-700"}`}>{item.name}</span>
                      )}
                      {!isEditing&&<>
                        <span className="text-xs text-slate-400 w-14 shrink-0 text-right hidden md:block">{item.due||baseItem.due}</span>
                        <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner||baseItem.owner}</span>
                        <div className="w-24 shrink-0 flex justify-end">
                          <StatusSelect value={status} options={DOC_STATUS_OPTIONS} styleMap={DOC_STATUS_STYLE} onChange={v=>updDocCert(i,v)} />
                        </div>
                        <div className="w-6 shrink-0 flex justify-end">
                          <button onClick={e=>{e.stopPropagation();startEdit("docCert",String(i),{...baseItem,...item});}} className="text-slate-300 hover:text-blue-400 text-xs">✏️</button>
                        </div>
                      </>}
                    </div>
                  );
                })}
                {Object.entries(custom.docCert||{}).map(([k,baseItem]) => {
                  const item = mergeEdit("docCert", k, baseItem);
                  const dKey = "cc"+k;
                  const done = docDone[dKey]||false;
                  const status = docCertStatuses[k]||baseItem.status||"수급예정";
                  const eKey = `docCert:${k}`;
                  const isEditing = editingKey === eKey;
                  return (
                    <div key={k} className={`flex items-center gap-3 px-4 py-2.5 bg-slate-50/50 transition-colors ${done?"opacity-50":""}`}>
                      <div className="cursor-pointer" onClick={()=>toggleDoc(dKey)}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                          {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-5 shrink-0">{item.no||"＋"}</span>
                      {isEditing ? (
                        <div className="flex-1">
                          <EditInline showOwner={true} showDue={true}
                            onSave={()=>saveEdit("docCert",k,true)}
                            onCancel={()=>setEditingKey(null)} />
                        </div>
                      ) : (
                        <span className={`flex-1 text-sm ${done?"line-through text-slate-400":"text-slate-700"}`}>{item.name}</span>
                      )}
                      {!isEditing&&<>
                        <span className="text-xs text-slate-400 w-14 shrink-0 text-right hidden md:block">{item.due}</span>
                        <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner}</span>
                        <div className="w-24 shrink-0 flex justify-end">
                          <StatusSelect value={status} options={DOC_STATUS_OPTIONS} styleMap={DOC_STATUS_STYLE} onChange={v=>{const n={...docCertStatuses,[k]:v};setDocCertStatuses(n);persist({docCertStatuses:n});}} />
                        </div>
                        <div className="w-6 shrink-0 flex justify-end gap-1">
                          <button onClick={e=>{e.stopPropagation();startEdit("docCert",k,baseItem);}} className="text-slate-300 hover:text-blue-400 text-xs">✏️</button>
                          <button onClick={e=>{e.stopPropagation();deleteCustom("docCert",k);}} className="text-slate-300 hover:text-red-400 text-xs">🗑️</button>
                        </div>
                      </>}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-3 pt-1">
                <AddForm section="docCert" options={DOC_STATUS_OPTIONS} showOwner={true} showDue={true} />
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
                  {BASE_DOCS_REREG.filter((_,i)=>docDone["r"+i]).length + Object.keys(custom.docRereg||{}).filter(k=>docDone["cr"+k]).length}
                  /{BASE_DOCS_REREG.length + Object.keys(custom.docRereg||{}).length} 완료
                </span>
              </div>
              <div className="flex gap-3 px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400">
                <span className="w-5 shrink-0"/><span className="w-5 shrink-0">#</span>
                <span className="flex-1">서류명</span>
                <span className="w-14 shrink-0 text-right hidden md:block">마감</span>
                <span className="w-20 shrink-0 text-right hidden sm:block">담당</span>
                <span className="w-24 shrink-0 text-right">상태</span>
                <span className="w-6 shrink-0"/>
              </div>
              <div className="divide-y divide-slate-100">
                {BASE_DOCS_REREG.map((baseItem,i) => {
                  const item = mergeEdit("docRereg", String(i), baseItem);
                  const dKey = "r"+i;
                  const done = docDone[dKey]||false;
                  const status = docReregStatuses[String(i)]||baseItem.status;
                  const eKey = `docRereg:${i}`;
                  const isEditing = editingKey === eKey;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${done?"opacity-50 bg-slate-50":""}`}>
                      <div className="cursor-pointer" onClick={()=>toggleDoc(dKey)}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                          {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-5 shrink-0">{baseItem.no}</span>
                      {isEditing ? (
                        <div className="flex-1">
                          <EditInline showOwner={true} showDue={true}
                            onSave={()=>saveEdit("docRereg",String(i),false)}
                            onCancel={()=>setEditingKey(null)} />
                        </div>
                      ) : (
                        <span className={`flex-1 text-sm ${done?"line-through text-slate-400":baseItem.status==="리스크"?"text-red-700 font-medium":"text-slate-700"}`}>{item.name}</span>
                      )}
                      {!isEditing&&<>
                        <span className="text-xs text-slate-400 w-14 shrink-0 text-right hidden md:block">{item.due||baseItem.due}</span>
                        <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner||baseItem.owner}</span>
                        <div className="w-24 shrink-0 flex justify-end">
                          <StatusSelect value={status} options={DOC_STATUS_OPTIONS} styleMap={DOC_STATUS_STYLE} onChange={v=>updDocRereg(i,v)} />
                        </div>
                        <div className="w-6 shrink-0 flex justify-end">
                          <button onClick={e=>{e.stopPropagation();startEdit("docRereg",String(i),{...baseItem,...item});}} className="text-slate-300 hover:text-blue-400 text-xs">✏️</button>
                        </div>
                      </>}
                    </div>
                  );
                })}
                {Object.entries(custom.docRereg||{}).map(([k,baseItem]) => {
                  const item = mergeEdit("docRereg", k, baseItem);
                  const dKey = "cr"+k;
                  const done = docDone[dKey]||false;
                  const status = docReregStatuses[k]||baseItem.status||"수급예정";
                  const eKey = `docRereg:${k}`;
                  const isEditing = editingKey === eKey;
                  return (
                    <div key={k} className={`flex items-center gap-3 px-4 py-2.5 bg-slate-50/50 transition-colors ${done?"opacity-50":""}`}>
                      <div className="cursor-pointer" onClick={()=>toggleDoc(dKey)}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${done?"bg-emerald-500 border-emerald-500":"border-slate-300"}`}>
                          {done&&<span className="text-white text-[9px] font-bold">✓</span>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-5 shrink-0">{item.no||"＋"}</span>
                      {isEditing ? (
                        <div className="flex-1">
                          <EditInline showOwner={true} showDue={true}
                            onSave={()=>saveEdit("docRereg",k,true)}
                            onCancel={()=>setEditingKey(null)} />
                        </div>
                      ) : (
                        <span className={`flex-1 text-sm ${done?"line-through text-slate-400":"text-slate-700"}`}>{item.name}</span>
                      )}
                      {!isEditing&&<>
                        <span className="text-xs text-slate-400 w-14 shrink-0 text-right hidden md:block">{item.due}</span>
                        <span className="text-xs text-slate-400 w-20 shrink-0 text-right hidden sm:block">{item.owner}</span>
                        <div className="w-24 shrink-0 flex justify-end">
                          <StatusSelect value={status} options={DOC_STATUS_OPTIONS} styleMap={DOC_STATUS_STYLE} onChange={v=>{const n={...docReregStatuses,[k]:v};setDocReregStatuses(n);persist({docReregStatuses:n});}} />
                        </div>
                        <div className="w-6 shrink-0 flex justify-end gap-1">
                          <button onClick={e=>{e.stopPropagation();startEdit("docRereg",k,baseItem);}} className="text-slate-300 hover:text-blue-400 text-xs">✏️</button>
                          <button onClick={e=>{e.stopPropagation();deleteCustom("docRereg",k);}} className="text-slate-300 hover:text-red-400 text-xs">🗑️</button>
                        </div>
                      </>}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-3 pt-1">
                <AddForm section="docRereg" options={DOC_STATUS_OPTIONS} showOwner={true} showDue={true} />
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
