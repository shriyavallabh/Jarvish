/**
 * WhatsApp Delivery Status Component
 * Real-time tracking of message delivery for the dashboard
 */

import React, { useState, useEffect } from 'react';
import { Check, Clock, X, AlertCircle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface MessageStatus {
  id: string;
  recipient: string;
  type: 'template' | 'text' | 'image' | 'document';
  templateName?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  error?: string;
}

interface DeliveryMetrics {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
}

export function WhatsAppDeliveryStatus() {
  const [messages, setMessages] = useState<MessageStatus[]>([]);
  const [metrics, setMetrics] = useState<DeliveryMetrics>({
    total: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    deliveryRate: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch message status from API
  const fetchMessageStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      
      setMessages(data.messages);
      calculateMetrics(data.messages);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  // Calculate delivery metrics
  const calculateMetrics = (msgs: MessageStatus[]) => {
    const total = msgs.length;
    const sent = msgs.filter(m => m.status === 'sent').length;
    const delivered = msgs.filter(m => m.status === 'delivered').length;
    const read = msgs.filter(m => m.status === 'read').length;
    const failed = msgs.filter(m => m.status === 'failed').length;
    
    const deliveryRate = total > 0 ? ((delivered + read) / total) * 100 : 0;
    
    setMetrics({
      total,
      sent,
      delivered,
      read,
      failed,
      deliveryRate
    });
  };

  // Send test message
  const sendTestMessage = async (type: 'template' | 'text' | 'image') => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          recipient: '919765071249',
          templateName: type === 'template' ? 'hubix_daily_insight' : undefined,
          content: type === 'text' ? 'Test message from Hubix dashboard' : undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add to messages list
        const newMessage: MessageStatus = {
          id: data.messageId,
          recipient: '919765071249',
          type,
          templateName: type === 'template' ? 'hubix_daily_insight' : undefined,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [newMessage, ...prev]);
        
        // Poll for status updates
        pollMessageStatus(data.messageId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for message status updates
  const pollMessageStatus = async (messageId: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/whatsapp/status/${messageId}`);
        const data = await response.json();
        
        // Update message status
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: data.status }
            : msg
        ));
        
        // Stop polling if delivered/read/failed or max attempts
        if (data.status === 'delivered' || 
            data.status === 'read' || 
            data.status === 'failed' ||
            attempts >= maxAttempts) {
          clearInterval(poll);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(poll);
      }
    }, 3000); // Poll every 3 seconds
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'read':
        return <Check className="h-4 w-4 text-green-700" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'secondary';
      case 'sent': return 'default';
      case 'delivered': return 'success';
      case 'read': return 'success';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMessageStatus();
    const interval = setInterval(fetchMessageStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.sent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.delivered}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.failed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.deliveryRate.toFixed(1)}%</div>
            <Progress value={metrics.deliveryRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => sendTestMessage('template')}
              disabled={isLoading}
            >
              Send Template
            </Button>
            <Button 
              onClick={() => sendTestMessage('text')}
              disabled={isLoading}
              variant="outline"
            >
              Send Text
            </Button>
            <Button 
              onClick={() => sendTestMessage('image')}
              disabled={isLoading}
              variant="outline"
            >
              Send Image
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages sent yet
              </div>
            ) : (
              messages.slice(0, 10).map((message) => (
                <div 
                  key={message.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(message.status)}
                    <div>
                      <div className="font-medium">
                        +91 {message.recipient.substring(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {message.type === 'template' ? message.templateName : message.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={getStatusColor(message.status) as any}>
                      {message.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template Status */}
      <Card>
        <CardHeader>
          <CardTitle>Template Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2">
              <span>hello_world</span>
              <Badge variant="success">Approved</Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span>hubix_daily_insight</span>
              <Badge variant="success">Approved</Badge>
            </div>
            <div className="flex justify-between items-center p-2">
              <span>daily_focus</span>
              <Badge variant="success">Approved</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}