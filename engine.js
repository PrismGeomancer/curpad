/* CURE scoring model v1. Pure functions shared by the app and verification suite. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CureEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const dimensions = [
    { key: 'fomo', name: 'FOMO response', condition: 'Acute FOMO', description: 'Momentum and social excitement have a strong influence on your stated decisions.', verdict: 'Enters after the third green candle.', task: 'Write three reasons for an entry before opening a chart.', note: 'Separate a reason from a reaction.' },
    { key: 'impulse', name: 'Decision impulsivity', condition: 'Impulse Overload', description: 'Your answers favor immediate action over a predefined decision process.', verdict: 'The buy button is a coping mechanism.', task: 'Write a decision rule, then wait ten minutes before acting.', note: 'A pause is still a decision.' },
    { key: 'attachment', name: 'Position attachment', condition: 'Chronic Bag Attachment', description: 'Your answers suggest difficulty revisiting a position when the original reasoning changes.', verdict: 'Every loss is now a long-term investment.', task: 'Describe one condition that would invalidate a fictional trade thesis.', note: 'Commit to reasoning, not a ticker.' },
    { key: 'dependency', name: 'Chart dependency', condition: 'Chart Dependency', description: 'Frequent monitoring appears to occupy a large share of your attention.', verdict: 'Checks prices before checking messages.', task: 'Take a five-minute chart-free break using the focus timer.', note: 'Your attention is also an asset.' }
  ];
  const q = (id, dimension, title, subtitle, choices, scores = [0, 30, 65, 100]) => ({ id, dimension, title, subtitle, choices, scores });
  const questions = [
    q('q1', 'dependency', 'How often do you check a position?', 'Think about a typical day, not your best day.', ['At planned check-in times', 'A few unplanned checks', 'Every spare moment', 'The chart is always open']),
    q('q2', 'fomo', 'A token doubles before you notice. Your reaction?', 'There is no correct trade here. We are observing the urge.', ['Move on; it was not my setup', 'Research without entering', 'Buy a little to avoid missing out', 'Enter immediately before it runs again']),
    q('q3', 'impulse', 'What usually comes before an entry?', 'Choose the closest description.', ['Written thesis and a decision rule', 'A checklist I mostly follow', 'A quick impression', 'A feeling and a click']),
    q('q4', 'attachment', 'Your original thesis stops making sense. What next?', 'Imagine you can review the evidence calmly.', ['Reassess against my exit criteria', 'Ask what changed and set a review time', 'Wait for the price to recover first', 'Find a new reason to keep holding']),
    q('q5', 'dependency', 'How does an open position affect your offline time?', 'Your phone can be very persuasive.', ['I keep my normal routine', 'I occasionally interrupt what I am doing', 'I regularly check during conversations', 'I struggle to leave it alone']),
    q('q6', 'fomo', 'Everyone in the group chat is posting gains.', 'No names. The clinic has seen this before.', ['Their results do not change my plan', 'I look at the setup out of curiosity', 'I increase my planned position', 'I abandon my plan to join them']),
    q('q7', 'impulse', 'After a frustrating loss, you tend to…', 'Answer based on behavior, not intention.', ['Pause and review the decision', 'Take a short break', 'Look for another trade right away', 'Size up to win it back']),
    q('q8', 'attachment', 'What makes selling a position difficult?', 'Choose the closest answer.', ['I can follow my predefined criteria', 'I worry I might sell too early', 'I need to get back to my entry price', 'Selling feels like admitting defeat'])
  ];
  const scenarios = [
    { ...q('s1', 'fomo', 'The third green candle.', 'A fictional asset is up 80%. Your feed says it is still early. You have no existing thesis.', ['Skip it and review my criteria', 'Research it before deciding', 'Enter a small position now', 'Go in before the next candle']), prices: [28,31,29,35,33,41,46,43,58,69,78,92], context: '+80% / SOCIAL MOMENTUM', insight: 'Social excitement is information about attention. It is not a substitute for your own decision criteria.' },
    { ...q('s2', 'impulse', 'The sudden red candle.', 'A fictional position drops 25% in minutes. There is no new information yet.', ['Pause and consult my existing plan', 'Gather information before acting', 'Immediately change the position', 'Double the position without reviewing']), prices: [84,87,85,89,88,85,82,80,65,58,61,63], context: '−25% / VOLATILITY SHOCK', insight: 'A predefined process gives you something to consult when urgency feels convincing. Neither buying nor selling is automatically the right answer.' },
    { ...q('s3', 'attachment', 'The thesis has changed.', 'A fictional project cancels the feature you originally bought it for. Your position is below your entry.', ['Reassess using my invalidation rule', 'Set a review deadline and gather facts', 'Wait until I break even', 'Replace the thesis so I can keep holding']), prices: [80,77,79,73,70,66,68,63,61,58,56,55], context: 'THESIS INVALIDATED / ATTACHMENT', insight: 'Your entry price is historical context. It does not, by itself, explain whether the current thesis still holds.' },
    { ...q('s4', 'dependency', 'The market is doing nothing.', 'The fictional chart has moved sideways for an hour. You are having dinner with a friend.', ['Leave the chart until my scheduled check', 'Set an alert and put the phone away', 'Check every few minutes', 'Keep the chart open throughout dinner']), prices: [49,50,48,51,50,49,51,50,48,50,49,50], context: 'SIDEWAYS / ATTENTION TEST', insight: 'Repeated checking can consume attention without adding useful information. A scheduled review is an alternative worth trying.' }
  ];
  const items = [...questions, ...scenarios];
  function validAnswers(answers, complete = true) {
    return Array.isArray(answers) && answers.length === items.length && answers.every(a => (a === null && !complete) || (Number.isInteger(a) && a >= 0 && a < 4));
  }
  function analyze(answers) {
    if (!validAnswers(answers)) throw new Error('A complete assessment needs twelve valid answers.');
    const scores = {};
    dimensions.forEach(d => {
      const positions = items.map((item, i) => item.dimension === d.key ? i : -1).filter(i => i !== -1);
      scores[d.key] = Math.round(positions.reduce((sum, i) => sum + items[i].scores[answers[i]], 0) / positions.length);
    });
    const ranked = [...dimensions].sort((a,b) => scores[b.key] - scores[a.key]);
    const average = Math.round(Object.values(scores).reduce((a,b) => a+b, 0) / dimensions.length);
    const primary = ranked[0];
    return { scores, average, primary: primary.key, condition: scores[primary.key] < 35 ? 'Stable, For Now' : primary.condition, severity: scores[primary.key] < 35 ? 'Low signal' : scores[primary.key] < 65 ? 'Moderate signal' : 'Strong signal', balance: 100 - average };
  }
  function validateTools(raw) {
    const empty = { checklist:null, decisions:[], practice:[] };
    if (raw === undefined || raw === null) return empty;
    if (typeof raw !== 'object' || !Array.isArray(raw.decisions) || raw.decisions.length > 100 || !Array.isArray(raw.practice) || raw.practice.length > 100) throw new Error('Decision lab data is invalid.');
    const string = (v, max) => typeof v === 'string' && v.length <= max;
    const stamp = v => Number.isFinite(v) && v >= 0 && v <= Date.now()+60000;
    const day = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
    function plan(v, complete=false) {
      if (!v || !string(v.asset,40) || !string(v.thesis,1000) || !string(v.invalidation,1000) || !string(v.exitRule,1000) || !['enter','wait','pass'].includes(v.intent) || !['calm','excited','anxious','frustrated'].includes(v.emotion) || !(v.reviewDate==='' || day(v.reviewDate)) || !Array.isArray(v.checks) || v.checks.length!==5 || !v.checks.every(x=>typeof x==='boolean')) throw new Error('A decision plan is invalid.');
      if (complete && (!v.asset.trim() || !v.thesis.trim() || !v.invalidation.trim() || !v.exitRule.trim() || !day(v.reviewDate) || !v.checks.every(Boolean))) throw new Error('A saved decision plan is incomplete.');
      return {asset:v.asset,thesis:v.thesis,invalidation:v.invalidation,exitRule:v.exitRule,intent:v.intent,emotion:v.emotion,reviewDate:v.reviewDate,checks:[...v.checks]};
    }
    const seen = new Set();
    const decisions=raw.decisions.map(d=>{
      if(!d || typeof d.id!=='string' || !/^DEC-[A-Z0-9-]{4,40}$/.test(d.id) || seen.has(d.id) || !stamp(d.createdAt)) throw new Error('A decision record is invalid.');
      seen.add(d.id);let review=null;
      if(d.review!==null && d.review!==undefined){const r=d.review;if(!r||!stamp(r.createdAt)||!['yes','partly','no'].includes(r.followed)||!string(r.outcome,1000)||!string(r.lesson,1000)||!r.lesson.trim()) throw new Error('A decision review is invalid.');review={createdAt:r.createdAt,followed:r.followed,outcome:r.outcome,lesson:r.lesson};}
      return {id:d.id,createdAt:d.createdAt,...plan(d,true),review};
    });
    const practice=raw.practice.map(a=>{
      if(!a || !string(a.scenario,40) || !Number.isInteger(a.choice) || a.choice<0 || a.choice>3 || !stamp(a.createdAt)) throw new Error('A practice record is invalid.');
      return {scenario:a.scenario,choice:a.choice,createdAt:a.createdAt};
    });
    return {checklist:raw.checklist?plan(raw.checklist):null,decisions:decisions.sort((a,b)=>b.createdAt-a.createdAt),practice:practice.sort((a,b)=>b.createdAt-a.createdAt)};
  }
  function validateBackup(data) {
    if (!data || data.version !== 1 || !data.profile || typeof data.profile.id !== 'string' || !/^CURE-[A-Z0-9-]{4,40}$/.test(data.profile.id) || typeof data.profile.name !== 'string' || data.profile.name.length > 24 || !Array.isArray(data.reports) || data.reports.length > 50 || !Array.isArray(data.checkins) || data.checkins.length > 90) throw new Error('This is not a valid CURE v1 backup.');
    const ids = new Set();
    const reports = data.reports.map(r => {
      if (!r || typeof r.id !== 'string' || !/^RX-[A-Z0-9-]{4,40}$/.test(r.id) || ids.has(r.id) || !validAnswers(r.answers) || !Number.isFinite(r.createdAt) || r.createdAt < 0 || r.createdAt > Date.now() + 60000 || !Array.isArray(r.times) || r.times.length !== 12 || !r.times.every(t => Number.isFinite(t) && t >= 0 && t <= 86400000)) throw new Error('A patient report is invalid.');
      ids.add(r.id);
      return { id: r.id, createdAt: r.createdAt, answers: [...r.answers], times: [...r.times], ...analyze(r.answers), model: 1 };
    });
    const checkinDays = new Set();
    const checkins = data.checkins.map(c => {
      if (!c || typeof c.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(c.date) || !Number.isFinite(Date.parse(c.date)) || new Date(c.date).toISOString().slice(0,10) !== c.date || checkinDays.has(c.date) || typeof c.note !== 'string' || c.note.length > 500 || !Number.isInteger(c.mood) || c.mood < 1 || c.mood > 5) throw new Error('A recovery check-in is invalid.');
      checkinDays.add(c.date); return { date:c.date, note:c.note, mood:c.mood };
    });
    const tasks = {};
    if (data.tasks && typeof data.tasks === 'object') for (const r of reports) {
      const t = data.tasks[r.id];
      if (Array.isArray(t) && t.length === 3 && t.every(x => typeof x === 'boolean')) tasks[r.id] = [...t];
    }
    return { version:1, profile:{id:data.profile.id, name:data.profile.name}, reports:reports.sort((a,b)=>b.createdAt-a.createdAt), checkins:checkins.sort((a,b)=>b.date.localeCompare(a.date)), tasks, draft:null, focus:null, tools:validateTools(data.tools) };
  }
  function dayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function streak(checkins, now = new Date()) {
    const days = new Set(checkins.map(c=>c.date)); const cursor = new Date(now); cursor.setHours(12,0,0,0);
    if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate()-1);
    let count=0; while(days.has(dayKey(cursor))) { count++; cursor.setDate(cursor.getDate()-1); }
    return count;
  }
  return { dimensions, questions, scenarios, items, analyze, validAnswers, validateBackup, validateTools, dayKey, streak };
});
