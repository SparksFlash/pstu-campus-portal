export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10,}$/;
  return re.test(phone.replace(/\D/g, ''));
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateForm = (data, requiredFields) => {
  for (const field of requiredFields) {
    if (!data[field]) {
      return { valid: false, error: `${field} is required` };
    }
  }
  return { valid: true };
};

export const validateStudentId = (id) => {
  return id && id.length >= 5;
};
