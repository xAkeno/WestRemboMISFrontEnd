/**
 * Text transformation and form utilities
 */

// Uppercase text transformation
export const toUpperCase = (text: string): string => {
  return text.toUpperCase();
};

// Prefix options for combobox
export const PREFIX_OPTIONS = [
  { value: "Mr.", label: "Mr." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Ms.", label: "Ms." },
  { value: "Dr.", label: "Dr." },
  { value: "Engr.", label: "Engr." },
  { value: "Arch.", label: "Arch." },
  { value: "Prof.", label: "Prof." },
  { value: "Hon.", label: "Hon." },
];

// Extension options
export const EXTENSION_OPTIONS = [
  { value: "Jr.", label: "Jr." },
  { value: "Sr.", label: "Sr." },
  { value: "III", label: "III" },
  { value: "IV", label: "IV" },
];

// Marital status options
export const MARITAL_STATUS_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Widowed", label: "Widowed" },
  { value: "Separated", label: "Separated" },
];

// Blood type options
export const BLOOD_TYPE_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "N/A", label: "N/A" },
];

// Complexion options
export const COMPLEXION_OPTIONS = [
  { value: "Fair", label: "Fair" },
  { value: "Light", label: "Light" },
  { value: "Medium", label: "Medium" },
  { value: "Tan", label: "Tan" },
  { value: "Dark", label: "Dark" },
];
