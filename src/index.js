import { PdfViewer } from './PdfViewer';
import * as pdfjsLib from '../../pdf.js/src/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = '../../pdf.js/src/pdf.worker.js';

document.getElementById('open-pdf').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document
  .getElementById('file-input')
  .addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const pdfData = new Uint8Array(this.result);
        const pdfUrl = URL.createObjectURL(
          new Blob([pdfData], { type: 'application/pdf' })
        );
        document.getElementById('pdf-iframe').src = pdfUrl;

        try {
          Swal.fire({
            title: 'Extrayendo texto del PDF...',
            text: 'Por favor, espera.',
            icon: 'info',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          console.log('Cargando PDF...');
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          console.log('PDF cargado:', pdf);

          let text = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            console.log(`Extrayendo texto de la página ${i}...`);
            const textContent = await page.getTextContent();
            textContent.items.forEach((item) => {
              text += item.str + ' ';
            });
          }

          document.getElementById('extracted-text').value = text;
          Swal.close(); // Cerrar el mensaje de carga
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: `No se puede extraer el texto del PDF: ${error.message}`,
            icon: 'error',
          });
          console.error('Error extrayendo texto del PDF:', error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, selecciona un archivo PDF válido.',
        icon: 'error',
      });
      console.error('Please select a valid PDF file.');
    }
  });

// Función para mostrar mensajes al usuario
function showMessage(message, type) {
  const messageElement = document.getElementById('message');
  messageElement.textContent = message;
  messageElement.className = type; // 'loading' o 'error'
}

// Función para extraer texto del PDF
async function extractTextFromPDF(pdfFile) {
  try {
    Swal.fire({
      title: 'Extrayendo texto del PDF...',
      text: 'Por favor, espera.',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const pdf = await pdfjsLib.getDocument(pdfFile).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map((item) => item.str).join(' ');
    }

    document.getElementById('textArea').value = text;
    Swal.close(); // Cerrar el mensaje de carga
  } catch (error) {
    Swal.fire({
      title: 'Error',
      text: 'No se puede extraer el texto del PDF.',
      icon: 'error',
    });
    console.error('Error extrayendo texto del PDF:', error);
  }
}
