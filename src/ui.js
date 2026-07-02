export function html() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Blocked in China Check</title>
<style>
:root{color-scheme:light;--bg:#f7f7f5;--panel:#fff;--ink:#191817;--muted:#6d6a64;--line:#dedbd3;--strong:#10100f;--accent:#0f766e;--accent-ink:#fff;--warning:#b45309;--danger:#b91c1c;--ok:#047857;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:var(--bg);color:var(--ink)}main{width:min(960px,calc(100% - 32px));margin:0 auto;padding:48px 0}.shell{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;align-items:start}h1{margin:0 0 10px;font-size:clamp(2rem,6vw,4.75rem);line-height:.95;letter-spacing:0;max-width:760px}.lead{max-width:660px;color:var(--muted);font-size:1.05rem;line-height:1.65;margin:0 0 28px}.panel,.result{background:var(--panel);border:1px solid var(--line);border-radius:8px;box-shadow:0 18px 45px rgba(29,28,26,.06)}.panel{padding:18px}label{display:block;color:var(--strong);font-size:.9rem;font-weight:650;margin-bottom:8px}.row{display:flex;gap:10px}input{width:100%;min-height:44px;border-radius:6px;border:1px solid var(--line);padding:0 12px;font:inherit;color:var(--ink);background:#fff;outline:none}input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(15,118,110,.15)}button{min-height:44px;border:0;border-radius:6px;padding:0 16px;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:700;white-space:nowrap;cursor:pointer}button:disabled{cursor:wait;opacity:.72}.result{min-height:220px;padding:18px}.status{display:inline-flex;align-items:center;min-height:30px;border-radius:999px;padding:0 10px;font-size:.82rem;font-weight:750;background:#ece9e1;color:var(--muted)}.status.ok{background:#dff3ea;color:var(--ok)}.status.blocked{background:#fde8e8;color:var(--danger)}.status.unknown{background:#fff4d6;color:var(--warning)}.result h2{margin:18px 0 8px;font-size:1.35rem;letter-spacing:0}.result p{color:var(--muted);line-height:1.6;margin:0}dl{display:grid;grid-template-columns:96px 1fr;gap:10px 12px;margin:18px 0 0;font-size:.92rem}dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}.samples{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.sample{min-height:32px;padding:0 10px;color:var(--ink);background:#f1eee7;border:1px solid var(--line);font-size:.88rem}@media (max-width:780px){main{padding:28px 0}.shell{grid-template-columns:1fr}.row{flex-direction:column}button{width:100%}}
</style>
</head>
<body>
<main>
<h1>Blocked in China Check</h1>
<p class="lead">Enter a domain and get a quick signal from a Tencent Cloud endpoint in Guangzhou.</p>
<div class="shell">
<section class="panel" aria-label="Domain check">
<form id="check-form"><label for="domain">Domain</label><div class="row"><input id="domain" name="domain" placeholder="example.com" autocomplete="url" inputmode="url" required /><button id="submit" type="submit">Show result</button></div></form>
<div class="samples" aria-label="Examples"><button class="sample" type="button" data-domain="baidu.com">baidu.com</button><button class="sample" type="button" data-domain="github.com">github.com</button><button class="sample" type="button" data-domain="wikipedia.org">wikipedia.org</button></div>
</section>
<aside class="result" aria-live="polite"><span id="pill" class="status">Waiting for a domain</span><h2 id="title">Result will appear here</h2><p id="summary">The check usually completes in a few seconds.</p><dl id="details" hidden><dt>Domain</dt><dd id="detail-domain"></dd><dt>Signal</dt><dd id="detail-status"></dd><dt>Checked</dt><dd id="detail-time"></dd></dl></aside>
</div>
</main>
<script>
const form=document.querySelector("#check-form"),domainInput=document.querySelector("#domain"),submit=document.querySelector("#submit"),pill=document.querySelector("#pill"),title=document.querySelector("#title"),summary=document.querySelector("#summary"),details=document.querySelector("#details"),detailDomain=document.querySelector("#detail-domain"),detailStatus=document.querySelector("#detail-status"),detailTime=document.querySelector("#detail-time");
function setState(kind,label,text,data){pill.className="status"+(kind?" "+kind:"");pill.textContent=label;title.textContent=data?.label||label;summary.textContent=text;details.hidden=!data;if(data){detailDomain.textContent=data.domain;detailStatus.textContent=String(data.status);detailTime.textContent=new Date(data.checkedAt).toLocaleString()}}
async function runCheck(domain){submit.disabled=true;setState("","Checking","Waiting for the endpoint to answer.");try{const response=await fetch("/api/v1/check?domain="+encodeURIComponent(domain));const data=await response.json();if(!response.ok||!data.ok){setState("unknown","Needs another look",data.error||"The domain could not be checked.");return}const kind=data.result==="likely_blocked"?"blocked":data.result==="not_likely_blocked"?"ok":"unknown";setState(kind,data.label,data.summary,data)}catch{setState("unknown","Needs another look","The check could not be completed from this browser.")}finally{submit.disabled=false}}
form.addEventListener("submit",event=>{event.preventDefault();runCheck(domainInput.value)});document.querySelectorAll("[data-domain]").forEach(button=>{button.addEventListener("click",()=>{domainInput.value=button.dataset.domain;runCheck(button.dataset.domain)})});
</script>
</body>
</html>`;
}
