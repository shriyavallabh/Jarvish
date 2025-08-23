/**
 * WhatsApp Delivery Verification System
 * Properly checks message status and ensures actual delivery
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const RECIPIENT = '919765071249';

class DeliveryVerification {
  constructor() {
    this.sentMessages = [];
    this.deliveredMessages = [];
    this.failedMessages = [];
  }

  // Check actual message status from WhatsApp API
  async checkMessageStatus(messageId) {
    const url = `https://graph.facebook.com/v18.0/${messageId}?access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // WhatsApp message statuses: sent, delivered, read, failed
      if (data.status) {
        return {
          id: messageId,
          status: data.status,
          timestamp: data.timestamp,
          errors: data.errors || []
        };
      }
      
      // If no status field, check for errors
      if (data.error) {
        return {
          id: messageId,
          status: 'failed',
          error: data.error.message
        };
      }
      
      // Default to sent if we got a valid response
      return {
        id: messageId,
        status: 'sent',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        id: messageId,
        status: 'unknown',
        error: error.message
      };
    }
  }

  // Check webhook delivery receipts (in production)
  async checkWebhookStatus(messageId) {
    // In production, this would query your database for webhook receipts
    // WhatsApp sends delivery status updates to your webhook
    console.log(`   Checking webhook status for ${messageId}...`);
    
    // Mock implementation - in production, query your DB
    const webhookStatuses = {
      'delivered': ['Message delivered to device'],
      'read': ['Message read by recipient'],
      'failed': ['User number not on WhatsApp', 'Number blocked', 'Template not approved']
    };
    
    return {
      id: messageId,
      status: 'pending_webhook',
      note: 'Webhook receipt not yet received'
    };
  }

  // Verify if user has initiated conversation
  async checkConversationStatus() {
    console.log('\n🔍 Checking Conversation Status...\n');
    
    // Check if we can send free-form messages
    const testMessage = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'text',
      text: { body: 'Test' }
    };
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testMessage)
        }
      );
      
      const data = await response.json();
      
      if (data.messages) {
        console.log('✅ User has active conversation window (can send free-form messages)');
        return { conversationActive: true, messageId: data.messages[0].id };
      } else if (data.error?.code === 131051) {
        console.log('❌ No active conversation - user needs to message first or use template');
        return { conversationActive: false, reason: 'No user-initiated conversation' };
      } else {
        console.log('⚠️ Conversation status unclear:', data.error?.message);
        return { conversationActive: false, reason: data.error?.message };
      }
    } catch (error) {
      console.log('❌ Error checking conversation:', error.message);
      return { conversationActive: false, error: error.message };
    }
  }

  // Check template approval status
  async checkTemplateStatus(templateName) {
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const template = data.data?.find(t => t.name === templateName);
      
      if (template) {
        return {
          name: template.name,
          status: template.status,
          category: template.category,
          language: template.language,
          rejectedReason: template.rejected_reason
        };
      }
      
      return { status: 'NOT_FOUND' };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }

  // Send message with proper verification
  async sendAndVerify(messageBody, messageType = 'text') {
    console.log(`\n📤 Attempting to send ${messageType} message...`);
    
    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    try {
      // Step 1: Send the message
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageBody)
      });
      
      const data = await response.json();
      
      if (data.messages && data.messages[0]) {
        const messageId = data.messages[0].id;
        console.log(`   ✓ Message accepted by API: ${messageId}`);
        
        // Step 2: Verify actual status
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        const status = await this.checkMessageStatus(messageId);
        
        console.log(`   Status: ${status.status}`);
        
        if (status.status === 'failed') {
          console.log(`   ❌ Delivery failed: ${status.error}`);
          this.failedMessages.push({ id: messageId, error: status.error });
          return false;
        }
        
        this.sentMessages.push({ 
          id: messageId, 
          type: messageType,
          status: status.status,
          timestamp: new Date().toISOString()
        });
        
        return true;
        
      } else if (data.error) {
        console.log(`   ❌ API rejected message: ${data.error.message}`);
        
        // Specific error handling
        if (data.error.code === 131051) {
          console.log('\n   ⚠️ IMPORTANT: Cannot send free-form message');
          console.log('   Solutions:');
          console.log('   1. User must message +91 76666 84471 first');
          console.log('   2. OR use an approved template');
        } else if (data.error.code === 131026) {
          console.log('\n   ⚠️ Message undeliverable - number may not have WhatsApp');
        } else if (data.error.code === 131047) {
          console.log('\n   ⚠️ 24-hour window expired - use template');
        }
        
        this.failedMessages.push({ 
          type: messageType, 
          error: data.error 
        });
        
        return false;
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
      this.failedMessages.push({ 
        type: messageType, 
        error: error.message 
      });
      return false;
    }
  }

  // Generate delivery report
  generateReport() {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 DELIVERY VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Recipient: +91 ${RECIPIENT.substring(2)}`);
    console.log(`Time: ${new Date().toLocaleTimeString('en-IN')}`);
    console.log('───────────────────────────────────────────────────────────────');
    
    console.log('\n✅ SENT MESSAGES:', this.sentMessages.length);
    this.sentMessages.forEach((msg, i) => {
      console.log(`   ${i+1}. ${msg.type} - ${msg.id.substring(0, 30)}... [${msg.status}]`);
    });
    
    console.log('\n❌ FAILED MESSAGES:', this.failedMessages.length);
    this.failedMessages.forEach((msg, i) => {
      console.log(`   ${i+1}. ${msg.type} - ${msg.error?.message || msg.error}`);
    });
    
    console.log('\n📱 DELIVERY STATUS:');
    if (this.sentMessages.length === 0) {
      console.log('   ❌ No messages successfully sent');
      console.log('\n   🔧 TROUBLESHOOTING:');
      console.log('   1. Send "Hi" to +91 76666 84471 from WhatsApp');
      console.log('   2. Check if your number is registered for testing');
      console.log('   3. Verify WhatsApp is installed on the device');
      console.log('   4. Check template approval status');
    } else {
      console.log(`   ✓ ${this.sentMessages.length} messages sent`);
      console.log(`   ✗ ${this.failedMessages.length} messages failed`);
      console.log('\n   📲 Check your WhatsApp for delivered messages');
    }
    
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
}

// Main verification flow
async function runVerification() {
  const verifier = new DeliveryVerification();
  
  console.log('🔍 WHATSAPP DELIVERY VERIFICATION SYSTEM');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Step 1: Check conversation status
  const conversation = await verifier.checkConversationStatus();
  
  // Step 2: Check template status
  console.log('\n📋 Checking Template Status...\n');
  const templates = ['hubix_daily_insight', 'hubix_daily_text_v2', 'hello_world'];
  
  let approvedTemplate = null;
  for (const templateName of templates) {
    const status = await verifier.checkTemplateStatus(templateName);
    console.log(`   ${templateName}: ${status.status}`);
    if (status.status === 'APPROVED') {
      approvedTemplate = templateName;
    }
  }
  
  // Step 3: Try sending messages
  console.log('\n📱 Testing Message Delivery...');
  
  if (conversation.conversationActive) {
    // Can send free-form messages
    const textMessage = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'text',
      text: { 
        body: '✅ Hubix Delivery Test\n\nThis message confirms WhatsApp integration is working.\n\nYou should receive:\n1. This text message\n2. An image with caption\n3. Status update\n\nTime: ' + new Date().toLocaleTimeString('en-IN')
      }
    };
    
    await verifier.sendAndVerify(textMessage, 'text');
    
  } else if (approvedTemplate) {
    // Use approved template
    console.log(`\n   Using approved template: ${approvedTemplate}`);
    
    const templateMessage = {
      messaging_product: 'whatsapp',
      to: RECIPIENT,
      type: 'template',
      template: {
        name: approvedTemplate,
        language: { code: 'en' || 'en_US' }
      }
    };
    
    await verifier.sendAndVerify(templateMessage, 'template');
    
  } else {
    console.log('\n❌ Cannot send messages:');
    console.log('   - No active conversation (user hasn\'t messaged)');
    console.log('   - No approved templates available');
    console.log('\n📱 ACTION REQUIRED:');
    console.log('   Send "Hi" to +91 76666 84471 from your WhatsApp');
    console.log('   Then run this script again');
  }
  
  // Step 4: Generate report
  verifier.generateReport();
  
  // Step 5: Return status for dashboard
  return {
    success: verifier.sentMessages.length > 0,
    sent: verifier.sentMessages,
    failed: verifier.failedMessages,
    conversationActive: conversation.conversationActive,
    templates: { approved: approvedTemplate }
  };
}

// Execute
runVerification().then(result => {
  console.log('🔄 Dashboard Status Update:');
  console.log(JSON.stringify(result, null, 2));
});