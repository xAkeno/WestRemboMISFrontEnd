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
  hidden?: boolean;
  // NEW optional fields
  fieldType?: 'TEXT' | 'ADDRESS' | 'DATE' | 'ZONE' | 'QR';

  // For ADDRESS
  addressFields?: {
    house?: string;
    street?: string;
    barangay?: string;
    sitio?: string;
  };

  // For DATE
  isDate?: boolean;
  dateFormat?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'WORD';
  autoCenter?: boolean;
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
  autoCenter: false,
};

export const PREDEFINED_FIELD_GROUPS = {
  personal: [
    'First Name',
    'Middle Name',
    'Last Name',
    'Prefix',
    'Ext Name',
    'Sex',
    'Date of Birth',
    'Place of Birth',
  ],

  address: [
    'House Block Lot No',
    'Street',
    'Zone',
    'Resident Status',
    'Period of Residency',
    'House Owner',
    'Relationship to House Owner',
  ],

  business: [
    'Business Name',
    'Business Type',
    'Business Details',
    'Capital',
  ],

  building: [
    'Establishment',
    'Inspected By',
    'Date of Inspection',
    'Inspection Remarks',
  ],

  certificate: [
    'Barangay Clearance No',
    'Brgy Business No',
    'OR No',
    'Purpose',
    'Remarks',
    'Status',
  ],

  additional: [
    'Registered Voter',
    'CTC/VRR No',
    'Photo',
    'Notes',
    'Position',
    'Occupation',
    'Employment Status',
    'Blood Type',
    'Complexion',
    'PWD',
    'Precinct No',
    'Issued At',
    'Issued On',
  ],

  resident: [
    'Resident ID',
    'Prefix',
    'First Name',
    'M.I.',
    'Last Name',
    'Ext Name',
    'Nickname',
    'Sex',
    'Date of Birth',
    'Place of Birth',
    'Marital Status',
    'Name of Spouse',
    'Religion',
    'Blood Type',
    'Complexion',
    'PWD',
    'Height (cm)',
    'Weight (kg)',
    'Phone Number',
    'Email Address',
    'House Block Lot No',
    'Street',
    'Zone',
    'Resident Status',
    'Period of Residency',
    'House Owner',
    'Relationship to House Owner',
    'Voter Status',
    'Precinct No',
    'Occupation',
    'Position',
    'Employment Status',
    'Notes',
    'Status',
  ],
};

export const FONT_FAMILIES: TextField['fontFamily'][] = ['Helvetica', 'TimesRoman', 'Courier'];

export const COLOR_PALETTE = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#0066FF', '#9900CC',
  '#CC0000', '#CC6600', '#CC9900', '#009900', '#003399', '#660099',
  '#990000', '#994400', '#997700', '#006600', '#002266', '#440066',
];
