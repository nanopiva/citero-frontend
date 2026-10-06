/** Capitaliza la primera letra sin modificar el resto del texto. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Nombre visible del cliente: el nombre si existe; si no, el email. */
export function clientDisplayName(client: {
  name?: string | null;
  email: string;
}): string {
  return client.name?.trim() || client.email;
}
