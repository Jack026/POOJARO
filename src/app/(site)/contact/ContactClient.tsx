'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Building,
  Package,
} from 'lucide-react';
import { toast } from '@/components/ui/toast-store';

const FAQS = [
  {
    q: 'How fast are POOJARO puja kits delivered?',
    a: 'All standard puja samagri orders and kits are dispatched within 24 business hours from our regional hubs. Metro deliveries typically arrive in 2–3 business days, while other locations take 3–5 business days.',
  },
  {
    q: 'Are your puja items 100% authentic and unadulterated?',
    a: 'Yes. Every batch of camphor is 100% pure pine-derived Bheemleni, our dhoop is hand-rolled without synthetic charcoal, and our brassware is crafted from virgin bell-metal and heavy brass by hereditary artisan cooperatives in India.',
  },
  {
    q: 'Can you customize a kit based on my Pandit-ji’s specific list?',
    a: 'Absolutely! Choose "Bulk & Custom Kits" above or select the "Ritual Finder" on the top navigation. You can also send us your priest’s handwritten samagri list via WhatsApp or this enquiry form.',
  },
  {
    q: 'What is your replacement or refund policy if brassware is damaged in transit?',
    a: 'We offer an immediate 100% transit guarantee. If an idol or ceramic item arrives damaged, simply notify us with a photo within 48 hours and we will dispatch a free replacement or issue a full refund immediately.',
  },
  {
    q: 'Do you offer customized gift packaging for weddings or corporate festivals?',
    a: 'Yes. We create bespoke velvet boxes, engraved brass plates, and sacred silver coins with personalized greetings for corporate gifting and wedding favours.',
  },
];

export function ContactClient() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'general';

  const [activeTab, setActiveTab] = useState<'general' | 'bulk' | 'corporate'>(
    initialType === 'bulk' ? 'bulk' : initialType === 'corporate' ? 'corporate' : 'general'
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'bulk') setActiveTab('bulk');
    if (type === 'corporate') setActiveTab('corporate');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          type: activeTab,
          organization: organization.trim(),
          quantity: quantity.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setSubmitted(true);
      toast.success('Message Received', {
        description: 'Our team will contact you within one business day.',
      });
      setName('');
      setEmail('');
      setPhone('');
      setOrganization('');
      setQuantity('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Contact Form & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Contact Details */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="eyebrow text-gold-deep mb-2 text-xs">Direct Support</p>
            <h2 className="font-display text-2xl md:text-3xl text-brown">We Are Here For You</h2>
            <p className="text-sm text-brown-soft mt-2 leading-relaxed">
              Have questions about an upcoming puja, auspicious dates, or customized ritual kits? Reach out to our devotional advisors directly.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-white border border-[#E8DDCF] shadow-2xs flex items-start gap-3.5">
              <div className="p-2 bg-gold/15 text-gold-deep rounded-lg shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold-deep block mb-0.5">
                  Email Support
                </span>
                <a
                  href="mailto:hello@poojaro.in"
                  className="text-sm font-medium text-brown hover:text-gold-deep transition-colors"
                >
                  hello@poojaro.in
                </a>
                <span className="text-xs text-brown-muted block mt-0.5">Response within 24 hours</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E8DDCF] shadow-2xs flex items-start gap-3.5">
              <div className="p-2 bg-gold/15 text-gold-deep rounded-lg shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold-deep block mb-0.5">
                  WhatsApp Helpline
                </span>
                <p className="text-sm font-medium text-brown">+91 98765 43210</p>
                <span className="text-xs text-brown-muted block mt-0.5">Instant messaging & samagri photos</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E8DDCF] shadow-2xs flex items-start gap-3.5">
              <div className="p-2 bg-gold/15 text-gold-deep rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold-deep block mb-0.5">
                  Business Hours
                </span>
                <p className="text-sm font-medium text-brown">Monday – Saturday: 9:00 AM – 7:00 PM IST</p>
                <span className="text-xs text-brown-muted block mt-0.5">Closed on select major sacred festivals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Tabbed Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8DDCF] p-6 md:p-8 shadow-card">
          {/* Tab Selector */}
          <div className="flex border-b border-[#E8DDCF] pb-4 mb-6 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('general');
                setSubmitted(false);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-gold-deep text-white shadow-2xs'
                  : 'bg-sand-soft/30 text-brown-muted hover:text-brown'
              }`}
            >
              General Support
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('bulk');
                setSubmitted(false);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'bulk'
                  ? 'bg-gold-deep text-white shadow-2xs'
                  : 'bg-sand-soft/30 text-brown-muted hover:text-brown'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Bulk Orders & Mandirs
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('corporate');
                setSubmitted(false);
              }}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'corporate'
                  ? 'bg-gold-deep text-white shadow-2xs'
                  : 'bg-sand-soft/30 text-brown-muted hover:text-brown'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Corporate & Festive Gifting
            </button>
          </div>

          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl text-brown">Enquiry Received</h3>
              <p className="text-xs sm:text-sm text-brown-soft max-w-md mx-auto leading-relaxed">
                Thank you for reaching out to POOJARO. Our devotional team has received your enquiry and will respond within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-5 py-2 bg-gold-deep text-white rounded-lg text-xs font-semibold hover:bg-gold-dark transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full bg-[#FAF8F5] border border-[#D9CBB9] rounded-lg px-3.5 py-2.5 text-sm text-brown focus:outline-none focus:border-gold-deep"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full bg-[#FAF8F5] border border-[#D9CBB9] rounded-lg px-3.5 py-2.5 text-sm text-brown focus:outline-none focus:border-gold-deep"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#FAF8F5] border border-[#D9CBB9] rounded-lg px-3.5 py-2.5 text-sm text-brown focus:outline-none focus:border-gold-deep"
                  />
                </div>
                {(activeTab === 'bulk' || activeTab === 'corporate') && (
                  <div>
                    <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                      Estimated Quantity / Units
                    </label>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 50 kits, 200 diyas"
                      className="w-full bg-[#FAF8F5] border border-[#D9CBB9] rounded-lg px-3.5 py-2.5 text-sm text-brown focus:outline-none focus:border-gold-deep"
                    />
                  </div>
                )}
              </div>

              {activeTab === 'corporate' && (
                <div>
                  <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Tata Consultancy Services, Infosys"
                    className="w-full bg-[#FAF8F5] border border-[#D9CBB9] rounded-lg px-3.5 py-2.5 text-sm text-brown focus:outline-none focus:border-gold-deep"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                  {activeTab === 'corporate'
                    ? 'Gifting Details & Occasion *'
                    : activeTab === 'bulk'
                    ? 'Kit Requirements & Mandir List *'
                    : 'Your Message *'}
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    activeTab === 'corporate'
                      ? 'Describe your upcoming festive gifting dates, custom branding preferences, and destination cities...'
                      : activeTab === 'bulk'
                      ? 'Tell us about your temple ceremony or list of custom samagri required in quantity...'
                      : 'How can our devotional team assist you today?'
                  }
                  className="w-full bg-[#FAF8F5] border border-[#D9CBB9] rounded-lg px-3.5 py-2.5 text-sm text-brown focus:outline-none focus:border-gold-deep"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gold-deep hover:bg-gold-dark text-white rounded-lg text-sm font-semibold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Transmitting Enquiry...' : 'Submit Enquiry'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Frequently Asked Questions (#faq) */}
      <section id="faq" className="scroll-mt-24 p-8 rounded-2xl bg-[#FAF6F0] border border-[#E8DDCF] space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <p className="eyebrow text-gold-deep mb-2 text-xs">Help & Answers</p>
          <h2 className="font-display text-2xl md:text-3xl text-brown">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-brown-muted mt-2">
            Everything you need to know about our sourcing purity, dispatch timelines, and custom samagri.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-[#E8DDCF]">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left font-display text-base font-semibold text-brown hover:text-gold-deep transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gold-deep shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-xs sm:text-sm text-brown-soft leading-relaxed pr-6">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
