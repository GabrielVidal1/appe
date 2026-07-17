// Establish the *mechanism* APPE needs: how context (and thus cache-read tokens)
// grows with turn number, and validate the cost power-law out-of-sample.
import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync("/tmp/appe-agentic-dataset.json","utf8"));
const clean = rows.filter(r=>r.assistantMsgs>=2 && r.cost>0.01 && r.firstPrompt && r.durationSec>5 && !/scratchpad|runner-test|fork-test/.test(r.file));

// ---- context-growth model ----
// If context grows linearly: prefix_at_turn_k ≈ base + slope*k tokens.
// Sum of cache-reads over N turns ≈ N*base + slope*N²/2  → quadratic in N.
// That yields cost ∝ N^~2 for the cache term; blended with cheaper output the
// observed exponent is ~1.2. Estimate base+slope from cacheRead/turn vs turns.
const pts = clean.filter(r=>r.assistantMsgs>=5 && r.cacheReadTok>0)
  .map(r=>({N:r.assistantMsgs, avgPrefix: r.cacheReadTok/r.assistantMsgs}));
// avgPrefix ≈ base + slope*N/2 (mean prefix over a linearly growing context)
// OLS avgPrefix vs N
function ols(xs,ys){const n=xs.length,mx=xs.reduce((a,b)=>a+b)/n,my=ys.reduce((a,b)=>a+b)/n;
  let sxy=0,sxx=0;for(let i=0;i<n;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sxx+=(xs[i]-mx)**2;}
  const slope=sxy/sxx,inter=my-slope*mx;return{slope,inter};}
const g = ols(pts.map(p=>p.N), pts.map(p=>p.avgPrefix));
console.log("=== CONTEXT GROWTH ===");
console.log(`avgPrefixTokens ≈ ${Math.round(g.inter)} + ${Math.round(g.slope)} * N   (N=assistant msgs)`);
console.log(`→ base prefix ≈ ${Math.round(g.inter)} tok, growth ≈ ${Math.round(g.slope*2)} tok/turn`);

// ---- out-of-sample validation of cost = a*N^b (80/20 split, deterministic) ----
const withN = clean.filter(r=>r.assistantMsgs>0&&r.cost>0).map(r=>({N:r.assistantMsgs,c:r.cost,i:parseInt(r.sid.slice(0,4),16)}));
const train=withN.filter(r=>r.i%5!==0), test=withN.filter(r=>r.i%5===0);
function powerFit(a){const lx=a.map(r=>Math.log(r.N)),ly=a.map(r=>Math.log(r.c)),n=lx.length;
  const mx=lx.reduce((x,y)=>x+y)/n,my=ly.reduce((x,y)=>x+y)/n;let sxy=0,sxx=0;
  for(let i=0;i<n;i++){sxy+=(lx[i]-mx)*(ly[i]-my);sxx+=(lx[i]-mx)**2;}
  const b=sxy/sxx,la=my-b*mx;return{a:Math.exp(la),b};}
const fit=powerFit(train);
// predict on test, report median absolute % error and coverage of a lognormal band
const resid=test.map(r=>{const pred=fit.a*Math.pow(r.N,fit.b);return{ape:Math.abs(r.c-pred)/r.c, lr:Math.log(r.c/pred)};});
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
const sigma=Math.sqrt(resid.reduce((a,b)=>a+b.lr*b.lr,0)/resid.length);
console.log("\n=== OUT-OF-SAMPLE (train",train.length,"test",test.length,") ===");
console.log(`fit: cost = ${fit.a.toFixed(4)} * N^${fit.b.toFixed(3)}`);
console.log(`median abs %err: ${(med(resid.map(r=>r.ape))*100).toFixed(0)}%`);
console.log(`residual ln-sigma: ${sigma.toFixed(3)}  → 80% band = predict × [${Math.exp(-1.28*sigma).toFixed(2)}, ${Math.exp(1.28*sigma).toFixed(2)}]`);

// ---- example point estimates from the model ----
console.log("\n=== MODEL PREDICTIONS (median cost) ===");
for(const N of [5,20,50,100,200,400]){
  const c=fit.a*Math.pow(N,fit.b);
  console.log(`  N=${String(N).padStart(3)} msgs → $${c.toFixed(2)}   80% band $${(c*Math.exp(-1.28*sigma)).toFixed(2)}–$${(c*Math.exp(1.28*sigma)).toFixed(2)}`);
}
