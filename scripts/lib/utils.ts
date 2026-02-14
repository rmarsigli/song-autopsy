export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function createFrontmatter(data: Record<string, any>): string {
  return `---\n${Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`
        if (typeof value[0] === 'object') {
          return `${key}:\n${value.map(item => 
            `  - ${Object.entries(item).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n    ')}`
          ).join('\n')}`
        }
        return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`
      }
      return `${key}: ${JSON.stringify(value)}`
    })
    .join('\n')}\n---\n`
}
