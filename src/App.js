import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const BASE_URL = 'http://localhost:10000';

function normalizeWhatsAppNumber(number) {
  let n = number.trim().replace(/\D/g, '');
  if (n.startsWith('0')) n = '91' + n.slice(1);
  if (!n.startsWith('91')) n = '91' + n;
  return n;
}

function App() {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState(null);

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/whatsapp/status`);
      setIsConnected(res.data.ready === true);

      if (!res.data.ready) {
        const qrRes = await axios.get(`${BASE_URL}/whatsapp/qr`);
        setQrCode(qrRes.data.qr);
      } else {
        setQrCode(null);
      }
    } catch (err) {
      setIsConnected(false);
      setQrCode(null);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!number || !message) {
      toast.error('Please fill all fields');
      return;
    }

    if (!/^\d{10,15}$/.test(number)) {
      toast.error('Invalid phone number format');
      return;
    }

    setSending(true);
    try {
      const normalized = normalizeWhatsAppNumber(number);
      const res = await axios.post(`${BASE_URL}/whatsapp/send-test`, {
        number: normalized,
        message,
      });

      if (res.data?.success && res.data?.messageId) {
        toast.success(`✅ Message sent! ID: ${res.data.messageId}`);
        setMessage('');
      } else {
        toast.error('⚠️ Message send failed (server did not confirm)');
      }
    } catch (err) {
      toast.error('❌ Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="App">
      <ToastContainer />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className={`w-full max-w-md text-center py-2 rounded mb-4 ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isConnected ? '🟢 WhatsApp Connected' : '🔴 WhatsApp Not Connected'}
        </div>

        {!isConnected && qrCode && (
          <div className="mb-4">
            <p className="mb-2 text-sm text-gray-600">Scan QR to connect:</p>
            <img src={qrCode} alt="WhatsApp QR" className="w-64 h-64 border" />
          </div>
        )}

        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">📲 Send WhatsApp Message</h2>

          <form onSubmit={handleSend} className="space-y-4">
            <input
              type="text"
              placeholder="Phone number (e.g., 91XXXXXXXXXX)"
              value={number}
              autoFocus
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              rows="4"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={sending || !number || !message}
              className={`w-full py-2 rounded text-white transition duration-200 ease-in-out ${
                sending || !number || !message
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
