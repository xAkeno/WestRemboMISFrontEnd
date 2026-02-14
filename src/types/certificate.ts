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
};

export const PREDEFINED_FIELDS = [
  'First Name',
  'Middle Name',
  'Last Name',
  'Suffix',
  'Sex',
  'Address',
  'Certificate Number',
  'Date Issued',
  'Date Expired',
  'Certificate Fee',
];

export const FONT_FAMILIES: TextField['fontFamily'][] = ['Helvetica', 'TimesRoman', 'Courier'];

export const COLOR_PALETTE = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#0066FF', '#9900CC',
  '#CC0000', '#CC6600', '#CC9900', '#009900', '#003399', '#660099',
  '#990000', '#994400', '#997700', '#006600', '#002266', '#440066',
];
