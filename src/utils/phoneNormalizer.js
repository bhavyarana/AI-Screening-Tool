export const normalizeIndianPhone = (input) => {
  if (!input) return null;

  // 1️⃣ Convert to string & remove all non-digits
  const digits = input.toString().replace(/\D/g, "");

  // 2️⃣ Take last 10 digits (Indian mobile numbers)
  const last10 = digits.slice(-10);

  // 3️⃣ Validate
  if (!/^[6-9]\d{9}$/.test(last10)) {
    return null; // invalid Indian mobile number
  }

  // 4️⃣ Format strictly
  return `+91${last10}`;
};
