import nodemailer from 'nodemailer';
import path from 'path';

let testAccount;
let transporter;

// Inicializa Ethereal (Correo Fantasma) si no hay configuración real.
export async function initMailer() {
  // Simulador gratuito de SMTP para ver los mensajes en una web temporal
  testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // Generado automáticamente
      pass: testAccount.pass  // Generado automáticamente
    }
  });
  console.log('✉️  Ethereal Mailer Listo para pruebas de correos fantasma.');
}

export async function enviarAgradecimientoCliente(emailDestino) {
  try {
    let info = await transporter.sendMail({
      from: '"Agencia StandMatch" <hola@standmatch.com>', 
      to: emailDestino,
      subject: "¡Hemos recibido la petición de tu Stand! 🎉",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #00E1FF;">¡Hemos recibido tu Briefing!</h2>
          <p>Hola,</p>
          <p>Solo queríamos confirmarte que nuestro sistema ha registrado perfectamente todos los parámetros de tu próxima feria.</p>
          <p>En StandMatch nuestra especialidad es entregarte el <strong>Proyecto Completo</strong>. Para ello, tenemos a dos equipos trabajando en paralelo:</p>
          <ul>
            <li>Nuestros <strong>Arquitectos</strong> están generando los diseños 3D y redactando la Memoria Descriptiva de tu espacio.</li>
            <li>Nuestros <strong>Project Managers</strong> están realizando los cálculos técnicos para entregarte una Cotización estimada precisa.</li>
          </ul>
          <p>Son dos trabajos distintos pero compaginados. En menos de 8 horas laborables recibirás este Proyecto oficial en tu bandeja de correo.</p>
          <br/>
          <p>Un saludo,<br/>Equipo StandMatch V10</p>
        </div>
      `
    });
    console.log(`✉️ Carta Cliente [Enviada] MIRA CÓMO QUEDÓ AQUÍ -> %s`, nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error enviando correo a cliente: ', error);
  }
}

export async function enviarPdfAgencia(emailAgencia, pdfPath, nombreArchivo) {
  try {
    let info = await transporter.sendMail({
      from: '"Plataforma StandMatch" <bot@standmatch.com>', 
      to: emailAgencia,
      subject: "⚠️ NUEVO DOSSIER V10 DISPONIBLE",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h3>Notificación Interna de Agencia</h3>
          <p>Hola,</p>
          <p>Alguien acaba de volar por el briefing V10. Como administrador de la plataforma, te adjunto directamente el Dossier Renderizado Privado y el archivo JSON con los datos puros elegidos por el usuario, para que lo podáis chequear exactamente.</p>
        </div>
      `,
      attachments: [
        {
          filename: nombreArchivo,
          path: pdfPath
        },
        {
          filename: 'BriefingRaw_V10.json',
          content: arguments[3] || '{}', // buffer o string JSON
          contentType: 'application/json'
        }
      ]
    });
    console.log(`✉️ PDF Agencia [Enviado] MIRA CÓMO LLEGÓ EL PDF -> %s`, nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error enviando PDF a Agencia: ', error);
  }
}
