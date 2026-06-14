exports.validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

exports.validatePhone = (phone) => {
  const regex = /^[\d\s\-\+\(\)]{7,}$/;
  return regex.test(phone);
};

exports.validatePassword = (password) => {
  return password && password.length >= 6;
};

exports.validateMarks = (obtained, total) => {
  return obtained >= 0 && total > 0 && obtained <= total;
};