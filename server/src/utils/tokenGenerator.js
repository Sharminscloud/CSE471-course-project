export const formatTokenNumber = ({ isPriority, queueNumber }) => {
  const prefix = isPriority ? "P" : "N";
  return `${prefix}-${String(queueNumber).padStart(3, "0")}`;
};