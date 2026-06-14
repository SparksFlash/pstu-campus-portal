export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.data?.message) return error.data.message;
  return 'An error occurred. Please try again.';
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createQueryString = (params) => {
  return new URLSearchParams(params).toString();
};

export const parseQueryString = (queryString) => {
  return Object.fromEntries(new URLSearchParams(queryString));
};
