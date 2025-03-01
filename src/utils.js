export const groupBy = cmp => xs => {
  const { acc, cur } =
    xs.slice(1).reduce(({ x, acc, cur }, y) =>
      cmp(x, y)
        ? { x: y
          , acc: acc
          , cur: [...cur, y] }
        : { x: y
          , acc: [...acc, cur]
          , cur: [y] }
      , { x: xs[0], acc: [], cur: [xs[0]] })
    
  return [...acc, cur]
}

export const chunksOf = k => xs => {
  const { acc, cur } =
    xs.reduce(({ acc, cur, len }, x) =>
      len == k
        ? { acc: [...acc, cur]
          , cur: [x]
          , len: 1 }
        : { acc: acc
          , cur: [...cur, x]
          , len: len + 1 }
      , { acc: [], cur: [], len: 0 })

  return [...acc, cur]
}

export const range = (x, y, step = 1) =>
  x > y ? [] : [x, ...range(x + step, y, step)]

export const keysEqual = (o1, o2, ...keys) =>
  keys.every(key => o1[key] === o2[key])

export const arraysEqual = (xs, ys) =>
  xs.length == ys.length && xs.every((x, idx) => x == ys[idx])

export const cssIdentifierFrom = str =>
  str.replace(/[~!@$%^&*()+=,./';:\"?><[\]{}|`#]/g, "").replace(/\s+/g, "-")