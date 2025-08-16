import { Module, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule, MailService, Mailable } from '../dist';

// 1. File Attachment Mailable
class FileAttachmentMailable extends Mailable {
  constructor(private readonly invoiceData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Invoice with PDF Attachment')
      .view('invoice-email.hbs', this.invoiceData)
      .attach('./invoices/invoice-001.pdf', {
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
      })
      .attach('./images/logo.png', {
        filename: 'company-logo.png',
        contentType: 'image/png',
        cid: 'logo',
      });
    return super.build();
  }
}

// 2. Buffer/Data Attachment Mailable
class DataAttachmentMailable extends Mailable {
  constructor(private readonly reportData: any) {
    super();
    this.build();
  }

  protected build() {
    const csvData = this.generateCSVReport();
    const imageBuffer = this.generateChartImage();

    this.subject('Monthly Report with Data Attachments')
      .view('report-email.hbs', this.reportData)
      .attachData(csvData, 'monthly-report.csv', {
        contentType: 'text/csv',
      })
      .attachData(imageBuffer, 'chart.png', {
        contentType: 'image/png',
        cid: 'chart',
      });
    return super.build();
  }

  private generateCSVReport(): string {
    return 'Name,Sales,Region\nJohn,1000,North\nJane,1500,South\nBob,800,East';
  }

  private generateChartImage(): Buffer {
    // Simulate generating a chart image
    return Buffer.from('fake-image-data');
  }
}

// 3. Inline Image Mailable
class InlineImageMailable extends Mailable {
  constructor(private readonly newsletterData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Newsletter with Inline Images')
      .view('newsletter-inline.hbs', this.newsletterData)
      .attach('./images/header.jpg', {
        filename: false, // Don't show as attachment
        cid: 'header-image',
        contentType: 'image/jpeg',
      })
      .attach('./images/footer.png', {
        filename: false,
        cid: 'footer-image',
        contentType: 'image/png',
      });
    return super.build();
  }
}

// 4. Multiple Attachments Mailable
class MultipleAttachmentsMailable extends Mailable {
  constructor(private readonly projectData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Project Documents - Multiple Attachments')
      .view('project-email.hbs', this.projectData)
      .attach('./documents/project-proposal.pdf')
      .attach('./documents/technical-specs.docx')
      .attach('./documents/timeline.xlsx')
      .attachData(JSON.stringify(this.projectData, null, 2), 'project-data.json', { contentType: 'application/json' });
    return super.build();
  }
}

// 5. Attachment Service
@Injectable()
class AttachmentService {
  constructor(private readonly mailService: MailService) {}

  async sendInvoiceWithPDF() {
    const invoiceData = {
      invoiceNumber: 'INV-001',
      customerName: 'Alice Johnson',
      amount: 1250.0,
      dueDate: '2024-01-15',
    };

    const mailable = new FileAttachmentMailable(invoiceData);
    const sender = await this.mailService.to('alice@example.com');
    return await sender.send(mailable);
  }

  async sendReportWithCSV() {
    const reportData = {
      month: 'January 2024',
      totalSales: 15000,
      topPerformer: 'Jane Smith',
    };

    const mailable = new DataAttachmentMailable(reportData);
    const sender = await this.mailService.to('manager@example.com');
    return await sender.send(mailable);
  }

  async sendNewsletterWithInlineImages() {
    const newsletterData = {
      title: 'Monthly Newsletter',
      content: 'Check out our latest updates!',
      headerImageCid: 'header-image',
      footerImageCid: 'footer-image',
    };

    const mailable = new InlineImageMailable(newsletterData);
    const sender = await this.mailService.to('subscriber@example.com');
    return await sender.send(mailable);
  }

  async sendProjectDocuments() {
    const projectData = {
      projectName: 'Website Redesign',
      client: 'ABC Corp',
      startDate: '2024-02-01',
      documents: ['proposal', 'specs', 'timeline'],
    };

    const mailable = new MultipleAttachmentsMailable(projectData);
    const sender = await this.mailService.to('client@abccorp.com');
    return await sender.send(mailable);
  }

  async sendDynamicAttachment() {
    // Generate attachment content dynamically
    const csvContent = this.generateDynamicCSV();

    const content = {
      subject: 'Dynamic Report Generated',
      html: '<h1>Your report is ready!</h1><p>Please find the attached CSV file.</p>',
      attachments: [
        {
          content: csvContent,
          filename: `report-${new Date().toISOString().split('T')[0]}.csv`,
          contentType: 'text/csv',
        },
      ],
    };

    const sender = await this.mailService.to('recipient@example.com');
    return await sender.send(content);
  }

  private generateDynamicCSV(): string {
    const data = [
      ['Date', 'Sales', 'Profit'],
      ['2024-01-01', '1000', '200'],
      ['2024-01-02', '1200', '240'],
      ['2024-01-03', '900', '180'],
    ];

    return data.map((row) => row.join(',')).join('\n');
  }

  async demonstrateAllAttachmentTypes() {
    try {
      console.log('=== Attachment Examples ===');

      console.log('Sending invoice with PDF...');
      await this.sendInvoiceWithPDF();
      console.log('✓ Invoice email sent');

      console.log('Sending report with CSV data...');
      await this.sendReportWithCSV();
      console.log('✓ Report email sent');

      console.log('Sending newsletter with inline images...');
      await this.sendNewsletterWithInlineImages();
      console.log('✓ Newsletter email sent');

      console.log('Sending project documents...');
      await this.sendProjectDocuments();
      console.log('✓ Project documents sent');

      console.log('Sending dynamic attachment...');
      await this.sendDynamicAttachment();
      console.log('✓ Dynamic attachment sent');
    } catch (error) {
      console.error('Attachment example error:', error);
    }
  }
}

// 6. Module Setup
@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: 'smtp',
        mailers: {
          smtp: {
            transport: 'smtp',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: 'your-email@gmail.com',
              pass: 'your-app-password',
            },
          },
        },
        from: {
          address: 'attachments@example.com',
          name: 'Attachment Examples',
        },
      },
    }),
  ],
  providers: [AttachmentService],
})
class AttachmentModule {}

// 7. Example Runner
async function attachmentExample() {
  const app = await NestFactory.create(AttachmentModule);
  const attachmentService = app.get(AttachmentService);

  try {
    await attachmentService.demonstrateAllAttachmentTypes();
    console.log('✓ All attachment examples completed successfully!');
  } catch (error) {
    console.error('✗ Attachment example error:', error.message);
  }

  await app.close();
}

// Export for testing
export {
  attachmentExample,
  FileAttachmentMailable,
  DataAttachmentMailable,
  InlineImageMailable,
  MultipleAttachmentsMailable,
  AttachmentService,
  AttachmentModule,
};

// Run if called directly
if (require.main === module) {
  attachmentExample();
}
