import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL_UPDATED_AT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos y condiciones - Citero",
  description:
    "Condiciones de uso de Citero, la plataforma de gestión de turnos y reservas para negocios de servicios.",
};

const TOC = [
  "1. Descripción del servicio",
  "2. Cuenta y registro",
  "3. Uso aceptable",
  "4. Reservas, cancelaciones y bloqueo de clientes",
  "5. Obligaciones de los negocios",
  "6. Pagos y cobros",
  "7. Propiedad intelectual",
  "8. Disponibilidad y cambios del servicio",
  "9. Limitación de responsabilidad",
  "10. Modificaciones de estos términos",
  "11. Ley aplicable y contacto",
];

export default function TerminosPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      updatedAt={LEGAL_UPDATED_AT}
      toc={TOC}
    >
      <p className="text-body leading-body-lg text-slate-gray">
        Estos términos regulan el uso de Citero, la plataforma de gestión de
        turnos y reservas para negocios de servicios. Al crear una cuenta, al
        reservar un turno o al usar cualquiera de nuestras funciones, aceptás
        lo que se describe a continuación.
      </p>

      <LegalSection title="1. Descripción del servicio">
        <p>
          Citero permite a los negocios publicar sus servicios, profesionales y
          horarios, y a los clientes reservar turnos de forma online. La
          plataforma también envía notificaciones y recordatorios por email,
          calcula la disponibilidad real de cada agenda y permite al negocio
          bloquear clientes para que no vuelvan a reservar.
        </p>
        <p>
          Citero no presta los servicios que se reservan. Cada negocio es el
          único responsable de los servicios que ofrece, de sus precios y de
          la atención a sus clientes.
        </p>
      </LegalSection>

      <LegalSection title="2. Cuenta y registro">
        <p>
          Para administrar un negocio necesitás crear una cuenta con un correo
          electrónico válido. Sos responsable de mantener la confidencialidad
          de tu contraseña y de toda la actividad que ocurra desde tu cuenta.
        </p>
        <p>
          Los datos que brindás deben ser exactos y estar actualizados. Si
          detectás un uso no autorizado de tu cuenta, avisanos a la brevedad.
        </p>
      </LegalSection>

      <LegalSection title="3. Uso aceptable">
        <p>Al usar Citero te comprometés a no:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Publicar información falsa o de terceros sin autorización.</li>
          <li>
            Usar la plataforma para enviar comunicaciones no solicitadas o
            contenido ilícito.
          </li>
          <li>
            Intentar acceder a cuentas, datos o sistemas a los que no tenés
            permiso.
          </li>
          <li>
            Afectar el funcionamiento del servicio, por ejemplo mediante
            automatizaciones abusivas o ataques.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Reservas, cancelaciones y bloqueo de clientes">
        <p>
          Cada negocio define cómo recibe reservas: de forma pública o con
          verificación de identidad por código OTP. También define cuántas horas
          antes del turno una cancelación se considera tardía.
        </p>
        <p>
          El negocio puede bloquear o desbloquear clientes para que no vuelvan a
          reservar. El bloqueo es una decisión del negocio y no reemplaza las
          políticas propias de cada negocio.
        </p>
      </LegalSection>

      <LegalSection title="5. Obligaciones de los negocios">
        <p>
          Si administrás un negocio en Citero, sos responsable de la veracidad
          de tu perfil, de los servicios y precios que publicás, del
          cumplimiento de tus horarios y de tratar los datos de tus clientes
          conforme a la normativa aplicable.
        </p>
      </LegalSection>

      <LegalSection title="6. Pagos y cobros">
        <p>
          Citero es una herramienta de gestión de turnos. No procesa pagos por
          los servicios reservados ni cobra señas por adelantado. El cobro se
          acuerda y se resuelve directamente entre el negocio y el cliente.
        </p>
      </LegalSection>

      <LegalSection title="7. Propiedad intelectual">
        <p>
          El nombre, el logo, el diseño y el código de Citero pertenecen a sus
          titulares. El contenido que cada negocio publica (textos, imágenes,
          precios) sigue siendo de su propiedad, y se usa únicamente para
          prestar el servicio.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidad y cambios del servicio">
        <p>
          Trabajamos para mantener el servicio disponible, pero puede
          interrumpirse por mantenimiento, actualizaciones o causas ajenas a
          nuestro control. Podemos modificar o discontinuar funciones con el
          objetivo de mejorar la plataforma.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitación de responsabilidad">
        <p>
          Citero se ofrece tal como está. En la medida permitida por la ley, no
          somos responsables por daños indirectos derivados del uso de la
          plataforma, ni por la relación entre negocios y clientes, incluidos
          cancelaciones, ausencias o incumplimientos.
        </p>
      </LegalSection>

      <LegalSection title="10. Modificaciones de estos términos">
        <p>
          Podemos actualizar estos términos para reflejar cambios en el
          servicio o en la normativa. Publicaremos la versión vigente en esta
          página con su fecha de actualización. El uso continuo de Citero
          implica la aceptación de la versión vigente.
        </p>
      </LegalSection>

      <LegalSection title="11. Ley aplicable y contacto">
        <p>
          Estos términos se rigen por las leyes de la República Argentina.
          Ante cualquier consulta sobre estas condiciones, escribinos a{" "}
          <a
            href="mailto:hola@citero.app"
            className="font-medium text-ink-navy underline decoration-hairline underline-offset-4 transition-colors hover:text-signal-blue"
          >
            hola@citero.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
