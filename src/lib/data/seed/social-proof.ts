import type { Review, Testimonial } from '../types';
import { SEEDED_AT } from './products';

/**
 * ILLUSTRATIVE CONTENT — NOT REAL CUSTOMERS.
 *
 * Every record below carries `isDemo: true`, and the UI renders a visible
 * "Sample" label on anything so flagged: no seeded quote is ever presented as a
 * real customer's words, and no seeded rating is presented as a real average.
 * `verifiedPurchase` is false throughout, because none of these can be verified
 * — the badge renders only for reviews written against an actual delivered
 * order. Admin → Reviews has a "Remove sample content" action so the owner can
 * clear all of it in one step before launch.
 */

function daysBefore(days: number): string {
  const base = Date.parse(SEEDED_AT);
  return new Date(base - days * 86_400_000).toISOString();
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    quote:
      'The Griha Pravesh tray arrived with everything labelled, which meant the pandit could work through the vidhi without stopping to ask for things.',
    authorName: 'Ananya R.',
    city: 'Pune',
    rating: 5,
    verifiedPurchase: false,
    isDemo: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'testimonial-2',
    quote:
      'Ordered the Ganesh kit two days before Chaturthi and it came in time. The durva was fresh, which is the part I was worried about.',
    authorName: 'Mahesh K.',
    city: 'Mumbai',
    rating: 5,
    verifiedPurchase: false,
    isDemo: true,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'testimonial-3',
    quote:
      'The clay diyas have a deeper well than the ones I get locally, so they burned right through the evening on one filling.',
    authorName: 'Sunita D.',
    city: 'Jaipur',
    rating: 4,
    verifiedPurchase: false,
    isDemo: true,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'testimonial-4',
    quote:
      'I used the Ritual Finder because I had no idea what a Satyanarayan Katha needed. It suggested the family size and the reason it gave actually made sense.',
    authorName: 'Rakesh V.',
    city: 'Hyderabad',
    rating: 5,
    verifiedPurchase: false,
    isDemo: true,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'testimonial-5',
    quote:
      'The brass thali is unlacquered, so it darkens — which is what I wanted. It cleans up with tamarind in a minute.',
    authorName: 'Lakshmi N.',
    city: 'Chennai',
    rating: 5,
    verifiedPurchase: false,
    isDemo: true,
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'testimonial-6',
    quote:
      'Buying the tilak set together was cheaper than three packets and the glass vials have not caked in the monsoon.',
    authorName: 'Devika S.',
    city: 'Kochi',
    rating: 4,
    verifiedPurchase: false,
    isDemo: true,
    sortOrder: 6,
    isActive: true,
  },
];

interface ReviewDraft {
  productId: string;
  authorName: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  daysAgo: number;
  helpfulCount: number;
}

const DRAFTS: ReviewDraft[] = [
  {
    productId: 'kit-griha-pravesh',
    authorName: 'Ananya R.',
    city: 'Pune',
    rating: 5,
    title: 'Nothing missing on the day',
    body: 'We moved in on a Saturday and the ceremony was the same morning. Having the vials labelled meant I was not opening packets trying to work out which powder was which. The kalash is a proper copper one, not plated.',
    daysAgo: 12,
    helpfulCount: 9,
  },
  {
    productId: 'kit-griha-pravesh',
    authorName: 'Vikram J.',
    city: 'Bengaluru',
    rating: 4,
    title: 'Good kit, wanted more diyas',
    body: 'Nine diyas is what the vidhi says but our flat has more corners than that. Ordered a set of twelve separately. Everything else was accurate to the list.',
    daysAgo: 26,
    helpfulCount: 4,
  },
  {
    productId: 'kit-ganesh',
    authorName: 'Mahesh K.',
    city: 'Mumbai',
    rating: 5,
    title: 'Durva was actually fresh',
    body: 'This is the thing that goes wrong with kits ordered online. Three bundles arrived green and usable. Modak I made at home, so cannot comment there.',
    daysAgo: 8,
    helpfulCount: 14,
  },
  {
    productId: 'kit-ganesh',
    authorName: 'Priya M.',
    city: 'Nagpur',
    rating: 5,
    title: 'Lasted the full ten days',
    body: 'Camphor and agarbatti quantities were enough for an aarti every evening until visarjan. The aarti card was useful for the children.',
    daysAgo: 34,
    helpfulCount: 6,
  },
  {
    productId: 'kit-ganesh',
    authorName: 'Sameer T.',
    city: 'Indore',
    rating: 4,
    title: 'Idol not included, note that',
    body: 'The listing does say it, but I had assumed otherwise from the photo. We already had ours. The kit itself is well put together.',
    daysAgo: 51,
    helpfulCount: 11,
  },
  {
    productId: 'kit-lakshmi',
    authorName: 'Rohit A.',
    city: 'Delhi',
    rating: 5,
    title: 'Coins and lotus were the reason I bought it',
    body: 'Those two are hard to find near me before Diwali. Eleven diyas covered the altar and the doorway; I bought a second set of twelve for the balcony.',
    daysAgo: 19,
    helpfulCount: 8,
  },
  {
    productId: 'kit-lakshmi',
    authorName: 'Shalini G.',
    city: 'Lucknow',
    rating: 4,
    title: 'Wicks ran out before the diyas',
    body: 'Forty wicks sounds like a lot until you are relighting through the evening. Kit is otherwise complete and the mishri was good quality.',
    daysAgo: 41,
    helpfulCount: 5,
  },
  {
    productId: 'kit-satyanarayan',
    authorName: 'Rakesh V.',
    city: 'Hyderabad',
    rating: 5,
    title: 'The panchamrit set saved the morning',
    body: 'I did not know panchamrit needed five specific things until the booklet explained it. Having them portioned meant no last-minute run to the shop.',
    daysAgo: 15,
    helpfulCount: 12,
  },
  {
    productId: 'kit-satyanarayan',
    authorName: 'Meera P.',
    city: 'Ahmedabad',
    rating: 5,
    title: 'Gathering size was the right call',
    body: 'Fourteen people came. The family size would have been short on paan and mishri. Worth the extra for the larger box.',
    daysAgo: 29,
    helpfulCount: 7,
  },
  {
    productId: 'kit-shiv',
    authorName: 'Anil B.',
    city: 'Varanasi',
    rating: 5,
    title: 'Restrained, which is correct',
    body: 'No filler items added to make the box look full. Twenty-one bilva leaves, vibhuti, gangajal, mala. That is what Shiv puja needs and that is what came.',
    daysAgo: 22,
    helpfulCount: 10,
  },
  {
    productId: 'kit-durga',
    authorName: 'Riya C.',
    city: 'Kolkata',
    rating: 5,
    title: 'Quantities made for five days, not one',
    body: 'Most kits assume a single evening. Fifteen diyas and sixty wicks got us from Shashthi to Dashami with twice-daily aarti. Sindoor for the khela was plenty.',
    daysAgo: 17,
    helpfulCount: 13,
  },
  {
    productId: 'kit-navratri',
    authorName: 'Jyoti S.',
    city: 'Vadodara',
    rating: 5,
    title: 'Oil quantity was accurate',
    body: 'The jyot stayed lit all nine nights and there was oil left over. The long flat wicks are what makes the difference — I had been using round ones and refilling twice a night.',
    daysAgo: 24,
    helpfulCount: 9,
  },
  {
    productId: 'kit-havan',
    authorName: 'Deepak R.',
    city: 'Bhopal',
    rating: 4,
    title: 'Burned clean',
    body: 'Very little smoke compared to the loose samagri I used to buy. One kit did a forty-minute havan with the samidha included. Ghee portion is small but adequate.',
    daysAgo: 31,
    helpfulCount: 6,
  },
  {
    productId: 'sam-agarbatti',
    authorName: 'Nandini K.',
    city: 'Mysuru',
    rating: 5,
    title: 'Scent holds to the end of the stick',
    body: 'Machine-made ones lose it halfway. The loban is strong, the mogra is gentler. Ninety sticks lasted about six weeks with daily use.',
    daysAgo: 11,
    helpfulCount: 15,
  },
  {
    productId: 'sam-agarbatti',
    authorName: 'Farhan Q.',
    city: 'Bhopal',
    rating: 4,
    title: 'Good, sleeve could be better',
    body: 'The card sleeve tore after a couple of weeks and I moved them to a tin. Incense itself is genuinely low-smoke.',
    daysAgo: 38,
    helpfulCount: 3,
  },
  {
    productId: 'sam-diya-clay',
    authorName: 'Sunita D.',
    city: 'Jaipur',
    rating: 4,
    title: 'Soak them first',
    body: 'The instructions say to soak for twenty minutes and they are right — I skipped it on the first four and they drank all the oil. Deep wells, flat bases, no wobbling on the parapet.',
    daysAgo: 20,
    helpfulCount: 18,
  },
  {
    productId: 'sam-diya-clay',
    authorName: 'Harish L.',
    city: 'Surat',
    rating: 5,
    title: 'Two arrived cracked, replaced quickly',
    body: 'Clay in transit, it happens. Support sent two more within the week without argument. The other ten were fine.',
    daysAgo: 45,
    helpfulCount: 7,
  },
  {
    productId: 'sam-thali',
    authorName: 'Lakshmi N.',
    city: 'Chennai',
    rating: 5,
    title: 'Heavier than expected, in a good way',
    body: 'Real brass with hand engraving, and the bowls sit in the recesses instead of sliding. It has darkened in three months and tamarind brings it back. Bought a second as a wedding gift.',
    daysAgo: 27,
    helpfulCount: 16,
  },
  {
    productId: 'sam-tilak-set',
    authorName: 'Devika S.',
    city: 'Kochi',
    rating: 4,
    title: 'Glass vials survive the monsoon',
    body: 'Paper packets cake solid here within a fortnight. These have not. Chandan is fragrant; the roli is a slightly deeper red than I am used to.',
    daysAgo: 33,
    helpfulCount: 8,
  },
  {
    productId: 'sam-kumkum',
    authorName: 'Anita W.',
    city: 'Nashik',
    rating: 5,
    title: 'Takes a clean tilak',
    body: 'Milled fine enough not to crumble, and it has not faded by evening. Screw-top jar is more practical than the packets.',
    daysAgo: 14,
    helpfulCount: 5,
  },
  {
    productId: 'sam-camphor',
    authorName: 'Gopal S.',
    city: 'Coimbatore',
    rating: 5,
    title: 'No residue in the stand',
    body: 'Burns off completely. The cheaper tablets leave a grey film that has to be scraped. Reseal the pack though, or it evaporates.',
    daysAgo: 23,
    helpfulCount: 11,
  },
  {
    productId: 'sam-kalash',
    authorName: 'Ramesh I.',
    city: 'Nagpur',
    rating: 5,
    title: 'Coconut sits steady',
    body: 'The flared rim is the detail that matters — on my old kalash the coconut rocked whenever anyone walked past. Seamless base, no leaking.',
    daysAgo: 36,
    helpfulCount: 9,
  },
  {
    productId: 'sam-akshat',
    authorName: 'Kavita B.',
    city: 'Raipur',
    rating: 5,
    title: 'Actually unbroken',
    body: 'This is the whole point of akshat and bulk rice never manages it. Two hundred grams has covered four pujas so far.',
    daysAgo: 18,
    helpfulCount: 6,
  },
  {
    productId: 'sam-wick',
    authorName: 'Suresh M.',
    city: 'Patna',
    rating: 5,
    title: 'No soot on the diya rim',
    body: 'Pure cotton, no synthetic core, and it shows. A hundred to a pack at this price is the best value on the site.',
    daysAgo: 21,
    helpfulCount: 12,
  },
  {
    productId: 'sam-garland',
    authorName: 'Neha F.',
    city: 'Thane',
    rating: 4,
    title: 'Arrived fresh, held three days',
    body: 'Misted it as instructed and it was still good on the third morning. Order it for the date of the puja, not in advance.',
    daysAgo: 9,
    helpfulCount: 4,
  },
  {
    productId: 'sam-mishri',
    authorName: 'Prakash H.',
    city: 'Rajkot',
    rating: 5,
    title: 'No thread through the middle',
    body: 'Most mishri has cotton running through it. This does not, which matters if you are offering it. Faintly amber rather than bleached white.',
    daysAgo: 30,
    helpfulCount: 7,
  },
];

export const REVIEWS: Review[] = DRAFTS.map((d, i) => ({
  id: `review-${String(i + 1).padStart(3, '0')}`,
  productId: d.productId,
  userId: null,
  authorName: d.authorName,
  city: d.city,
  rating: d.rating,
  title: d.title,
  body: d.body,
  photos: [],
  verifiedPurchase: false,
  isDemo: true,
  status: 'published',
  helpfulCount: d.helpfulCount,
  createdAt: daysBefore(d.daysAgo),
}));
