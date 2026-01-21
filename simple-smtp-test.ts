/**
 * Simple SMTP Test using native Node.js modules
 */

import 'dotenv/config';
import * as net from 'net';
import * as tls from 'tls';

async function testSMTPConnection() {
  console.log('🧪 Testing SMTP Connection to Brevo...\n');
  
  const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.BREVO_SMTP_PORT || '587');
  const user = process.env.BREVO_SMTP_USER || '';
  const pass = process.env.BREVO_SMTP_PASS || '';
  
  console.log('📋 Configuration:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Pass: ${pass ? '✅ Set' : '❌ Not set'}\n`);
  
  if (!user || !pass) {
    console.log('❌ SMTP credentials not configured');
    return;
  }
  
  return new Promise((resolve, reject) => {
    console.log('🔌 Connecting to SMTP server...');
    
    const socket = net.createConnection(port, host);
    let isConnected = false;
    
    socket.on('connect', () => {
      console.log('✅ Connected to SMTP server');
      isConnected = true;
    });
    
    socket.on('data', (data) => {
      const response = data.toString();
      console.log('📨 Server response:', response.trim());
      
      if (response.includes('220')) {
        console.log('✅ SMTP server is ready');
        socket.end();
        resolve(true);
      }
    });
    
    socket.on('error', (error) => {
      console.log('❌ SMTP connection error:', error.message);
      reject(error);
    });
    
    socket.on('close', () => {
      if (isConnected) {
        console.log('✅ SMTP connection test completed successfully');
      } else {
        console.log('❌ SMTP connection failed');
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!isConnected) {
        console.log('⏰ Connection timeout');
        socket.destroy();
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

// Test the connection
testSMTPConnection()
  .then(() => {
    console.log('\n🎉 SMTP server is reachable and working!');
    console.log('📧 You can now send emails using these credentials.');
  })
  .catch((error) => {
    console.log('\n❌ SMTP test failed:', error.message);
    console.log('🔧 Please check your SMTP credentials and network connection.');
  });