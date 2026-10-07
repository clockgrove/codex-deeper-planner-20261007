const identifier = /^[a-z][a-z0-9_-]*$/;
const validId = id => typeof id === 'string' && id === id.trim() && identifier.test(id);

export function analyzeDependencies(tasks) {
  if (!Array.isArray(tasks)) throw new TypeError('Tasks must be an array');
  const byId = new Map();
  for (const task of tasks) {
    if (!task || typeof task !== 'object' || Array.isArray(task) || !validId(task.id) || byId.has(task.id)
      || !Number.isInteger(task.duration) || task.duration < 1 || task.duration > 1000000
      || !Array.isArray(task.dependsOn) || Array.from(task.dependsOn).some(dep => !validId(dep) || dep === task.id)
      || new Set(task.dependsOn).size !== task.dependsOn.length) throw new TypeError('Invalid canonical task');
    byId.set(task.id, task);
  }
  const ids = [...byId.keys()].sort();
  const dependencies = Object.fromEntries(ids.map(id => [id, [...byId.get(id).dependsOn].sort()]));
  const remaining = new Map();
  const dependents = new Map(ids.map(id => [id, []]));
  for (const id of ids) {
    remaining.set(id, dependencies[id].length);
    for (const dep of dependencies[id]) {
      if (!byId.has(dep)) throw new TypeError('Unknown dependency');
      dependents.get(dep).push(id);
    }
  }
  const ready = ids.filter(id => remaining.get(id) === 0);
  const order = [];
  const lengths = new Map();
  let criticalPath = 0;
  while (ready.length) {
    ready.sort();
    const id = ready.shift();
    let preceding = 0;
    for (const dep of dependencies[id]) preceding = Math.max(preceding, lengths.get(dep));
    const length = preceding + byId.get(id).duration;
    lengths.set(id, length);
    criticalPath = Math.max(criticalPath, length);
    order.push(id);
    for (const next of dependents.get(id)) {
      remaining.set(next, remaining.get(next) - 1);
      if (remaining.get(next) === 0) ready.push(next);
    }
  }
  if (order.length !== ids.length) throw new TypeError('Dependency cycle');
  return { order, dependencies, criticalPath };
}
