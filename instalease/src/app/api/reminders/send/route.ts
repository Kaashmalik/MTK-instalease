/**
 * Automated Reminders API Route
 * 
 * Sends automated reminders for due installments via SMS, WhatsApp, and Email.
 * 
 * @module app/api/reminders/send/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

/**
 * Send SMS via Twilio
 */
async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio configuration missing');
      return false;
    }

    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone,
    });

    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
}

/**
 * Send WhatsApp via Twilio
 */
async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

    if (!accountSid || !authToken || !whatsappFrom) {
      console.error('Twilio WhatsApp configuration missing');
      return false;
    }

    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: `whatsapp:${phone}`,
    });

    return true;
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return false;
  }
}

/**
 * Send Email via Nodemailer
 */
async function sendEmail(to: string, subject: string, message: string): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
    });

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

/**
 * POST /api/reminders/send
 * Send reminders for due installments
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get installments due in next 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const twoDaysFromNowStr = twoDaysFromNow.toISOString().split('T')[0];

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayFromNowStr = oneDayFromNow.toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];

    // Get installments due in 2 days (SMS reminder)
    const { data: installments2Days, error: error2Days } = await supabase
      .from('installments')
      .select(`
        *,
        contracts!inner(
          contract_id,
          customers!inner(*),
          guarantors(*)
        )
      `)
      .eq('payment_status', 'pending')
      .eq('due_date', twoDaysFromNowStr);

    // Get installments due in 1 day (WhatsApp/Email reminder)
    const { data: installments1Day, error: error1Day } = await supabase
      .from('installments')
      .select(`
        *,
        contracts!inner(
          contract_id,
          customers!inner(*),
          guarantors(*)
        )
      `)
      .eq('payment_status', 'pending')
      .eq('due_date', oneDayFromNowStr);

    // Get overdue installments (escalation)
    const { data: overdueInstallments, error: errorOverdue } = await supabase
      .from('installments')
      .select(`
        *,
        contracts!inner(
          contract_id,
          customers!inner(*),
          guarantors(*)
        )
      `)
      .eq('payment_status', 'pending')
      .lt('due_date', today);

    if (error2Days || error1Day || errorOverdue) {
      return NextResponse.json(
        { error: 'Failed to fetch installments' },
        { status: 500 }
      );
    }

    const reminders = [];

    // Send SMS reminders (2 days before)
    for (const installment of installments2Days || []) {
      const contract = installment.contracts;
      const customer = contract?.customers;
      const guarantor = contract?.guarantors;

      if (customer?.phone) {
        const message = `Reminder: Your installment of PKR ${installment.amount_due.toLocaleString()} is due on ${installment.due_date}. Contract: ${contract?.product_name || 'N/A'}`;
        const sent = await sendSMS(customer.phone, message);

        reminders.push({
          contract_id: contract?.contract_id,
          installment_id: installment.installment_id,
          shop_id: installment.shop_id,
          reminder_type: 'sms',
          recipient_type: 'customer',
          delivery_status: sent ? 'sent' : 'failed',
          message,
        });
      }

      if (guarantor?.phone) {
        const message = `Reminder: Guarantee installment of PKR ${installment.amount_due.toLocaleString()} is due on ${installment.due_date}.`;
        const sent = await sendSMS(guarantor.phone, message);

        reminders.push({
          contract_id: contract?.contract_id,
          installment_id: installment.installment_id,
          shop_id: installment.shop_id,
          reminder_type: 'sms',
          recipient_type: 'guarantor',
          delivery_status: sent ? 'sent' : 'failed',
          message,
        });
      }
    }

    // Send WhatsApp/Email reminders (1 day before)
    for (const installment of installments1Day || []) {
      const contract = installment.contracts;
      const customer = contract?.customers;
      const guarantor = contract?.guarantors;

      if (customer?.phone) {
        const message = `Final Reminder: Your installment of PKR ${installment.amount_due.toLocaleString()} is due tomorrow (${installment.due_date}). Please make payment to avoid late fees.`;
        const whatsappSent = await sendWhatsApp(customer.phone, message);

        reminders.push({
          contract_id: contract?.contract_id,
          installment_id: installment.installment_id,
          shop_id: installment.shop_id,
          reminder_type: 'whatsapp',
          recipient_type: 'customer',
          delivery_status: whatsappSent ? 'sent' : 'failed',
          message,
        });
      }

      if (customer?.email) {
        const emailSent = await sendEmail(
          customer.email,
          'Installment Payment Reminder',
          message
        );

        reminders.push({
          contract_id: contract?.contract_id,
          installment_id: installment.installment_id,
          shop_id: installment.shop_id,
          reminder_type: 'email',
          recipient_type: 'customer',
          delivery_status: emailSent ? 'sent' : 'failed',
          message,
        });
      }
    }

    // Send escalation reminders for overdue
    for (const installment of overdueInstallments || []) {
      const contract = installment.contracts;
      const customer = contract?.customers;
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(installment.due_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (customer?.phone) {
        const message = `URGENT: Your installment of PKR ${installment.amount_due.toLocaleString()} is ${daysOverdue} day(s) overdue. Late fees may apply.`;
        const sent = await sendSMS(customer.phone, message);

        reminders.push({
          contract_id: contract?.contract_id,
          installment_id: installment.installment_id,
          shop_id: installment.shop_id,
          reminder_type: 'sms',
          recipient_type: 'customer',
          delivery_status: sent ? 'sent' : 'failed',
          message,
        });
      }
    }

    // Log all reminders
    if (reminders.length > 0) {
      await supabase.from('reminders_log').insert(reminders);
    }

    return NextResponse.json({
      success: true,
      remindersSent: reminders.length,
      details: reminders,
    });
  } catch (error) {
    console.error('Reminder sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

