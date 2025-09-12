import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@eduplatform.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  // Welcome email template
  async sendWelcomeEmail(user: { name: string; email: string; role: string }): Promise<void> {
    const html = this.getWelcomeEmailTemplate(user);
    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to EduPlatform!',
      html,
    });
  }

  // Account approval email template
  async sendApprovalEmail(user: { name: string; email: string; role: string }): Promise<void> {
    const html = this.getApprovalEmailTemplate(user);
    await this.sendEmail({
      to: user.email,
      subject: 'Your Account Has Been Approved!',
      html,
    });
  }

  // Password reset email template
  async sendPasswordResetEmail(user: { name: string; email: string }, resetToken: string): Promise<void> {
    const html = this.getPasswordResetEmailTemplate(user, resetToken);
    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
    });
  }

  // Course enrollment email template
  async sendCourseEnrollmentEmail(
    user: { name: string; email: string },
    course: { name: string; description: string; tutor: string }
  ): Promise<void> {
    const html = this.getCourseEnrollmentEmailTemplate(user, course);
    await this.sendEmail({
      to: user.email,
      subject: `You've been enrolled in ${course.name}`,
      html,
    });
  }

  // Assignment notification email template
  async sendAssignmentNotificationEmail(
    user: { name: string; email: string },
    assignment: { title: string; course: string; dueDate: string }
  ): Promise<void> {
    const html = this.getAssignmentNotificationEmailTemplate(user, assignment);
    await this.sendEmail({
      to: user.email,
      subject: `New Assignment: ${assignment.title}`,
      html,
    });
  }

  // Test notification email template
  async sendTestNotificationEmail(
    user: { name: string; email: string },
    test: { title: string; course: string; dueDate: string }
  ): Promise<void> {
    const html = this.getTestNotificationEmailTemplate(user, test);
    await this.sendEmail({
      to: user.email,
      subject: `Upcoming Test: ${test.title}`,
      html,
    });
  }

  // Email templates
  private getWelcomeEmailTemplate(user: { name: string; email: string; role: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EduPlatform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EduPlatform!</h1>
            <p>Your educational journey starts here</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>Welcome to EduPlatform! We're excited to have you join our educational community as a ${user.role}.</p>
            <p>Your account is currently pending approval. You'll receive an email notification once your account is activated.</p>
            <p>In the meantime, you can explore our platform and learn more about the features available to you.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">Visit Platform</a>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>The EduPlatform Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getApprovalEmailTemplate(user: { name: string; email: string; role: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - EduPlatform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Approved!</h1>
            <p>You're all set to start learning</p>
          </div>
          <div class="content">
            <h2>Congratulations ${user.name}!</h2>
            <p>Great news! Your account has been approved and you can now access all features of EduPlatform as a ${user.role}.</p>
            <p>You can now:</p>
            <ul>
              <li>Access your dashboard</li>
              <li>View and manage your courses</li>
              <li>Connect with other users</li>
              <li>Start your educational journey</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">Access Dashboard</a>
            <p>If you have any questions, our support team is here to help!</p>
            <p>Best regards,<br>The EduPlatform Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(user: { name: string; email: string }, resetToken: string): string {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - EduPlatform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Reset your password securely</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>We received a request to reset your password for your EduPlatform account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you didn't request this password reset, please ignore this email or contact our support team.</p>
            <p>Best regards,<br>The EduPlatform Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getCourseEnrollmentEmailTemplate(
    user: { name: string; email: string },
    course: { name: string; description: string; tutor: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Enrollment - EduPlatform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .course-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Course Enrollment</h1>
            <p>You've been enrolled in a new course</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>Great news! You've been enrolled in a new course.</p>
            <div class="course-info">
              <h3>${course.name}</h3>
              <p><strong>Description:</strong> ${course.description}</p>
              <p><strong>Tutor:</strong> ${course.tutor}</p>
            </div>
            <p>You can now access course materials, participate in discussions, and track your progress.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/courses" class="button">View Course</a>
            <p>Happy learning!</p>
            <p>Best regards,<br>The EduPlatform Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getAssignmentNotificationEmailTemplate(
    user: { name: string; email: string },
    assignment: { title: string; course: string; dueDate: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Assignment - EduPlatform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff9a56; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .assignment-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 New Assignment</h1>
            <p>You have a new assignment to complete</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>You have a new assignment in one of your courses.</p>
            <div class="assignment-info">
              <h3>${assignment.title}</h3>
              <p><strong>Course:</strong> ${assignment.course}</p>
              <p><strong>Due Date:</strong> ${assignment.dueDate}</p>
            </div>
            <p>Make sure to submit your assignment before the due date to avoid any penalties.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/assignments" class="button">View Assignment</a>
            <p>Good luck with your assignment!</p>
            <p>Best regards,<br>The EduPlatform Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTestNotificationEmailTemplate(
    user: { name: string; email: string },
    test: { title: string; course: string; dueDate: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upcoming Test - EduPlatform</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #a8edea; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .test-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Upcoming Test</h1>
            <p>You have a test scheduled</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>This is a reminder that you have a test coming up.</p>
            <div class="test-info">
              <h3>${test.title}</h3>
              <p><strong>Course:</strong> ${test.course}</p>
              <p><strong>Date:</strong> ${test.dueDate}</p>
            </div>
            <p>Make sure to review your course materials and prepare well for the test.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tests" class="button">View Test Details</a>
            <p>Good luck with your test!</p>
            <p>Best regards,<br>The EduPlatform Team</p>
          </div>
          <div class="footer">
            <p>© 2024 EduPlatform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();