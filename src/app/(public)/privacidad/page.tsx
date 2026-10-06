import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL_UPDATED_AT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad - Citero",
  description:
    "Cómo Citero recopila, usa y protege los datos personales de negocios, profesionales y clientes.",
};

const TOC = [
  "1. Responsable del tratamiento",
  "2. Datos que recopilamos",
  "3. Cómo usamos los datos",
  "4. Base legal",
  "5. Comunicaciones por email",
  "6. Proveedores que nos ayudan a operar",
  "7. Cookies y almacenamiento local",
  "8. Conservación de los datos",
  "9. Seguridad",
  "10. Tus derechos",
  "11. Menores de edad",
  "12. Cambios en esta política",
  "13. Contacto",
];

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      updatedAt={LEGAL_UPDATED_AT}
      toc={TOC}
    >
      <p className="text-body leading-body-lg text-slate-gray">
        Esta política explica qué datos personales recopila Citero, para qué
        los usamos y qué derechos tenés sobre ellos. Aplica a negocios,
        profesionales y clientes que usan la plataforma.
      </p>

      <LegalSection title="1. Responsable del tratamiento">
        <p>
          Citero es el responsable del tratamiento de los datos que se cargan
          en la plataforma. Para consultas sobre privacidad podés escribirnos a{" "}
          <a
            href="mailto:hola@citero.app"
            className="font-medium text-ink-navy underline decoration-hairline underline-offset-4 transition-colors hover:text-signal-blue"
          >
            hola@citero.app
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Datos que recopilamos">
        <p>Según cómo uses Citero, podemos tratar:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-ink-navy">Datos de cuenta:</strong>{" "}
            correo electrónico, contraseña (almacenada con hash) y teléfono
            opcional.
          </li>
          <li>
            <strong className="font-semibold text-ink-navy">Datos del negocio:</strong>{" "}
            nombre, dirección, teléfono, redes sociales, logo, portada y
            coordenadas para el mapa.
          </li>
          <li>
            <strong className="font-semibold text-ink-navy">Datos de turnos:</strong>{" "}
            servicio, profesional, fecha y hora, estado del turno y, para
            reservas de invitados, nombre, correo y teléfono.
          </li>
          <li>
            <strong className="font-semibold text-ink-navy">Datos técnicos:</strong>{" "}
            registros de acceso, dirección IP y datos del dispositivo,
            necesarios para la seguridad y el funcionamiento del servicio.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cómo usamos los datos">
        <p>Usamos los datos para:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Crear y administrar tu cuenta y tus negocios.</li>
          <li>Calcular la disponibilidad real y gestionar los turnos.</li>
          <li>
            Enviar confirmaciones, recordatorios y avisos de cancelación por
            email.
          </li>
          <li>Verificar la identidad de los clientes mediante códigos OTP.</li>
          <li>Prevenir el fraude y proteger la plataforma.</li>
          <li>Brindar soporte y responder consultas.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Base legal">
        <p>
          Tratamos los datos para ejecutar el contrato que aceptás al usar
          Citero, con tu consentimiento para las comunicaciones por email, y
          por interés legítimo en mantener la seguridad y mejorar el servicio.
        </p>
      </LegalSection>

      <LegalSection title="5. Comunicaciones por email">
        <p>
          Citero envía emails transaccionales: confirmación de turno, avisos de
          cancelación, recordatorios y códigos de verificación. Podés
          desactivar los recordatorios desde la configuración del negocio. Los
          avisos esenciales para el funcionamiento de la cuenta se envían
          siempre.
        </p>
      </LegalSection>

      <LegalSection title="6. Proveedores que nos ayudan a operar">
        <p>
          Para prestar el servicio nos apoyamos en proveedores que tratan datos
          por nuestra cuenta:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-ink-navy">Resend</strong> para
            el envío de correos electrónicos.
          </li>
          <li>
            <strong className="font-semibold text-ink-navy">Cloudinary</strong>{" "}
            para el almacenamiento de logos e imágenes de portada.
          </li>
          <li>
            <strong className="font-semibold text-ink-navy">
              Proveedores de infraestructura
            </strong>{" "}
            para el hosting de la aplicación y la base de datos.
          </li>
        </ul>
        <p>
          No vendemos ni cedemos tus datos a terceros con fines publicitarios.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies y almacenamiento local">
        <p>
          Usamos una cookie de sesión HttpOnly para mantener tu sesión iniciada
          de forma segura y para poder renovarla. No usamos cookies de
          publicidad ni de seguimiento entre sitios.
        </p>
      </LegalSection>

      <LegalSection title="8. Conservación de los datos">
        <p>
          Conservamos los datos mientras tu cuenta esté activa. Los códigos de
          verificación y los registros de sesión se eliminan o expiran en
          plazos cortos. Cuando eliminás tu cuenta, se borran tus datos
          personales y los de tus negocios, salvo aquello que debamos conservar
          por obligación legal.
        </p>
      </LegalSection>

      <LegalSection title="9. Seguridad">
        <p>
          Aplicamos medidas razonables para proteger la información: las
          contraseñas se almacenan con hash, las comunicaciones viajan por
          HTTPS y los accesos se validan con tokens de corta duración. Ningún
          sistema es infalible, por lo que te pedimos que cuides tus
          credenciales.
        </p>
      </LegalSection>

      <LegalSection title="10. Tus derechos">
        <p>
          Podés acceder, corregir, actualizar o eliminar tus datos personales
          desde la configuración de tu cuenta o escribiéndonos. También podés
          oponerte a ciertos tratamientos y solicitar la portabilidad de tu
          información. Responderemos tu pedido en los plazos que establece la
          normativa aplicable.
        </p>
      </LegalSection>

      <LegalSection title="11. Menores de edad">
        <p>
          Citero está dirigido a mayores de 18 años. No recopilamos
          deliberadamente datos de menores. Si detectamos una cuenta de un
          menor, procederemos a eliminarla.
        </p>
      </LegalSection>

      <LegalSection title="12. Cambios en esta política">
        <p>
          Podemos actualizar esta política para reflejar cambios en el servicio
          o en la normativa. Publicaremos la versión vigente en esta página con
          su fecha de actualización.
        </p>
      </LegalSection>

      <LegalSection title="13. Contacto">
        <p>
          Por cualquier duda sobre el tratamiento de tus datos, escribinos a{" "}
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
