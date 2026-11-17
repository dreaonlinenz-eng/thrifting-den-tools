/* ==========================================================================
   The Thrifting Den — Sell With Us pre-booking questionnaire (CONTENT FILE)
   --------------------------------------------------------------------------
   This is the only file you need to edit to change questions, answers,
   messages, links or which answers let a customer continue.

   OUTCOMES
     green = meets the requirement, auto-advances
     amber = shows the message; customer acknowledges and must pick again
     red   = stop message; customer can't continue until they change answer

   Each question can have a `note` (shown under the question) and `buttons`.
   After the last question there is a "reminders" page (nothing to answer).

   BUTTONS use "link" keys defined in `links` just below, so a URL only ever
   needs fixing in one place.

   When you edit wording/questions, change `version` (e.g. SWU-2026-11-05-a).
   The version is saved on every order so you know which wording was agreed.
   Changing the version also clears any half-finished answers saved in a
   customer's browser.
   ========================================================================== */
window.TD_QUESTIONNAIRES = window.TD_QUESTIONNAIRES || {};

window.TD_QUESTIONNAIRES.swu = {
  key: 'swu',
  version: 'SWU-2026-11-17-b',
  serviceName: 'Sell With Us',
  serviceCode: 'SWU',
  progressWord: 'Step',
  shuffleOptions: false,

  links: {
    cco:           { url: '/pages/closet-cashout' },
    quiz:          { url: '/pages/which-service-quiz' },
    swuBrands:     { url: '/pages/accepted-brands-list' },
    swuInfo:       { url: '/pages/sell-with-us' },
    contact:       { url: '/pages/contact-us' },
    conditions:    { url: '/pages/condition-definitions' },
    garageSale:    { url: '/pages/seconds-garage-sale' }
  },

  intro: {
    title: 'Let’s make sure you’re ready to book!',
    paragraphs: [
      'Please take 2 minutes to complete this quick check before you book. It makes sure you’ve read our requirements and that your clothing is a good fit for Sell With Us, so you can book with confidence.',
      'This check goes with our full Sell With Us page, so please read that page first, then come back here.'
    ],
    buttons: [{ label: 'Read the Sell With Us page', link: 'swuInfo' }],
    fullDetails: { before: 'Full details are on the ', label: 'Sell With Us page', link: 'swuInfo' },
    note: 'Please take your time and answer every question honestly. Your answers help us make sure Sell With Us is the right fit for you and your clothing, and help your booking run smoothly.',
    startLabel: 'Start the check'
  },

  /* Shown first, before the returning-consignor question, to everyone (including returning consignors).
     They must tick the box to continue. Remove this whole block to switch the page off. */
  timing: {
    title: '🎄 Christmas & New Year update',
    paragraphs: [
      'As we head into the quieter Christmas and summer holiday period, new consignments will be processed behind the scenes in December, however <strong>new items won’t go live until early–mid January 2027 (date TBC).</strong>',
      'This helps give your items the best opportunity to sell once the holiday period has passed.'
    ],
    ackLabel: 'I understand that new items won’t go live until early–mid January 2027 (date TBC).',
    buttonLabel: 'Continue'
  },

  returning: {
    title: 'Quick question first',
    prompt: 'Have you sent us a Sell With Us consignment in the last 6 months?',
    note: 'Heads up: we check this answer against your order history. If the details don\u2019t match, we will need to pause or decline your booking until the check is completed.',
    options: [
      { id: 'A', skip: true,
        text: 'Yes, I’ve consigned with Sell With Us in the last 6 months.',
        record: 'Yes, consigned with Sell With Us in the last 6 months (self-declared)' },
      { id: 'B',
        text: 'No, my last consignment was more than 6 months ago.',
        record: 'No, last consignment was more than 6 months ago' },
      { id: 'C',
        text: 'No, this will be my first time.',
        record: 'No, first time' }
    ],
    skip: {
      title: 'Welcome back!',
      message: 'As you’ve consigned with us recently, you can skip the check. Our Accepted Brands List and requirements can change though, so it’s worth a quick look before you pack.',
      buttons: [{ label: 'View Sell With Us Accepted Brands List', link: 'swuBrands' }],
      buttonLabel: 'Continue to booking'
    }
  },

  /* Shown instead of the booking button when the booking product is sold out.
     To add a subscribe / back-in-stock button, add a link key (e.g. subscribe: { url: '...' }) to `links`
     and uncomment the button line below. */
  soldOut: {
    message: '<strong>Sell With Us spots are currently sold out.</strong> Subscribe to be the first to know when spots are back in stock.'
    // button: { label: 'Notify me when spots are back', link: 'subscribe' }
  },

  /* Pop-ups opened by buttons that use  popup: 'key'  instead of  link: 'key' */
  popups: {
    conditions: {
      title: 'Condition definitions',
      message: '<p>Sell With Us needs items in <strong>excellent used condition (EUC) or better</strong>. Here’s how we define each grade:</p>' +
        '<ul>' +
        '<li><strong>BNWT:</strong> brand new with tag.</li>' +
        '<li><strong>BNWOT:</strong> brand new without tag.</li>' +
        '<li><strong>Like New:</strong> looks pretty much new, maybe worn once or twice, with extremely minimal to no signs of wear.</li>' +
        '<li><strong>EUC:</strong> excellent used condition. You can tell it isn’t brand new, but it has minimal defects (if any) and no holes or marks.</li>' +
        '<li><strong>VGUC:</strong> very good used condition. More signs of wear, such as brushing, a small or light mark or a teeny hole.</li>' +
        '<li><strong>GUC:</strong> good used condition. Noticeable wear, such as a few marks, a small hole or wash fading.</li>' +
        '<li><strong>Play:</strong> major signs of wear, such as many or large marks and/or small holes.</li>' +
        '</ul>' +
        '<p>Items with marks, holes or wear (VGUC and below) may be declined or paid at a lower rate, so please leave them out. Names on inside tags that can be cut off aren’t a fault, but names stamped or written on fabric that can’t be removed are.</p>',
      buttons: [{ label: 'See the full Condition Definitions page', link: 'conditions' }],
      closeLabel: 'Got it'
    }
  },

  sections: [
    { id: 's1', title: 'Service & brands' },
    { id: 's2', title: 'Your clothing' },
    { id: 's3', title: 'Booking' }
  ],

  questions: [
    /* ---------------------------------------------------------------- 1 */
    {
      id: 'service', section: 's1',
      title: 'Which service do you need?',
      prompt: 'Are you looking to sell your clothing through our Sell With Us consignment service?',
      fyiTitle: 'Is this the right service for you?',
      fyiButtons: [{ label: 'Take our service quiz', link: 'quiz' }],
      fyiNote: 'Not sure it’s the right fit? Make sure you try our service quiz.',
      note: 'We have two completely different services: <strong>Sell With Us</strong> (this one, where we sell your clothing on your behalf and you’re paid as items sell) and <strong>Closet Cashout</strong> (our bulk-buy service, where you send us a box and we make you one upfront payout offer). They work differently, pay you differently and accept different brands. Each has its own brand list and exceptions list, and what’s accepted for one isn’t automatically accepted for the other.',
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I want my clothing sold on my behalf and to receive payments as items sell.' },
        { id: 'B', outcome: 'red',
          text: 'No, I’d prefer to sell my clothing in bulk for one upfront payout.',
          fyi: 'Sell With Us isn’t an upfront payout. You’re paid as your items sell. If you’d prefer one payout, Closet Cashout is the right service.',
          fyiButtons: [{ label: 'Explore Closet Cashout', link: 'cco' }],
          message: 'It sounds like Closet Cashout might be a better fit! With Closet Cashout, we look through your whole box and make you one upfront payout offer for the items we’d like to buy, instead of selling your items for you over time.',
          buttons: [{ label: 'Explore Closet Cashout', link: 'cco' }] },
        { id: 'C', outcome: 'amber',
          text: 'I’m not sure which service is right for me.',
          fyi: 'Sell With Us means we sell your clothing for you and you’re paid as items sell. Closet Cashout is our bulk-buy service with one upfront payout.',
          message: 'No problem! Our two services work quite differently. We recommend completing our quick service quiz to find the best option for your clothing.',
          buttons: [{ label: 'Take the Service Quiz', link: 'quiz' }] }
      ]
    },

    /* ---------------------------------------------------------------- 2 */
    {
      id: 'brands', section: 's1',
      title: 'Accepted brands',
      prompt: 'Have you checked every brand you’re sending against the Sell With Us Accepted Brands List?',
      fyiTitle: 'Do you have the right brands?',
      fyiButtons: [{ label: 'View Sell With Us Accepted Brands List', link: 'swuBrands' }],
      note: 'A brand being sold on our website doesn’t mean it’s accepted here. The Closet Cashout accepted brands and exceptions lists can be very different to Sell With Us, so please only use the Sell With Us ones. Make sure you read the full exceptions list on the Sell With Us Accepted Brands List page.',
      buttons: [{ label: 'View Sell With Us Accepted Brands List', link: 'swuBrands' }],
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I’ve checked every brand against the Sell With Us list and its exceptions, and I’m only sending brands on it.' },
        { id: 'B', outcome: 'red',
          text: 'I haven’t checked the list yet.',
          fyi: 'Check every brand against the Sell With Us Accepted Brands List, and read its exceptions, before you pack.',
          message: 'Not all clothing brands are accepted. Please check every brand you intend to send against our Sell With Us Accepted Brands List before purchasing a spot.',
          buttons: [{ label: 'Check Accepted Brands', link: 'swuBrands' }] },
        { id: 'C', outcome: 'red',
          text: 'I checked the Closet Cashout list instead.',
          fyi: 'Only use the Sell With Us list. Closet Cashout brands and exceptions can be very different.',
          message: 'Our two services have different accepted brands. A brand accepted under Closet Cashout isn’t necessarily accepted under Sell With Us. Please check the correct list before continuing.',
          buttons: [{ label: 'View Sell With Us Accepted Brands', link: 'swuBrands' }] },
        { id: 'D', outcome: 'red',
          text: 'I’m not sure about some of my brands.',
          fyi: 'If a brand isn’t on the Sell With Us list, leave it out, even if we sell it on our website or accept it through Closet Cashout. Unsure? Message us before booking.',
          message: 'No worries! Please check each brand against the Sell With Us Accepted Brands List. If a brand isn’t on the list, it isn’t accepted for this service, even if we sell it on our website or accept it through Closet Cashout. Unsure about something? Message us before booking.',
          buttons: [{ label: 'View Accepted Brands', link: 'swuBrands' }, { label: 'Contact Us', link: 'contact' }] }
      ]
    },

    /* ---------------------------------------------------------------- 3 */
    {
      id: 'count', section: 's1',
      title: 'Minimum item requirement',
      prompt: 'Do you have at least 15 qualifying items?',
      fyiTitle: 'Do you have enough qualifying items?',
      fyiButtons: [{ label: 'Check the Sell With Us Accepted Brands List', link: 'swuBrands' }],
      note: 'Reminder of the icons on the brands list: ✅ <strong>YES</strong> brands are accepted automatically and count towards your 15. 📷 <strong>MAYBE</strong> brands need photo approval (sent after you purchase your spot), aren’t guaranteed, and <strong>don’t</strong> count towards the 15, even if approved. A matching set counts as one item. Check the icon next to each of your brands on the <strong>Sell With Us Accepted Brands List</strong>.',
      buttons: [{ label: 'Check the Sell With Us Accepted Brands List', link: 'swuBrands' }],
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I have at least 15 YES-brand (✅) items, excluding MAYBE (📷) brands, and I’ve counted sets as one item.' },
        { id: 'B', outcome: 'red',
          text: 'I have 15 items, but some are MAYBE (📷) brands.',
          fyi: 'MAYBE (📷) brands don’t count towards your 15. You need at least 15 YES (✅) brand items.',
          message: 'MAYBE brands don’t count towards our 15-item minimum, even if they receive photo approval. You’ll need at least 15 qualifying YES-brand items before booking.' },
        { id: 'C', outcome: 'red',
          text: 'No, I have fewer than 15 qualifying items.',
          fyi: 'You need at least 15 qualifying items. Check you have enough before you book.',
          message: 'Sell With Us requires a minimum of 15 accepted items. Please wait until you have enough qualifying clothing before purchasing a spot.' }
      ]
    },

    /* ---------------------------------------------------------------- 4 */
    {
      id: 'condition', section: 's2',
      title: 'Item condition',
      prompt: 'Have you inspected every item, and are they all free from flaws?',
      fyiTitle: 'Do your items meet our condition requirements?',
      fyiButtons: [{ label: 'Condition Definitions', popup: 'conditions' }],
      note: 'We’re looking for flaw-free items. We understand the odd small mark can slip through, but items with flaws may not be accepted, or may be accepted at a lower payout and be much slower to sell.',
      buttons: [{ label: 'Condition Definitions', popup: 'conditions' }],
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I’ve inspected every item individually and all are excellent used condition (second-hand with no flaws) or better.' },
        { id: 'B', outcome: 'red',
          text: 'Some items have marks, stains, pilling or wear.',
          fyi: 'Remove any items with stains, holes, pilling, fading or damage before you pack.',
          message: 'Sell With Us requires excellent used condition or better. This means second-hand clothing with no flaws. Please remove any items with known stains, holes, pilling, fading or damage before booking.' },
        { id: 'C', outcome: 'red',
          text: 'I haven’t inspected every item individually.',
          fyi: 'Check every item, front, back, sleeves, collars and cuffs, in natural light before you pack.',
          message: 'Please inspect every item carefully before booking, ideally in good natural light. Check fronts, backs, sleeves, collars, cuffs and other areas where stains or wear may be missed.' }
      ]
    },

    /* ---------------------------------------------------------------- 5 */
    {
      id: 'washing', section: 's2',
      title: 'Freshly washed clothing',
      prompt: 'Have all your used items been freshly washed?',
      fyiTitle: 'Are your items freshly washed?',
      note: 'Everything you send needs to be clean and free of storage odours. This matters for the health and safety of our team and for the babies who’ll wear these pieces next. The only exceptions are brand-new items with tags (BNWT) or without tags (BNWOT).',
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, all used items were washed within 7 days before I packed them and are completely dry.' },
        { id: 'B', outcome: 'red',
          text: 'Not yet, but I’ll wash everything before sending.',
          fyi: 'Wash and fully dry everything before you book.',
          message: 'Please hold off on purchasing a spot until your clothing has been freshly washed and completely dried. It’s best to book once everything is ready to go.' },
        { id: 'C', outcome: 'red',
          text: 'No, I don’t have time to rewash everything.',
          fyi: 'Washing within 7 days before packing is a must. If you don’t have time, it may be better to book later.',
          message: 'We understand that busy parents don’t always have time to rewash bulk clothing. However, freshly washed clothing is a requirement of our service, so Sell With Us may not be the right fit at this time.' },
        { id: 'D', outcome: 'red',
          text: 'My clothing was washed before being stored away.',
          fyi: 'Wash and fully dry everything before you book, even if it was clean when stored. Stored clothing picks up a musty smell you often can’t notice yourself.',
          fyiReplaces: ['B'],
          message: 'Clothing that’s been sitting in storage still needs to be freshly washed before sending, even if it was clean when packed away. Stored clothing picks up a musty storage smell that you often can’t notice yourself, but we and our customers definitely can!' }
      ]
    },

    /* ---------------------------------------------------------------- 6 */
    {
      id: 'pickup', section: 's3',
      title: 'Organise pickup',
      prompt: 'After you purchase your Sell With Us spot, you’ll need to complete the Organise Pickup form within 7 days.',
      fyiTitle: 'Are you ready for pickup?',
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I understand, and everything is washed, dry, packed and ready to go.' },
        { id: 'B', outcome: 'amber',
          text: 'Yes, I understand, but I still need to wash or pack some items.',
          fyi: 'Wash, dry and pack everything before you book, so you’re not rushing within the 7 days.',
          message: 'Thanks for being upfront! It’s best to wash, dry and pack everything <strong>before</strong> purchasing your spot, so you’re not rushing within the 7 days. Come back to this question once everything is ready.' },
        { id: 'C', outcome: 'red',
          text: 'I’ll need longer than 7 days.',
          fyi: 'The Organise Pickup form must be completed within 7 days of booking. Book when you have the time.',
          message: 'Sell With Us needs the Organise Pickup form completed within 7 days of purchasing your spot. The timing may not be right for you at the moment, so it’s best to come back when you have more free time to get everything ready.' }
      ]
    }
  ],

  fyi: {
    title: 'Make sure you do this first',
    intro: 'Here are a few things to sort before you send your clothing.',
    buttonLabel: 'Got it, continue'
  },

  reminders: {
    title: 'A few quick reminders',
    intro: 'Handy things to know as a consignor (that’s you!). Nothing to answer here.',
    buttonLabel: 'Got it, continue',
    items: [
      { icon: '💰', title: 'Payouts:',
        text: 'Each brand has its own payout rate. You’re paid weekly, every Monday, as items sell. Store credit pays 20% more than bank transfer, and flawed items pay 20% less.',
        link: { link: 'swuBrands', label: 'Payout percentages' } },
      { icon: '🏷️', title: 'Pricing:',
        text: 'We price every item based on brand, condition, retail price and resale demand. Want to choose your own prices? Selling yourself is the way to go.' },
      { icon: '⏳', title: 'Listing period:',
        text: 'Items are listed for about 2–3 months, with a 30% price drop in the final two weeks. Nothing is paid upfront, but on average over 90% of items sell.' },
      { icon: '🔍', title: 'Declined items:',
        text: 'Items that don’t meet our requirements after inspection may be declined. Declined items can be returned at your cost, or added to our Seconds Garage Sale (100% of clothing-sale proceeds go to charity, so there’s no payout).',
        link: { link: 'garageSale', label: 'Seconds Garage Sale' } },
      { icon: '📋', title: 'Fees:',
        text: 'The spot fee is non-refundable. If you withdraw after your items are received, a $10 admin fee, $1 per listed item and return shipping apply.',
        link: { link: 'swuInfo', label: 'See the Sell With Us page (FAQs and Terms)' } }
    ]
  },

  final: {
    title: 'You’re ready to book!',
    message: 'Based on your answers, your clothing appears to meet our Sell With Us requirements.',
    ackLabel: 'I confirm that I’ve reviewed the requirements above, checked the correct Sell With Us Accepted Brands List and prepared my clothing according to the service requirements.',
    ackExtra: 'I understand that items may still be declined following physical inspection and that the full service terms apply.',
    buttonLabel: 'Continue to Sell With Us booking'
  }
};
