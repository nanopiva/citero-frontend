/* =========================================
ENUMS
========================================= */
// El rol ahora es contextual al Workspace, no global al usuario
export enum WorkspaceRole {
  OWNER = "OWNER",
  STAFF = "STAFF",
}

export enum ReservationMode {
  PUBLIC = "PUBLIC",
  AUTHENTICATED = "AUTHENTICATED",
}

export enum AppointmentStatus {
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  COMPLETED = "COMPLETED",
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

/* =========================================
AUTH, USER & WORKSPACE
========================================= */
export interface UserResponseDto {
  id: number;
  email: string;
  phone?: string;
  name?: string;
  createdAt?: string;
}

export interface UserUpdateDto {
  phone?: string;
  name?: string;
  password?: string;
  currentPassword?: string;
}

export interface WorkspaceResponseDto {
  businessId: number;
  businessName: string;
  slug: string;
  logoUrl?: string;
  timezone?: string;
  role: WorkspaceRole;
  // Sólo para rol STAFF: id del perfil de staff del usuario en el negocio.
  staffId?: number;
}

/* =========================================
OTP
========================================= */
/* =========================================
BUSINESS
========================================= */
export interface BusinessCreateRequestDto {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  coverImageUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  whatsappNumber?: string;
}

export interface BusinessResponseDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  createdAt: string; // ISO 8601
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  coverImageUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  whatsappNumber?: string;
  timezone?: string;
}

export interface BusinessUpdateDto {
  name?: string;
  description?: string;
  logoUrl?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  coverImageUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  twitterUrl?: string;
  whatsappNumber?: string;
  timezone?: string;
}

/* =========================================
BUSINESS CONFIG (Reglas de negocio)
========================================= */
export interface BusinessConfigResponseDto {
  id?: number;
  businessId?: number;
  reservationMode: ReservationMode;
  cancellationToleranceHours: number;
  staffCanViewFullAgenda: boolean;
  defaultOpeningTime: string;
  defaultClosingTime: string;
  enableReminders: boolean;
  reminder24hEnabled: boolean;
  reminder2hEnabled: boolean;
}

/* =========================================
 BUSINESS SCHEDULE (Horarios semanales + excepciones)
 ========================================= */
export interface SchedulePeriodDto {
  openTime: string; // "HH:mm" o "HH:mm:ss"
  closeTime: string;
}

export interface BusinessScheduleRequestDto {
  dayOfWeek: DayOfWeek;
  isClosed: boolean;
  periods: SchedulePeriodDto[];
}

export interface BusinessScheduleResponseDto {
  id: number;
  dayOfWeek: DayOfWeek;
  isClosed: boolean;
  periods: SchedulePeriodDto[];
}

export interface ScheduleExceptionResponseDto {
  id: number;
  date: string;
  isClosed: boolean;
  periods: SchedulePeriodDto[];
}

/* =========================================
DASHBOARD
========================================= */
export interface DashboardStatsDto {
  businessId: number;
  businessName: string;
  appointmentsToday: number;
  appointmentsThisMonth: number;
  appointmentsPending: number;
  estimatedRevenueToday: number;
  estimatedRevenueThisMonth: number;
  occupancyRate: number;
  blockedClientsCount: number;
}

/* =========================================
SERVICE CATALOG
========================================= */
export interface ServiceResponseDto {
  id: number;
  businessId?: number;
  name: string;
  durationMinutes: number;
  price: number;
}

/* =========================================
STAFF
========================================= */
export interface StaffCreateRequestDto {
  email: string;
  customName: string;
  serviceIds?: number[];
}

export interface StaffResponseDto {
  id: number;
  customName: string;
  /** Solo presente para el dueño del negocio; omitido en el catálogo público. */
  userEmail?: string;
  hasClaimedAccount: boolean;
  services: ServiceResponseDto[];
}

/* =========================================
APPOINTMENTS
========================================= */
export interface AppointmentResponseDto {
  id: number;
  businessId: number;
  businessName?: string;
  timezone?: string;
  client: UserResponseDto;
  staff: StaffResponseDto;
  service: ServiceResponseDto;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  status: AppointmentStatus;
  cancelledLate?: boolean;
  createdAt: string;
}

/* =========================================
BUSINESS CLIENTS (bloqueo manual)
========================================= */
export interface BusinessClientResponseDto {
  id: number;
  clientId: number;
  clientEmail: string;
  isBlocked: boolean;
  blockReason?: string;
  lastUpdated?: string;
}

/* =========================================
AVAILABILITY (Algoritmo core UC-12)
========================================= */
export interface AvailabilityResponseDto {
  date: string; // YYYY-MM-DD
  availableSlots: string[]; // ["09:00:00", "09:15:00", ...]
  staffId: number | null;
  staffName: string | null;
}

/* =========================================
TIPOS AUXILIARES (Frontend-only)
========================================= */
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
}

/* =========================================
HELPERS DE RUTAS (Centralizados)
========================================= */
export const ROUTES = {
  public: {
    home: "/",
    login: "/login",
    register: "/registro",
    businessLanding: (slug: string) => `/negocio/${slug}`,
  },
  auth: {
    onboarding: "/onboarding",
    dashboard: "/dashboard",
    agenda: "/agenda",
    misTurnos: "/mis-turnos",
    servicios: "/servicios",
    staff: "/staff",
    configuracion: "/configuracion",
    perfil: "/perfil",
  },
} as const;

export const getDashboardRoute = (): string => {
  return ROUTES.auth.dashboard;
};
