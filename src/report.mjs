const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonnegativeInteger = value => Number.isInteger(value) && value >= 0;

export function renderReport(tasks, analysis, plan) {
  if (!Array.isArray(tasks)) throw new TypeError('Tasks must be an array');
  const titles = new Map();
  for (const task of tasks) {
    if (!object(task) || typeof task.id !== 'string' || task.id !== task.id.trim() || !/^[a-z][a-z0-9_-]*$/.test(task.id)
      || titles.has(task.id) || typeof task.title !== 'string' || task.title.length === 0) throw new TypeError('Invalid report task');
    titles.set(task.id, task.title);
  }
  if (!object(analysis) || !nonnegativeInteger(analysis.criticalPath)) throw new TypeError('Invalid critical path');
  if (!object(plan) || (plan.workers !== 1 && plan.workers !== 2) || !nonnegativeInteger(plan.makespan)
    || !Array.isArray(plan.entries) || plan.entries.length !== tasks.length) throw new TypeError('Invalid plan');
  const seen = new Set();
  let maximum = 0;
  const rows = [];
  for (const entry of plan.entries) {
    if (!object(entry) || !titles.has(entry.id) || seen.has(entry.id)
      || !Number.isInteger(entry.worker) || entry.worker < 1 || entry.worker > plan.workers
      || !nonnegativeInteger(entry.start) || !Number.isInteger(entry.end) || entry.end <= entry.start) throw new TypeError('Invalid plan entry');
    seen.add(entry.id);
    maximum = Math.max(maximum, entry.end);
    const title = titles.get(entry.id).replace(/[\\|]/g, character => '\\' + character);
    rows.push(`| ${entry.id} | ${title} | ${entry.worker} | ${entry.start} | ${entry.end} |\n`);
  }
  if (plan.makespan !== maximum) throw new TypeError('Makespan must equal maximum end');
  return '# Project plan\n\n| Task | Title | Worker | Start | End |\n| --- | --- | --- | --- | --- |\n'
    + rows.join('') + `\nMakespan: ${plan.makespan}\nCritical path: ${analysis.criticalPath}\nWorkers: ${plan.workers}\n`;
}
