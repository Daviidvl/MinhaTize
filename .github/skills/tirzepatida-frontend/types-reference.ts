// Tipos base para a aplicação Tirzepatida Control

// ============ Autenticação ============
export interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  dateOfBirth: string;
}

// ============ Medicação ============
export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: number;
  unit: 'mg' | 'mcg' | 'ml';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface MedicationApplication {
  id: string;
  medicationId: string;
  userId: string;
  applicationDate: string;
  applicationTime: string;
  dosageApplied: number;
  administrationSite?: string; // ex: "abdômen", "coxa"
  notes?: string;
  sideEffects?: string[];
  adherence: 'taken' | 'missed' | 'delayed';
  createdAt: string;
}

export interface ScheduledDose {
  id: string;
  medicationId: string;
  userId: string;
  scheduledDate: string;
  scheduledTime: string;
  dosage: number;
  status: 'pending' | 'completed' | 'skipped';
  reminderSent: boolean;
  appliedAt?: string;
}

// ============ Saúde ============
export interface HealthMetric {
  id: string;
  userId: string;
  metricType: 'weight' | 'blood_pressure' | 'heart_rate' | 'blood_glucose';
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
}

export interface Weight {
  id: string;
  userId: string;
  weight: number; // em kg
  unit: 'kg' | 'lb';
  recordedAt: string;
  notes?: string;
}

export interface BloodPressure {
  id: string;
  userId: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  recordedAt: string;
  notes?: string;
}

export interface Vitals {
  id: string;
  userId: string;
  heartRate: number; // bpm
  bloodOxygen: number; // %
  temperature?: number; // °C
  recordedAt: string;
  notes?: string;
}

export interface SymptomLog {
  id: string;
  userId: string;
  symptom: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = leve, 5 = grave
  description?: string;
  recordedAt: string;
  linkedMedicationId?: string;
}

export interface HealthSummary {
  userId: string;
  period: 'week' | 'month' | 'year';
  averageWeight?: number;
  weightChange?: number; // positivo = ganho, negativo = perda
  averageBloodPressure?: { systolic: number; diastolic: number };
  averageHeartRate?: number;
  symptomCount: number;
  medicationAdherence: number; // 0-100%
  dataPoints: number;
  startDate: string;
  endDate: string;
}

// ============ Notificações ============
export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'alert' | 'achievement' | 'info';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

// ============ Configurações ============
export interface UserPreferences {
  userId: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderTime: string; // HH:mm
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
}

export interface UserSettings {
  userId: string;
  profileVisibility: 'private' | 'public';
  twoFactorEnabled: boolean;
  dataExportRequested?: string; // data da última requisição
}

// ============ API Response ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ Enums ============
export enum AdherenceStatus {
  EXCELLENT = 'excellent', // 90-100%
  GOOD = 'good', // 70-89%
  FAIR = 'fair', // 50-69%
  POOR = 'poor', // < 50%
}

export enum MedicationFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum SeverityLevel {
  MILD = 1,
  MODERATE = 2,
  MODERATE_SEVERE = 3,
  SEVERE = 4,
  VERY_SEVERE = 5,
}
