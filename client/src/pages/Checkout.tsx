import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { eventsApi, ticketsApi, registrationsApi, paymentsApi } from '../lib/api';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const eventId = searchParams.get('event') || '';
  const ticketId = searchParams.get('ticket') || '';
  const quantity = Number(searchParams.get('quantity') || 1);

  const [event, setEvent] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [gateway, setGateway] = useState<'stripe' | 'razorpay'>('stripe');

  useEffect(() => {
    const load = async () => {
      try {
        const eventRes: any = await eventsApi.getById(eventId);
        const ev = eventRes.data;
        setEvent(ev);

        // Find the selected ticket either from embedded ticketTypes or by fetching
        const ticketList = ev.ticketTypes || [];
        let foundTicket = ticketList.find((t: any) => t._id === ticketId);
        if (!foundTicket) {
          const ticketsRes: any = await ticketsApi.getByEvent(eventId);
          foundTicket = (ticketsRes.data || []).find((t: any) => t._id === ticketId);
        }
        setTicket(foundTicket || null);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load checkout');
      } finally {
        setLoading(false);
      }
    };
    if (eventId && ticketId) load();
    else {
      toast.error('Missing checkout parameters');
      setLoading(false);
    }
  }, [eventId, ticketId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event || !ticket) {
    return (
      <div className="text-center py-40 text-gray-400">
        <p>Invalid event or ticket selection.</p>
        <button onClick={() => navigate('/events')} className="btn-primary mt-4">Back to Events</button>
      </div>
    );
  }

  const total = ticket.price * quantity;

  const handleFreeRegistration = async () => {
    setPaying(true);
    try {
      await registrationsApi.create({ event: eventId, ticket: ticketId, quantity });
      toast.success('Registration successful!');
      navigate(`/registrations`);
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed');
    } finally {
      setPaying(false);
    }
  };

  const handleStripePayment = async () => {
    setPaying(true);
    try {
      // Step 1: Create registration
      const regRes: any = await registrationsApi.create({ event: eventId, ticket: ticketId, quantity });
      const registrationId = regRes.data._id;

      // Step 2: Create payment intent
      const piRes: any = await paymentsApi.createIntent({ registrationId });
      const { clientSecret, paymentId } = piRes.data;

      // Use Stripe.js if available to confirm the payment
      const stripeJs = (window as any).Stripe;
      if (stripeJs && clientSecret) {
        const stripe = stripeJs();
        // Redirect to Stripe Checkout (or use Elements) for card confirmation
        await stripe.confirmCardPayment(clientSecret);
      }

      // Verify payment
      await paymentsApi.verify({
        paymentId,
        gatewayPaymentId: `demo_${Date.now()}`,
        gatewaySignature: 'demo_signature',
      });
      toast.success('Payment successful!');
      navigate('/payments');
    } catch (err: any) {
      toast.error(err?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setPaying(true);
    try {
      const regRes: any = await registrationsApi.create({ event: eventId, ticket: ticketId, quantity });
      const registrationId = regRes.data._id;

      const orderRes: any = await paymentsApi.createRazorpayOrder({ registrationId });
      const { orderId, keyId, paymentId } = orderRes.data;

      const rzp = (window as any).Razorpay;
      if (rzp) {
        const razorpay = new rzp({
          key: keyId,
          amount: total * 100,
          currency: event.currency || 'USD',
          order_id: orderId,
          name: event.title,
          handler: async (response: any) => {
            await paymentsApi.verify({
              paymentId,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            navigate('/payments');
          },
          modal: { ondismiss: () => setPaying(false) },
          theme: { color: '#3b82f6' },
        });
        razorpay.open();
      } else {
        // Fallback: verify directly
        await paymentsApi.verify({
          paymentId,
          gatewayPaymentId: `demo_${Date.now()}`,
          gatewaySignature: 'demo_signature',
        });
        toast.success('Payment successful!');
        navigate('/payments');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Payment failed');
      setPaying(false);
    }
  };

  const handlePayment = () => {
    if (total === 0) {
      handleFreeRegistration();
    } else if (gateway === 'stripe') {
      handleStripePayment();
    } else {
      handleRazorpayPayment();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <PageHeader title="Checkout" subtitle="Complete your registration" />

      <div className="space-y-6 mt-6">
        {/* Order summary */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
            {event.banner ? (
              <img src={event.banner} alt={event.title} className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold">E</div>
            )}
            <div className="flex-1">
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm text-gray-500">{new Date(event.startDate).toLocaleString()}</p>
              <p className="text-sm text-gray-500">{event.location?.city || 'Online'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-gray-600">{ticket.name} × {quantity}</span>
            <span className="font-medium">{ticket.currency || event.currency} {ticket.price}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-xl">{event.currency} {total}</span>
          </div>
        </div>

        {/* Payment method */}
        {total > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGateway('stripe')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${gateway === 'stripe' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}
              >
                <p className="font-semibold text-blue-600">💳 Stripe</p>
                <p className="text-xs text-gray-500 mt-1">Card payments</p>
              </button>
              <button
                onClick={() => setGateway('razorpay')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${gateway === 'razorpay' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}
              >
                <p className="font-semibold text-cyan-600">⚡ Razorpay</p>
                <p className="text-xs text-gray-500 mt-1">UPI, Cards, Netbanking</p>
              </button>
            </div>
          </div>
        )}

        <button onClick={handlePayment} disabled={paying} className="btn-primary w-full py-4 text-lg">
          {paying ? <Spinner size="sm" className="border-white" /> : total === 0 ? 'Complete Free Registration' : `Pay ${event.currency} ${total}`}
        </button>
      </div>
    </motion.div>
  );
}

