function nextId(items) {
  if (items.length === 0) return 1;
  const ids = items.map((item) => item.id);
  return Math.max(...ids) + 1;
}

module.exports = { nextId };
