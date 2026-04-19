// [23301695] JAKIA — Token Generator (converted to CommonJS)
const formatTokenNumber = ({ isPriority, queueNumber }) => {
  const prefix = isPriority ? "P" : "N";
  return `${prefix}-${String(queueNumber).padStart(3, "0")}`;
};

module.exports = { formatTokenNumber };
