import type { Product } from '@/lib/data/types';
import { Accordion } from '@/components/ui/Accordion';

interface ProductAccordionsProps {
  product: Product;
}

export function ProductAccordions({ product }: ProductAccordionsProps) {
  const items = [
    {
      id: 'about',
      title: 'About This Kit',
      content: (
        <div className="prose prose-sm prose-brown max-w-none">
          <p className="text-sm text-brown-soft leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      ),
    },
    product.howToPrepare.length > 0 && {
      id: 'how-to-prepare',
      title: 'How to Prepare',
      content: (
        <ol className="space-y-3">
          {product.howToPrepare.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-brown-soft">
              <span className="w-5 h-5 rounded-full bg-gold-wash text-brown text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      ),
    },
    product.whoIsItFor && {
      id: 'who-is-it-for',
      title: 'Who Is It For',
      content: (
        <p className="text-sm text-brown-soft leading-relaxed">{product.whoIsItFor}</p>
      ),
    },
    {
      id: 'shipping',
      title: 'Shipping Information',
      content: (
        <div className="space-y-2 text-sm text-brown-soft leading-relaxed">
          <p>We ship pan-India via our trusted courier partners.</p>
          <ul className="space-y-1 list-disc list-inside text-xs text-brown-muted">
            <li>Standard delivery: 3–6 business days</li>
            <li>Express delivery available at checkout (metro cities)</li>
            <li>Free shipping on orders above the free-delivery threshold</li>
            <li>Tracking details shared by email and WhatsApp after dispatch</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'returns',
      title: 'Returns & Exchanges',
      content: (
        <div className="space-y-2 text-sm text-brown-soft leading-relaxed">
          <p>
            We want every ritual to begin perfectly. If something arrives damaged or
            incorrect, please contact us within 48 hours of delivery with a photo and
            your order number.
          </p>
          <ul className="space-y-1 list-disc list-inside text-xs text-brown-muted">
            <li>Damaged items: full replacement or refund</li>
            <li>Wrong item shipped: exchanged at no cost</li>
            <li>Ritual kits cannot be returned once opened (hygiene and purity reasons)</li>
            <li>Support: reach us via WhatsApp or email</li>
          </ul>
        </div>
      ),
    },
  ].filter(Boolean) as { id: string; title: string; content: React.ReactNode }[];

  return <Accordion items={items} defaultOpen={['about']} />;
}
