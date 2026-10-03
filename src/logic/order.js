function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createOrder(gameId, stages) {
  const order = {};
  stages.forEach((stage, index) => {
    const random = mulberry32((gameId ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
    const ids = stage.options.map((option) => option.id);
    for (let cursor = ids.length - 1; cursor > 0; cursor -= 1) {
      const swap = Math.floor(random() * (cursor + 1));
      [ids[cursor], ids[swap]] = [ids[swap], ids[cursor]];
    }
    order[stage.id] = ids;
  });
  return order;
}
