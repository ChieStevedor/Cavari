export interface Certification {
  id: string;
  name: string; // "HAZMAT Endorsement", "White Glove Certified", "Forklift"
  issuedAt: string;
  expiresAt?: string;
  isWhiteGlove?: boolean;
  documentUri?: string;
}

export interface DriverPerformanceStats {
  onTimePercent: number;
  completedJobs: number;
  claimsCount: number;
  customerRatingAvg: number; // 0-5
  ratingCount: number;
}

export interface DriverDocument {
  id: string;
  name: string; // "CDL - Class B", "Insurance Card"
  expiresAt?: string;
  status: "valid" | "expiring_soon" | "expired";
  documentUri?: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  photoUri?: string;
  phone: string;
  email: string;
  carrierName: string;
  employeeId: string;
  certifications: Certification[];
  performance: DriverPerformanceStats;
  vehicle: {
    id: string;
    label: string;
    type: string;
    licensePlate: string;
  } | null;
  documents: DriverDocument[];
  status: "available" | "on_duty" | "off_duty" | "break";
}
