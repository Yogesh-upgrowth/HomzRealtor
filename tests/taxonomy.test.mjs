// Guards the builder/sector extraction fixes (audit items 8 and 9).
const STOP=new Set(["the","a","an","new","old","good","best","golden","royal","luxury","premium","green","sector","plot","plots","flat","flats","apartment","apartments","villa","villas","house","home","homes","floor","floors","builder","independent","residential","commercial","affordable","huda","rwa","society","project","property","land","shop","office","sale","rent","my","your","our","prime","grand","elite"]);
const ALIASES={signature:"Signature Global","signature global":"Signature Global",uppal:"Uppal",uppals:"Uppal",gpl:"Godrej Properties",godrej:"Godrej Properties","godrej properties":"Godrej Properties",dwarkadhis:"Dwarkadhis",dwarkadhish:"Dwarkadhis"};
const KNOWN=["Signature Global","M3M","DLF","Godrej","Emaar"];
const canon=n=>ALIASES[n.trim().toLowerCase()]??n.trim();
function extractBuilder(t){
  t=(t||"").trim(); if(!t) return "Unknown";
  for(const b of KNOWN) if(t.toLowerCase().startsWith(b.toLowerCase())) return canon(b);
  const w=t.split(/\s+/).filter(Boolean);
  const pair=w.slice(0,2).join(" ").toLowerCase();
  if(ALIASES[pair]) return ALIASES[pair];
  const f=w[0]||""; const l=f.toLowerCase().replace(/[^a-z]/g,"");
  if(l.length<3||STOP.has(l)||/^\d+$/.test(f)) return "Unknown";
  return canon(f);
}
const MAX=115;
const OTHER=/\b(sohna(?!\s+road)|manesar|bhiwadi|dharuhera|pataudi|farukh?nagar|noida|faridabad|delhi)\b/i;
function extractSector(blob){
  const m=String(blob||"").match(/\bSector\s*-?\s*([0-9]{1,3}[A-Za-z]?)\b/i);
  if(!m) return null;
  const raw=m[1].toUpperCase(); const n=parseInt(raw,10);
  if(!Number.isFinite(n)||n<1||n>MAX) return null;
  const around=String(blob).slice(Math.max(0,m.index-40),m.index+m[0].length+40);
  if(OTHER.test(around)) return null;
  return `Sector ${raw}`;
}
let fail=0;
const t=(l,a,b)=>{const ok=String(a)===String(b);if(!ok)fail++;console.log((ok?"PASS":"FAIL").padEnd(5)+l+"  => "+JSON.stringify(a));};
// builders: junk hubs the audit named
for(const junk of ["The Palm Springs","Old DLF Colony flats","Good Earth City","Golden Park Villas","Royal Residency","HUDA Plots Sector 9","RWA Colony"])
  t(`junk "${junk.split(" ")[0]}" -> Unknown`, extractBuilder(junk), "Unknown");
t("known builder prefix", extractBuilder("M3M Latitude Sector 65"), "M3M");
t("Signature -> Signature Global", extractBuilder("Signature Infinity"), "Signature Global");
t("Uppals -> Uppal", extractBuilder("Uppals Plaza"), "Uppal");
t("GPL -> Godrej Properties", extractBuilder("GPL Aria"), "Godrej Properties");
t("Dwarkadhish -> Dwarkadhis", extractBuilder("Dwarkadhish Heights"), "Dwarkadhis");
t("real unknown builder kept", extractBuilder("Krisumi Waterfall Residences"), "Krisumi");
// sectors
t("Gurgaon sector kept", extractSector("M3M Latitude, Sector 65, Gurgaon"), "Sector 65");
t("Sohna Road sector kept", extractSector("Tower A, Sector 48, Sohna Road, Gurgaon"), "Sector 48");
t("Sohna town sector rejected", extractSector("LID Plaza, Sector 6, Sohna"), null);
t("Noida sector 150 rejected", extractSector("Project at Sector 150 Noida"), null);
t("out-of-range 150 rejected", extractSector("Sector 150"), null);
t("letter suffix kept", extractSector("Sector 82A Gurgaon"), "Sector 82A");
t("distant Noida mention ok", extractSector("Sector 65 Gurgaon. Connectivity: 45 min drive to Noida via the expressway network"), "Sector 65");
console.log(fail===0?"\nALL PASS":`\n${fail} FAILED`);
process.exit(fail?1:0);
