const columns = ['id', 'title', 'duration', 'depends_on', 'resource', 'priority'];

export function parseCsv(text) {
  if (typeof text !== 'string') throw new TypeError('CSV must be a string');
  if (text.startsWith('\uFEFF')) text = text.slice(1);
  if (!text.length) throw new TypeError('CSV header is required');

  const records = [];
  let index = 0;
  while (index < text.length) {
    const fields = [];
    let recordEnded = false;
    while (!recordEnded) {
      let field = '';
      if (text[index] === '"') {
        index++;
        let closed = false;
        while (index < text.length) {
          const character = text[index++];
          if (character !== '"') field += character;
          else if (text[index] === '"') { field += '"'; index++; }
          else { closed = true; break; }
        }
        if (!closed) throw new TypeError('Unterminated quoted field');
      } else {
        while (index < text.length && ![',', '\r', '\n'].includes(text[index])) {
          if (text[index] === '"') throw new TypeError('Quote in unquoted field');
          field += text[index++];
        }
      }
      fields.push(field);
      const delimiter = text[index];
      if (delimiter === ',') index++;
      else if (delimiter === '\n') { index++; recordEnded = true; }
      else if (delimiter === '\r' && text[index + 1] === '\n') {
        index += 2;
        recordEnded = true;
      } else if (index === text.length) recordEnded = true;
      else throw new TypeError('Invalid character after field');
    }
    if (fields.length !== columns.length) throw new TypeError('CSV record must have six fields');
    records.push(fields);
  }
  if (!columns.every((column, i) => records[0][i] === column)) {
    throw new TypeError('Invalid CSV header');
  }
  return records.slice(1).map(fields => Object.fromEntries(columns.map((column, i) => [column, fields[i]])));
}
