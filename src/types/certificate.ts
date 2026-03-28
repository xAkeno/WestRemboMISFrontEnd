export interface TextField {
  id: string;
  label: string;
  value: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  alignment: 'left' | 'center' | 'right';
  opacity: number;
  letterSpacing: number;
  page: number;

  // NEW optional fields
  fieldType?: 'TEXT' | 'ADDRESS' | 'DATE';

  // For ADDRESS
  addressFields?: {
    house?: string;
    street?: string;
    barangay?: string;
  };

  // For DATE
  isDate?: boolean;
  dateFormat?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'WORD';
}

export interface PDFTemplateInfo {
  pageCount: number;
  pages: { width: number; height: number }[];
}

export const DEFAULT_FIELD: Omit<TextField, 'id' | 'label' | 'value'> = {
  x: 100,
  y: 300,
  fontSize: 14,
  fontFamily: 'Helvetica',
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  alignment: 'left',
  opacity: 1,
  letterSpacing: 0,
  page: 0,
  // optional fields default
  fieldType: 'TEXT',
  addressFields: { house: '', street: '', barangay: '' },
  isDate: false,
  dateFormat: 'YYYY-MM-DD',
};

export const PREDEFINED_FIELDS = [
  'First Name',
  'Middle Name',
  'Last Name',
  'Suffix',
  'Sex',
  'Address',         // can use 3-in-1 fields
  'Certificate Number',
  'Date Issued',     // can be date
  'Date Expired',    // can be date
  'Certificate Fee',
];

export const FONT_FAMILIES: TextField['fontFamily'][] = ['Helvetica', 'TimesRoman', 'Courier'];

export const COLOR_PALETTE = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#0066FF', '#9900CC',
  '#CC0000', '#CC6600', '#CC9900', '#009900', '#003399', '#660099',
  '#990000', '#994400', '#997700', '#006600', '#002266', '#440066',
];
