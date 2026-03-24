function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthPrefix(dateString) {
  return dateString.slice(0, 7);
}

module.exports = {
  getLocalDateString,
  getMonthPrefix,
};
