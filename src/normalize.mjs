const columns = ['id', 'title', 'duration', 'depends_on', 'resource', 'priority'];
const identifier = /^[a-z][a-z0-9_-]*$/;

export function normalizeRows(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Rows must be an array');
  const seen = new Set();
  const tasks = Array.from(rows, row => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError('Invalid row');
    const keys = Reflect.ownKeys(row).filter(key => Object.getOwnPropertyDescriptor(row, key).enumerable);
    if (keys.length !== columns.length || !columns.every(key => keys.includes(key) && typeof row[key] === 'string')) {
      throw new TypeError('Row must contain exactly six string fields');
    }
    const id = row.id.trim().toLowerCase();
    const resource = row.resource.trim().toLowerCase();
    const title = row.title.trim().replace(/\s+/g, ' ');
    const durationText = row.duration.trim();
    const priorityText = row.priority.trim();
    if (!identifier.test(id) || seen.has(id)) throw new TypeError('Invalid or duplicate task ID');
    if (resource !== '' && !identifier.test(resource)) throw new TypeError('Invalid resource');
    if (!title) throw new TypeError('Title is required');
    if (!/^[1-9][0-9]*$/.test(durationText) || Number(durationText) > 1000000) throw new TypeError('Invalid duration');
    if (priorityText !== '' && !/^(?:0|-?[1-9])$/.test(priorityText)) throw new TypeError('Invalid priority');
    const dependsOn = row.depends_on.trim() === '' ? [] : row.depends_on.split('|').map(token => token.trim().toLowerCase());
    if (dependsOn.some(dep => !identifier.test(dep) || dep === id) || new Set(dependsOn).size !== dependsOn.length) {
      throw new TypeError('Invalid dependencies');
    }
    seen.add(id);
    return { id, title, duration: Number(durationText), dependsOn: dependsOn.sort(), resource, priority: priorityText === '' ? 0 : Number(priorityText) };
  });
  return tasks.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
