const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validId = value => typeof value === 'string' && value === value.trim() && /^[a-z][a-z0-9_-]*$/.test(value);

export function scheduleTasks(tasks, analysis, options = {}) {
  if (!object(options)) throw new TypeError('Options must be an object');
  const workers = 'workers' in options ? options.workers : 2;
  if (workers !== 1 && workers !== 2) throw new TypeError('Workers must be 1 or 2');
  if (!Array.isArray(tasks)) throw new TypeError('Tasks must be an array');
  const byId = new Map();
  for (const task of tasks) {
    if (!object(task) || !validId(task.id) || byId.has(task.id)
      || !Number.isInteger(task.duration) || task.duration < 1 || task.duration > 1000000
      || !Array.isArray(task.dependsOn) || Array.from(task.dependsOn).some(dep => !validId(dep) || dep === task.id)
      || new Set(task.dependsOn).size !== task.dependsOn.length
      || typeof task.resource !== 'string' || (task.resource !== '' && !validId(task.resource))
      || !Number.isInteger(task.priority) || task.priority < -9 || task.priority > 9) {
      throw new TypeError('Invalid canonical task');
    }
    byId.set(task.id, task);
  }
  if (!object(analysis) || !Array.isArray(analysis.order) || !object(analysis.dependencies)
    || !Number.isInteger(analysis.criticalPath) || analysis.criticalPath < 0
    || analysis.order.length !== tasks.length || new Set(analysis.order).size !== tasks.length
    || Reflect.ownKeys(analysis.dependencies).length !== tasks.length) throw new TypeError('Invalid analysis');
  const visited = new Set();
  for (const id of analysis.order) {
    if (!byId.has(id) || !Object.hasOwn(analysis.dependencies, id)) throw new TypeError('Analysis IDs do not match');
    const deps = analysis.dependencies[id];
    const expected = byId.get(id).dependsOn;
    if (!Array.isArray(deps) || deps.length !== expected.length || new Set(deps).size !== deps.length
      || Array.from(deps).some(dep => !expected.includes(dep))
      || expected.some(dep => !visited.has(dep))) throw new TypeError('Analysis dependencies or order do not match');
    visited.add(id);
  }

  const pending = [...byId.values()].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const completed = new Set();
  const reserved = new Set();
  const running = Array(workers).fill(null);
  const entries = [];
  let time = 0;
  while (pending.length || running.some(Boolean)) {
    // All completions at this timestamp precede every dispatch.
    for (let worker = 0; worker < workers; worker++) {
      const job = running[worker];
      if (job && job.end === time) {
        completed.add(job.id);
        if (job.resource) reserved.delete(job.resource);
        running[worker] = null;
      }
    }
    for (let worker = 0; worker < workers; worker++) {
      if (running[worker]) continue;
      const index = pending.findIndex(task => task.dependsOn.every(dep => completed.has(dep))
        && (!task.resource || !reserved.has(task.resource)));
      if (index === -1) continue;
      const [task] = pending.splice(index, 1);
      const end = time + task.duration;
      entries.push({ id: task.id, worker: worker + 1, start: time, end });
      running[worker] = { id: task.id, end, resource: task.resource };
      if (task.resource) reserved.add(task.resource);
    }
    const active = running.filter(Boolean);
    if (active.length) time = Math.min(...active.map(job => job.end));
    else if (pending.length) throw new TypeError('Tasks cannot be scheduled');
  }
  return { workers, entries, makespan: time };
}
