import { jsonBuffify, jsonDigest } from './buffify'

describe('json-utils', () => {
  const sample = {
    string: 'string',
    int: 1,
    float: 1.1,
    null: null,
    false: false,
    true: true,
    intArray: [1, 2, 3, 4],
    object: {
      stringKey: 'string',
      intKey: 1
    },
    emptyArray: []
  }

  it('should generate JSON that produces the same object', () => {
    const buffer = jsonBuffify(sample)
    const sample2 = JSON.parse(buffer.toString('utf8'))
    expect(sample2).toEqual(sample)
    expect(jsonDigest(sample, 'sha256').toString('hex')).toEqual(
      'ad75e36470facbd64891946e96213c04addf95825cc59a6d9a68f276f13d65e2'
    )
  })

  it('should digest sample with sha256 to the expected value', () => {
    expect(jsonDigest(sample, 'sha256').toString('hex')).toEqual(
      'ad75e36470facbd64891946e96213c04addf95825cc59a6d9a68f276f13d65e2'
    )
  })

  it('should digest parsed JSON with sha256 to the expected value', () => {
    const sample2 = JSON.parse(JSON.stringify(sample, null, 4))
    expect(jsonDigest(sample2, 'sha256').toString('hex')).toEqual(
      'ad75e36470facbd64891946e96213c04addf95825cc59a6d9a68f276f13d65e2'
    )
  })

  it('should take a object with optional or undefined parameters', () => {
    const sample: {
      string: string
      optionalString?: string
      undefinedString: string | undefined
      int: number
      float: number
    } = {
      string: 'string',
      undefinedString: undefined,
      int: 1,
      float: 1.1
    }
    const expected = {
      string: 'string',
      int: 1,
      float: 1.1
    }
    const buffer = jsonBuffify(sample)
    const sample2 = JSON.parse(buffer.toString('utf8'))
    expect(sample2).toEqual(expected)
  })

  it('should generate JSON with indentation', () => {
    const buffer = jsonBuffify(sample, null, 2)
    const jsonString = buffer.toString('utf8')
    expect(jsonString).toMatch(/\s\s\s\s"stringKey": "string"/)
  })

  it('should digest indented sample with sha256 to the expected value', () => {
    expect(jsonDigest(sample, 'sha256', null, 2).toString('hex')).toEqual(
      'fd17d392ee686e04ea90dddfc23225f4b701dd8b3c9d976da9420acd35f6b991'
    )
  })

  it('should remove keys based on replacer', () => {
    const buffer = jsonBuffify(sample, (key, value) => (key !== 'intArray' ? undefined : value))
    const jsonString = buffer.toString('utf8')
    const sample2 = JSON.parse(jsonString)
    expect(sample2).toEqual({ intArray: [1, 2, 3, 4] })
  })

  it('should remove keys based on replacer and keyPath', () => {
    const nestedSample = {
      node1: {
        object: {
          key: 'should be kept'
        }
      },
      node2: {
        objects: [
          {
            key: 'should not be kept'
          }
        ]
      }
    }

    const buffer = jsonBuffify(nestedSample, (_key, value, _level, keyPath) => {
      return '.node2.objects[0].key' === keyPath ? undefined : value
    })
    const jsonString = buffer.toString('utf8')
    const sample2 = JSON.parse(jsonString)
    expect(sample2).toEqual({
      node1: {
        object: {
          key: 'should be kept'
        }
      },
      node2: {
        objects: [{}]
      }
    })
  })

  it('should sort keys based on sorter function and true should be first property', () => {
    const buffer = jsonBuffify(sample, null, 2, (a, b) => b.localeCompare(a))
    const jsonString = buffer.toString('utf8')
    expect(jsonString).toMatch(/^{\s+"true"/s)
  })

  it('should convert Date', () => {
    const sample = {
      date: new Date('2021-01-09T18:11:34.309Z')
    }
    const buffer = jsonBuffify(sample)
    const jsonString = buffer.toString('utf8')
    const obj = JSON.parse(jsonString)
    expect(obj).toMatchObject({
      date: '2021-01-09T18:11:34.309Z'
    })
  })
})
