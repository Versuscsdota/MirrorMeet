export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateRequired = (value: string | undefined | null, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} обязательно для заполнения`
    };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Phone is optional in some contexts
  }
  
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid Russian phone number
  if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) {
    return { isValid: true };
  }
  
  if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) {
    return { isValid: true };
  }
  
  return {
    isValid: false,
    error: 'Введите корректный номер телефона (например: +7 999 123-45-67)'
  };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: true }; // Email is optional
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Введите корректный email адрес'
    };
  }
  
  return { isValid: true };
};

export const validateDate = (date: string, fieldName: string): ValidationResult => {
  if (!date || date.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} обязательно для заполнения`
    };
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return {
      isValid: false,
      error: `Введите корректную дату для поля "${fieldName}"`
    };
  }
  
  return { isValid: true };
};

export const validateBirthDate = (birthDate: string): ValidationResult => {
  const dateValidation = validateDate(birthDate, 'Дата рождения');
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  const date = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  
  if (age < 16 || age > 100) {
    return {
      isValid: false,
      error: 'Возраст должен быть от 16 до 100 лет'
    };
  }
  
  if (date > today) {
    return {
      isValid: false,
      error: 'Дата рождения не может быть в будущем'
    };
  }
  
  return { isValid: true };
};

export const validateTrialDate = (trialDate: string): ValidationResult => {
  const dateValidation = validateDate(trialDate, 'Дата стажировки');
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  const date = new Date(trialDate);
  const today = new Date();
  
  // Trial date should not be more than 1 year in the past or future
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  
  if (date < oneYearAgo || date > oneYearFromNow) {
    return {
      isValid: false,
      error: 'Дата стажировки должна быть в пределах года от текущей даты'
    };
  }
  
  return { isValid: true };
};

export const validateFile = (file: File | null, fieldName: string, required: boolean = false): ValidationResult => {
  if (!file) {
    if (required) {
      return {
        isValid: false,
        error: `${fieldName} обязательно для загрузки`
      };
    }
    return { isValid: true };
  }
  
  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Размер файла "${fieldName}" не должен превышать 50MB`
    };
  }
  
  return { isValid: true };
};

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) {
    return `+7 ${cleanPhone.slice(1, 4)} ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7, 9)}-${cleanPhone.slice(9)}`;
  }
  
  if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) {
    return `+7 ${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6, 8)}-${cleanPhone.slice(8)}`;
  }
  
  return phone;
};
