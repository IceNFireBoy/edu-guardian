import sendEmailUtil from '../../utils/sendEmail';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('sendEmailUtil', () => {
  const mockSendMail = jest.fn();
  const mockCreateTransport = jest.fn().mockReturnValue({
    sendMail: mockSendMail
  });

  beforeEach(() => {
    (nodemailer.createTransport as jest.Mock) = mockCreateTransport;
    mockSendMail.mockClear();
    
    // Set required environment variables
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_EMAIL = 'test@example.com';
    process.env.SMTP_PASSWORD = 'password123';
    process.env.FROM_NAME = 'Test Sender';
    process.env.FROM_EMAIL = 'sender@example.com';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_EMAIL;
    delete process.env.SMTP_PASSWORD;
    delete process.env.FROM_NAME;
    delete process.env.FROM_EMAIL;
  });

  it('should send email successfully', async () => {
    const emailData = {
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test message'
    };

    mockSendMail.mockResolvedValueOnce({ messageId: '123' });

    await expect(sendEmailUtil(emailData)).resolves.not.toThrow();
    expect(mockSendMail).toHaveBeenCalledWith({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: emailData.email,
      subject: emailData.subject,
      text: emailData.message
    });
  });

  it('should handle email sending failure', async () => {
    const emailData = {
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test message'
    };

    const error = new Error('Failed to send email');
    mockSendMail.mockRejectedValueOnce(error);

    await expect(sendEmailUtil(emailData)).rejects.toThrow('Failed to send email');
  });

  it('should validate required email fields', async () => {
    const invalidEmailData = {
      email: '',
      subject: 'Test Subject',
      message: 'Test message'
    };

    await expect(sendEmailUtil(invalidEmailData)).rejects.toThrow();
  });

  it('should handle missing environment variables', async () => {
    delete process.env.SMTP_HOST;

    const emailData = {
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test message'
    };

    await expect(sendEmailUtil(emailData)).rejects.toThrow('Email service is not properly configured');
  });
}); 