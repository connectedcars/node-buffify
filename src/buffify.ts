import crypto from 'crypto'

// https://github.com/microsoft/TypeScript/issues/1897
export type Json = null | boolean | number | string | Json[] | { [prop: string]: Json | undefined }
export type JsonReplacer = (
  this: { [prop: string]: Json | undefined },
  key: string,
  value: Json,
  level: number,
  keyPath: string
) => Json | undefined

export function jsonBuffify(json: Json, replace?: JsonReplacer | null, space: number | string = ''): Buffer {
  return _jsonBuffify(
    json,
    replace ? replace : (_, value) => value,
    typeof space === 'number' ? ' '.repeat(space) : space
  )
}

function _jsonBuffify(json: Json, replace: JsonReplacer, space: string, level = 1, keyPath = ''): Buffer {
  const propIndentation = space.length > 0 ? space.repeat(level) : ''
  const endIndentation = space.length > 0 && level > 1 ? space.repeat(level - 1) : ''
  const keyValueSpace = space.length > 0 ? ' ' : ''
  const lineBreak = space.length > 0 ? '\n' : ''
  if (json === null) {
    return Buffer.from('null', 'utf8')
  } else {
    const type = typeof json
    if (type === 'boolean') {
      return Buffer.from(json.toString(), 'utf8')
    } else if (type === 'number') {
      return Buffer.from(json.toString(), 'utf8')
    } else if (type === 'string') {
      return Buffer.from(JSON.stringify(json), 'utf8')
    } else if (type === 'object') {
      const values: Buffer[] = []
      if (Array.isArray(json)) {
        if (json.length > 0) {
          values.push(Buffer.from('[' + lineBreak, 'utf8'))
          for (const [i, value] of json.entries()) {
            if (values.length > 1) {
              values.push(Buffer.from(',' + lineBreak, 'utf8'))
            }
            values.push(Buffer.from(propIndentation))
            values.push(_jsonBuffify(value, replace, space, level + 1, `${keyPath}[${i}]`))
          }
          values.push(Buffer.from(lineBreak + endIndentation + ']', 'utf8'))
        } else {
          values.push(Buffer.from('[]', 'utf8'))
        }
      } else {
        const obj = json as { [key: string]: Json }
        const keys = Object.keys(json).sort()
        if (keys.length > 0) {
          values.push(Buffer.from('{' + lineBreak, 'utf8'))
          for (const key of keys) {
            const value = replace.bind(obj)(key, obj[key], level, `${keyPath}.${key}`)
            if (typeof value !== 'undefined') {
              if (values.length > 1) {
                values.push(Buffer.from(',' + lineBreak, 'utf8'))
              }
              values.push(Buffer.from(propIndentation + JSON.stringify(key) + ':' + keyValueSpace, 'utf8'))
              values.push(_jsonBuffify(value, replace, space, level + 1, `${keyPath}.${key}`))
            }
          }
          values.push(Buffer.from(lineBreak + endIndentation + '}', 'utf8'))
        } else {
          values.push(Buffer.from('{}', 'utf8'))
        }
      }
      return Buffer.concat(values)
    } else {
      throw new Error(`Non JSON type ${type}: ${json}`)
    }
  }
}

export function jsonDigest(
  json: Json,
  algorithm = 'sha256',
  replace?: JsonReplacer | null,
  space: number | string = ''
): Buffer {
  const hash = crypto.createHash(algorithm)
  hash.update(jsonBuffify(json, replace, space))
  return hash.digest()
}
