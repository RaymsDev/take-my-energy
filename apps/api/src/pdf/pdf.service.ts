import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PassThrough } from 'stream';

export interface GiftCardPdfParams {
  serviceName: string;
  recipientName: string;
  senderName: string;
  code: string;
  qrUrl: string;
}

@Injectable()
export class PdfService {
  async generateGiftCardPdf(params: GiftCardPdfParams): Promise<Buffer> {
    const { serviceName, recipientName, senderName, code, qrUrl } = params;

    const qrBuffer = await QRCode.toBuffer(qrUrl, { type: 'png', width: 150 });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const pass = new PassThrough();
      const chunks: Buffer[] = [];

      pass.on('data', (chunk: Buffer) => chunks.push(chunk));
      pass.on('end', () => resolve(Buffer.concat(chunks)));
      pass.on('error', reject);

      doc.pipe(pass);

      // Header
      doc
        .fontSize(20)
        .fillColor('#4f46e5')
        .font('Helvetica-Bold')
        .text('Cinq de Cœur', { align: 'center' });

      doc.moveDown(0.5);
      doc
        .fontSize(14)
        .fillColor('#1e1b4b')
        .font('Helvetica-Bold')
        .text('Carte Cadeau', { align: 'center' });

      doc.moveDown(1);

      // Service block
      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text('Prestation :', { align: 'center' });
      doc
        .fontSize(16)
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .text(serviceName, { align: 'center' });

      doc.moveDown(1);

      // Recipient / sender
      doc
        .fontSize(10)
        .fillColor('#374151')
        .font('Helvetica')
        .text(`Offert à : ${recipientName}`, { align: 'center' });
      doc.text(`Par : ${senderName}`, { align: 'center' });

      doc.moveDown(1);

      // Code block
      doc
        .fontSize(10)
        .fillColor('#6366f1')
        .font('Helvetica')
        .text('Code cadeau :', { align: 'center' });
      doc
        .fontSize(18)
        .fillColor('#1e1b4b')
        .font('Courier-Bold')
        .text(code, { align: 'center' });

      doc.moveDown(1);

      // QR code
      doc
        .fontSize(9)
        .fillColor('#9ca3af')
        .font('Helvetica')
        .text('Scannez pour découvrir votre soin', { align: 'center' });

      doc.moveDown(0.3);
      const pageWidth = doc.page.width - 2 * 40;
      const qrSize = 100;
      const qrX = 40 + (pageWidth - qrSize) / 2;
      doc.image(qrBuffer, qrX, doc.y, { width: qrSize });

      doc.end();
    });
  }
}
