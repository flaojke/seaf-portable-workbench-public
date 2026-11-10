/** Publication checks for captured reports, not normative model examples or tests. */
export const SOURCE_REPORT_POLICY_VERSION='seaf-report-content-v2';
export const MAX_CAPTURED_REPORT_BYTES=16*1024;

export function isCapturedReport(file){
 return typeof file==='string' && /\.(?:json|tap)$/i.test(file) && (
  /^openspec\/changes\//.test(file)
  || /^docs\/performance\//.test(file)
  || /^benchmarks\//.test(file) && /(?:evidence|samples|results|summary)[^/]*\.(?:json|tap)$/.test(file)
 );
}

const rawKeys=new Set(['prompt','prompts','question','questions','answer','answers','facts','inferences','messages','context','contexttext','sourcecontent','filecontent','rawrequest','rawresponse','controltoken','accesstoken','authorization','model','components','contexts','entities','operations','entity','host','hardware','environment','runtimeidentity','rawmeasurements','samples','mapped','inventory']);
const localPath=/(?:^|[\s"'(=])(?:[A-Za-z]:[\\/]|\/(?:Users|home)\/[^/\s]+\/)/;
const metricKey=/(?:counts?|total|systems|components|contexts|integrations|entities|documents|docs|links|files|bytes|characters|sha256|hash|milliseconds|durationMs)$/i;
function metricsOnly(value){
 if(typeof value==='number'||typeof value==='boolean'||value===null)return true;
 if(typeof value==='string')return /^[a-f0-9]{40,64}$/i.test(value);
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 return Object.entries(value).every(([key,item])=>metricKey.test(key)&&metricsOnly(item));
}

export function reportContentFindings(file,body){
 if(!isCapturedReport(file))return [];
 const counts=new Map();
 const add=category=>counts.set(category,(counts.get(category)||0)+1);
 if(Buffer.byteLength(body,'utf8')>MAX_CAPTURED_REPORT_BYTES)return [{category:'oversized-captured-report',matches:1,contentRedacted:true}];
 if(/\.tap$/i.test(file)){
  if(localPath.test(body))add('machine-local-path');
 }else{
  let root;try{root=JSON.parse(body);}catch{add('malformed-captured-report');return [...counts].map(([category,matches])=>({category,matches,contentRedacted:true}));}
  let visited=0;
  function visit(value,depth=0,decoded=0){
   if(++visited>200000||depth>80){add('captured-report-depth-limit');return;}
   if(typeof value==='string'){
    if(localPath.test(value))add('machine-local-path');
    if(decoded<4&&/^[\s]*[\[{]/.test(value)){
     try{visit(JSON.parse(value),depth+1,decoded+1);}catch{/* Ordinary prose is not JSON. */}
    }
    return;
   }
   if(Array.isArray(value)){for(const child of value)visit(child,depth+1,decoded);return;}
   if(!value||typeof value!=='object')return;
   for(const [key,child]of Object.entries(value)){
    if(rawKeys.has(key.toLowerCase().replace(/[-_]/g,''))&&!metricsOnly(child))add('raw-captured-payload');
    visit(child,depth+1,decoded);
   }
  }
  visit(root);
 }
 return [...counts].map(([category,matches])=>({category,matches,contentRedacted:true}));
}
