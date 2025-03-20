import * as pdfjsLib from 'pdfjs-dist';

export const PdfViewer = {
  load(pdfData) {
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    loadingTask.promise
      .then((pdf) => {
        pdf
          .getPage(1)
          .then((page) => {
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.getElementById('pdf-canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            page
              .render(renderContext)
              .promise.then(() => {
                console.log('Page rendered');
              })
              .catch((error) => {
                console.error('Error rendering page:', error);
              });
          })
          .catch((error) => {
            console.error('Error getting page:', error);
          });
      })
      .catch((error) => {
        console.error('Error loading PDF:', error);
      });
  },
};
