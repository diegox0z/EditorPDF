// Importar las librerías
import * as pdfjsLib from 'pdfjs-dist'; // Librería para trabajar con documentos PDF
import nlp from 'compromise'; // Librería de JavaScript para procesamiento de lenguaje natural

// Configuración del trabajador (worker) de PDF.js para procesar los PDFs en segundo plano
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Variable global para almacenar el texto extraído del PDF
let currentText = '';

// Evento que se activa al hacer clic en el botón para abrir un archivo PDF
document.getElementById('open-pdf').addEventListener('click', () => {
  // Simula un clic en el input de tipo archivo para seleccionar un PDF
  document.getElementById('file-input').click();
});

// Evento que se activa al hacer clic en el botón de búsqueda
document.getElementById('search-text').addEventListener('click', () => {
  const searchInput = document.getElementById('search-input');

  // Muestra u oculta el campo de búsqueda dependiendo del estado actual (Está sacado de StackOverflow)
  searchInput.style.display =
    searchInput.style.display === 'none' ? 'block' : 'none';

  // Si se muestra el campo de búsqueda, enfócalo para que el usuario pueda escribir
  if (searchInput.style.display === 'block') {
    searchInput.focus();
  }
});

// Evento que se activa al escribir en el campo de búsqueda
document.getElementById('search-input').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase(); // Término de búsqueda en minúsculas
  const textArea = document.getElementById('extracted-text'); // Área de texto donde se muestra el contenido extraído del PDF
  const text = textArea.value; // Texto extraído del PDF

  // Si no hay término de búsqueda, vuelve a mostrar el texto original
  if (!searchTerm) {
    textArea.value = currentText;
    return;
  }

  // Usamos expresiones regulares para resaltar las coincidencias del término de búsqueda
  const regex = new RegExp(searchTerm, 'gi');
  const highlightedText = text.replace(regex, (match) => `[${match}]`);
  textArea.value = highlightedText;
});

// Evento que se activa al hacer clic en el botón para anonimizar el texto
document.getElementById('anonymize-text').addEventListener('click', () => {
  const textArea = document.getElementById('extracted-text');
  const text = textArea.value; // Texto extraído del PDF

  // Usamos la librería 'compromise' para procesar el texto y encontrar entidades nombradas (Comprobar anonimización)
  const doc = nlp(text);

  // Variable para almacenar el texto anonimizado
  let anonymizedText = text;

  // Reemplazamos los nombres de personas por '[NOMBRE]'
  doc.people().forEach((match) => {
    anonymizedText = anonymizedText.replace(match.text, '[NOMBRE]');
  });

  // Reemplazamos las ubicaciones por '[UBICACIÓN]'
  doc.places().forEach((match) => {
    anonymizedText = anonymizedText.replace(match.text, '[UBICACIÓN]');
  });

  // Reemplazamos las organizaciones por '[ORGANIZACIÓN]'
  doc.organizations().forEach((match) => {
    anonymizedText = anonymizedText.replace(match.text, '[ORGANIZACIÓN]');
  });

  // Reemplazamos los correos electrónicos por '[EMAIL]'
  anonymizedText = anonymizedText.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL]'
  );

  // Reemplazamos los números de teléfono por '[TELÉFONO]'
  anonymizedText = anonymizedText.replace(
    /(\+\d{1,3}[\s-])?\d{3}[\s-]\d{3}[\s-]\d{4}/g,
    '[TELÉFONO]'
  );

  // Reemplazamos los números de DNI/NIE (formato español) por '[DNI]'
  anonymizedText = anonymizedText.replace(/[0-9XYZ][0-9]{7}[A-Z]/gi, '[DNI]');

  // Actualizamos el área de texto con el texto anonimizado
  textArea.value = anonymizedText;
  currentText = anonymizedText; // Actualizamos el texto actual

  // Mostramos una alerta indicando que el texto ha sido anonimizado
  Swal.fire({
    title: 'Texto Anonimizado',
    text: 'El texto ha sido anonimizado exitosamente',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
  });
});

// Evento que se activa cuando el usuario selecciona un archivo PDF
document
  .getElementById('file-input')
  .addEventListener('change', async (event) => {
    const file = event.target.files[0]; // Obtenemos el archivo seleccionado
    if (file && file.type === 'application/pdf') {
      const fileReader = new FileReader(); // Creamos un lector de archivos
      fileReader.onload = async function () {
        const pdfData = new Uint8Array(this.result); // Leemos el archivo como un arreglo de bytes
        const pdfUrl = URL.createObjectURL(
          new Blob([pdfData], { type: 'application/pdf' })
        );
        document.getElementById('pdf-iframe').src = pdfUrl; // Establecemos la URL del PDF en un iframe

        try {
          // Mostramos un mensaje mientras extraemos el texto
          Swal.fire({
            title: 'Extrayendo texto del PDF...',
            text: 'Por favor, espera.',
            icon: 'info',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading(); // Mostramos un indicador de carga
            },
          });

          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise; // Cargamos el documento PDF
          let text = ''; // Variable para almacenar el texto extraído

          // Extraemos el texto de cada página del PDF
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            textContent.items.forEach((item) => {
              text += item.str + ' '; // Añadimos el texto de cada ítem
            });
          }

          // Actualizamos el texto extraído en el área de texto
          currentText = text;
          document.getElementById('extracted-text').value = text;
          Swal.close(); // Cerramos el mensaje de carga
        } catch (error) {
          // En caso de error, mostramos un mensaje de error
          Swal.fire({
            title: 'Error',
            text: `No se puede extraer el texto del PDF: ${error.message}`,
            icon: 'error',
          });
          console.error('Error extrayendo texto del PDF:', error);
        }
      };
      fileReader.readAsArrayBuffer(file); // Leemos el archivo como un ArrayBuffer
    } else {
      // Si el archivo no es un PDF, mostramos un mensaje de error
      Swal.fire({
        title: 'Error',
        text: 'Por favor, selecciona un archivo PDF válido.',
        icon: 'error',
      });
    }
  });

// Función para mostrar un mensaje en la interfaz
function showMessage(message, type) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = message; // Establecemos el mensaje
  messageElement.className = type; // Establecemos el tipo de mensaje (puede ser 'success', 'error', etc.)
}
