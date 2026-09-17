import axios, { type AxiosError } from "axios";

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: string[];
}

export interface ParsedApiError {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
  isNetworkError: boolean;
}

const FIELD_ALIASES: Record<string, string> = {
  email: "email",
  password: "password",
  phone: "phone",
  otpcode: "otpCode",
  otp: "otpCode",
  code: "otpCode",
  newpassword: "newPassword",
  confirmpassword: "confirmPassword",
  customname: "customName",
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "Revisá los datos ingresados e intentá de nuevo.",
  401: "Email o contraseña incorrectos.",
  403: "No tenés permiso para realizar esta acción.",
  404: "No encontramos lo que buscabas.",
  409: "Ese email ya está registrado.",
  413: "El archivo es demasiado grande.",
  422: "No pudimos procesar la solicitud. Revisá los datos.",
  429: "Demasiados intentos. Esperá unos minutos e intentá de nuevo.",
};

export function parseApiError(error: unknown, fallback: string): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    return { message: fallback, fieldErrors: {}, isNetworkError: false };
  }

  const axiosError = error as AxiosError<ApiErrorPayload>;

  if (!axiosError.response) {
    return {
      message:
        "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.",
      fieldErrors: {},
      isNetworkError: true,
    };
  }

  const status = axiosError.response.status;
  const data = axiosError.response.data;

  const fieldErrors: Record<string, string> = {};
  for (const item of data?.validationErrors ?? []) {
    const separator = item.indexOf(":");
    if (separator === -1) continue;
    const rawField = item.slice(0, separator).trim().toLowerCase();
    const fieldMessage = item.slice(separator + 1).trim();
    if (!fieldMessage) continue;
    const field = FIELD_ALIASES[rawField] ?? rawField;
    fieldErrors[field] = fieldMessage;
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const serverMessage = data?.message?.trim();

  let message: string;
  if (hasFieldErrors) {
    message = "Revisá los campos marcados para continuar.";
  } else if (status >= 500) {
    message =
      "Tuvimos un problema en el servidor. Intentá de nuevo en unos minutos.";
  } else if (serverMessage) {
    message = serverMessage;
  } else {
    message = STATUS_MESSAGES[status] ?? fallback;
  }

  return { message, fieldErrors, status, isNetworkError: false };
}
