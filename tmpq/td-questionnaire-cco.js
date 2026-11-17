/* ==========================================================================
   The Thrifting Den — Closet Cashout pre-booking questionnaire (CONTENT FILE)
   --------------------------------------------------------------------------
   This is the only file you need to edit to change questions, answers,
   messages, links or which answers let a customer continue.

   OUTCOMES
     green = meets the requirement, auto-advances
     amber = shows the message; customer acknowledges and must pick again
     red   = stop message; customer can't continue until they change answer

   BUTTONS use "link" keys defined in `links` just below, so a URL only ever
   needs fixing in one place.

   When you edit wording/questions, change `version` (e.g. CCO-2026-11-12-b).
   The version is saved on every order so you know which wording was agreed.
   Changing the version also clears any half-finished answers saved in a
   customer's browser.
   ========================================================================== */
window.TD_QUESTIONNAIRES = window.TD_QUESTIONNAIRES || {};

window.TD_QUESTIONNAIRES.cco = {
  key: 'cco',
  version: 'CCO-2026-11-17-a',
  serviceName: 'Closet Cashout',
  serviceCode: 'CCO',
  progressWord: 'Step',
  shuffleOptions: false,

  links: {
    swu:           { url: '/pages/sell-with-us' },
    quiz:          { url: '/pages/which-service-quiz' },
    ccoBrands:     { url: '/pages/cco-accepted-brands-list' },
    ccoInfo:       { url: '/pages/closet-cashout' },
    contact:       { url: '/pages/contact-us' },
    conditions:    { url: '/pages/condition-definitions' },
    email:         { url: 'mailto:info@thethriftingden.com' }
  },

  intro: {
    title: 'Let’s make sure you’re ready to book!',
    paragraphs: [
      'Please take 2 minutes to complete this quick check before you book. It makes sure you’ve read our requirements and that your clothing is a good fit for Closet Cashout, so you can book with confidence.',
      'This check goes with our full Closet Cashout page, so please read that page first, then come back here.'
    ],
    buttons: [{ label: 'Read the Closet Cashout page', link: 'ccoInfo' }],
    fullDetails: { before: 'Full details are on the ', label: 'Closet Cashout page', link: 'ccoInfo' },
    note: 'Please take your time and answer every question honestly. Your answers help us make sure Closet Cashout is the right fit for you and your clothing, and help your booking run smoothly.',
    startLabel: 'Start the check'
  },

  returning: {
    title: 'Quick question first',
    prompt: 'Have you sent us a Closet Cashout box in the last 3 months?',
    note: 'Heads up: we check this answer against your order history. If the details don\u2019t match, we will need to pause or decline your box until the check is completed.',
    options: [
      { id: 'A', skip: true,
        text: 'Yes, I’ve used Closet Cashout in the last 3 months.',
        record: 'Yes, used Closet Cashout in the last 3 months (self-declared)' },
      { id: 'B',
        text: 'No, my last box was more than 3 months ago.',
        record: 'No, last box was more than 3 months ago' },
      { id: 'C',
        text: 'No, this will be my first time.',
        record: 'No, first time' }
    ],
    skipRecord: 'Check skipped (returning customer, self-declared)',
    skip: {
      title: 'Welcome back!',
      message: 'As you’ve sold with us recently, you can skip the check. Our Accepted Brands List and requirements can change though, so it’s worth a quick look before you pack.',
      buttons: [{ label: 'View Closet Cashout Accepted Brands List', link: 'ccoBrands' }],
      buttonLabel: 'Continue to booking'
    }
  },

  /* Shown instead of the booking button when the booking product is sold out. */
  soldOut: {
    message: '<strong>Closet Cashout spots are currently sold out.</strong> Please check back soon for more spots.'
  },

  /* Pop-ups opened by buttons that use  popup: 'key'  instead of  link: 'key' */
  popups: {
    conditions: {
      title: 'Condition definitions',
      message: '<p>Closet Cashout needs items in <strong>BNWT or excellent used condition (EUC) or better</strong>. Here’s how we define each grade:</p>' +
        '<ul>' +
        '<li><strong>BNWT:</strong> brand new with tag.</li>' +
        '<li><strong>BNWOT:</strong> brand new without tag.</li>' +
        '<li><strong>Like New:</strong> looks pretty much new, maybe worn once or twice, with extremely minimal to no signs of wear.</li>' +
        '<li><strong>EUC:</strong> excellent used condition. You can tell it isn’t brand new, but it has minimal defects (if any) and no holes or marks.</li>' +
        '<li><strong>VGUC:</strong> very good used condition. More signs of wear, such as brushing, a small or light mark or a teeny hole.</li>' +
        '<li><strong>GUC:</strong> good used condition. Noticeable wear, such as a few marks, a small hole or wash fading.</li>' +
        '<li><strong>Play:</strong> major signs of wear, such as many or large marks and/or small holes.</li>' +
        '</ul>' +
        '<p>Items with marks, holes, fading or wear (VGUC and below) may be declined, so please leave them out. Footwear needs minimal sole wear and no dirt or scuffing to the fronts. Names on inside tags that can be cut off aren’t a fault, but names stamped or written on fabric that can’t be removed are.</p>',
      buttons: [{ label: 'See the full Condition Definitions page', link: 'conditions' }],
      closeLabel: 'Got it'
    }
  },

  sections: [
    { id: 's1', title: 'Service & brands' },
    { id: 's2', title: 'Your clothing' }
  ],

  questions: [
    /* ---------------------------------------------------------------- 1 */
    {
      id: 'service', section: 's1',
      title: 'Which service do you need?',
      prompt: 'Closet Cashout is our bulk-buy service. You send a box and we make you one upfront payout offer, based on estimated second-hand resale value, not original retail price. Is that what you’re after?',
      fyiTitle: 'Is this the right service for you?',
      fyiButtons: [{ label: 'Take our service quiz', link: 'quiz' }],
      fyiNote: 'Not sure it’s the right fit? Make sure you try our service quiz.',
      note: 'We have two completely different services: <strong>Closet Cashout</strong> (this one, our bulk-buy service where we make you one upfront payout offer) and <strong>Sell With Us</strong> (where we sell your clothing on your behalf and you’re paid as items sell). They work differently, pay you differently and accept different brands.',
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I want the convenience and speed of one upfront payout, and I understand it pays less than selling items individually.' },
        { id: 'B', outcome: 'amber',
          text: 'I’d like the highest payout I can get.',
          fyi: 'Closet Cashout is for convenience and speed, not top dollar. If earning the most matters, Sell With Us may suit you better.',
          fyiButtons: [{ label: 'Explore Sell With Us', link: 'swu' }],
          message: 'Closet Cashout is a convenience service for parents who want time back, not top dollar. If maximising what you earn matters most, Sell With Us may suit you better.',
          buttons: [{ label: 'Explore Sell With Us', link: 'swu' }, { label: 'Take the Service Quiz', link: 'quiz' }] },
        { id: 'C', outcome: 'amber',
          text: 'I’m not sure which service is right for me.',
          fyi: 'Closet Cashout is our bulk-buy service with one upfront payout. Sell With Us means we sell your clothing for you and you’re paid as items sell.',
          message: 'No problem! Our two services work quite differently. We recommend completing our quick service quiz to find the best option for your clothing.',
          buttons: [{ label: 'Take the Service Quiz', link: 'quiz' }] }
      ]
    },

    /* ---------------------------------------------------------------- 2 */
    {
      id: 'brands', section: 's1',
      title: 'Accepted brands',
      prompt: 'Have you checked every brand you’re sending against the Closet Cashout Accepted Brands List?',
      fyiTitle: 'Do you have the right brands?',
      fyiButtons: [{ label: 'View Closet Cashout Accepted Brands List', link: 'ccoBrands' }],
      note: 'We don’t accept every brand, and brands that aren’t on the list aren’t purchased. A brand being sold on our website doesn’t mean it’s accepted here, and the Sell With Us list is different, so please use the Closet Cashout one and read the full exceptions list.',
      buttons: [{ label: 'View Closet Cashout Accepted Brands List', link: 'ccoBrands' }],
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I’ve checked every brand against the Closet Cashout list and its exceptions, and I’m only sending brands on it.' },
        { id: 'B', outcome: 'red',
          text: 'I haven’t checked the list yet.',
          fyi: 'Check every brand against the Closet Cashout Accepted Brands List, and read its exceptions, before you pack.',
          message: 'Not all clothing brands are accepted. Please check every brand you intend to send against our Closet Cashout Accepted Brands List before purchasing a spot.',
          buttons: [{ label: 'Check Accepted Brands', link: 'ccoBrands' }] },
        { id: 'C', outcome: 'red',
          text: 'I checked the Sell With Us list instead.',
          fyi: 'Only use the Closet Cashout list. Sell With Us brands and exceptions can be very different.',
          message: 'Our two services have different accepted brands. A brand accepted under Sell With Us isn’t necessarily accepted under Closet Cashout. Please check the correct list before continuing.',
          buttons: [{ label: 'View Closet Cashout Accepted Brands', link: 'ccoBrands' }] },
        { id: 'D', outcome: 'red',
          text: 'I’m not sure about some of my brands.',
          fyi: 'If a brand isn’t on the Closet Cashout list, leave it out, even if we sell it on our website. Unsure? Message us before booking.',
          message: 'No worries! Please check each brand against the Closet Cashout Accepted Brands List. If a brand isn’t on the list, it isn’t purchased, even if we sell it on our website. Unsure about something? Message us before booking.',
          buttons: [{ label: 'View Accepted Brands', link: 'ccoBrands' }, { label: 'Contact Us', link: 'contact' }] }
      ]
    },

    /* ---------------------------------------------------------------- 3 */
    {
      id: 'condition', section: 's2',
      title: 'Item condition',
      prompt: 'Have you inspected every item, and are they all in excellent used condition or better?',
      fyiTitle: 'Do your items meet our condition requirements?',
      fyiButtons: [{ label: 'Condition Definitions', popup: 'conditions' }],
      note: 'We’re looking for BNWT or excellent used condition: no stains, fading, holes or heavy wear. Footwear needs minimal sole wear and no dirt or scuffing to the fronts.',
      buttons: [{ label: 'Condition Definitions', popup: 'conditions' }],
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, I’ve inspected every item individually and all are excellent used condition (second-hand with no flaws) or better.' },
        { id: 'B', outcome: 'red',
          text: 'Some items have marks, stains, pilling or wear.',
          fyi: 'Remove any items with stains, holes, pilling, fading or damage before you pack.',
          message: 'Closet Cashout requires excellent used condition or better. This means second-hand clothing with no flaws. Please remove any items with known stains, holes, pilling, fading or damage before booking.' },
        { id: 'C', outcome: 'red',
          text: 'I haven’t inspected every item individually.',
          fyi: 'Check every item, front, back, sleeves, collars and cuffs, in natural light before you pack.',
          message: 'Please inspect every item carefully before booking, ideally in good natural light. Check fronts, backs, sleeves, collars, cuffs and other areas where stains or wear may be missed.' }
      ]
    },

    /* ---------------------------------------------------------------- 4 */
    {
      id: 'washing', section: 's2',
      title: 'Freshly washed clothing',
      prompt: 'Have all your used items, including footwear, been freshly washed?',
      fyiTitle: 'Are your items freshly washed?',
      note: 'Everything you send needs to be clean and free of storage odours. This matters for the health and safety of our team and for the babies who’ll wear these pieces next. The only exceptions are brand-new items with tags (BNWT) or without tags (BNWOT).',
      options: [
        { id: 'A', outcome: 'green',
          text: 'Yes, everything was washed within 7 days before I packed it and is completely dry.' },
        { id: 'B', outcome: 'red',
          text: 'Not yet, but I’ll wash everything before sending.',
          fyi: 'Wash and fully dry everything before you book.',
          message: 'Please hold off on purchasing a spot until your clothing has been freshly washed and completely dried. It’s best to book once everything is ready to go.' },
        { id: 'C', outcome: 'red',
          text: 'No, I don’t have time to rewash everything.',
          fyi: 'Washing within 7 days before packing is a must. If you don’t have time, it may be better to book later.',
          message: 'We understand that busy parents don’t always have time to rewash bulk clothing. However, freshly washed clothing is a requirement of our service, so Closet Cashout may not be the right fit at this time.' },
        { id: 'D', outcome: 'red',
          text: 'My clothing was washed before being stored away.',
          fyi: 'Wash and fully dry everything before you book, even if it was clean when stored. Stored clothing picks up a musty smell you often can’t notice yourself.',
          fyiReplaces: ['B'],
          message: 'Clothing that’s been sitting in storage still needs to be freshly washed before sending, even if it was clean when packed away. Stored clothing picks up a musty storage smell that you often can’t notice yourself, but we and our customers definitely can!' }
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
    intro: 'Handy things to know before you book. Nothing to answer here.',
    buttonLabel: 'Got it, continue',
    items: [
      { icon: '📦', title: 'Full boxes work best:',
        text: 'There’s no formal minimum, but Closet Cashout works best with a full box, not a small handful of items. We recommend 15+ qualifying items to make the most of your booking.' },
      { icon: '🧶', title: 'Merino:',
        text: 'Merino from any brand is accepted at 10% unless the brand has its own listed rate.',
        link: { link: 'ccoBrands', label: 'Accepted Brands List' } },
      { icon: '📏', title: 'Sizes:',
        text: 'Clothing and footwear only, premature to 8 years.' },
      { icon: '🚚', title: 'Drop-off or send yourself:',
        text: 'If you’d like to drop off (Royal Oak, Auckland) or send at your own cost, please email info@thethriftingden.com.',
        link: { link: 'email', label: 'Email us' } }
    ]
  },

  final: {
    title: 'You’re ready to book!',
    message: 'Based on your answers, your clothing appears to meet our Closet Cashout requirements.',
    ackLabel: 'I confirm that I’ve reviewed the requirements above, checked the correct Closet Cashout Accepted Brands List and prepared my clothing according to the service requirements.',
    ackExtra: 'I understand that items may still be declined following physical inspection and that the full service terms apply.',
    buttonLabel: 'Continue to Closet Cashout booking'
  }
};
