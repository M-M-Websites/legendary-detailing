/* =========================================================
   LEGENDARY DETAILING: EASY-EDIT CONTENT
   This is the only file the owner needs to touch for reviews
   and social links. Save it and the website updates itself.
   ========================================================= */

/* SOCIAL LINKS
   Paste full profile URLs between the quotes. Icons appear in the footer
   automatically; empty ones stay hidden. */
window.LD_SOCIAL = {
  instagram: "https://www.instagram.com/cme.zay/",
  facebook: "",
  tiktok: "",
  google: ""   // Google Business Profile link, e.g. https://g.page/r/...  (also used for "Read all reviews")
};

/* BUSINESS HOURS
   Leave empty until the owner confirms real hours. Once filled in, the hours
   show in the footer and are added to the Google structured data automatically.
   Days must be written in full English (Monday, Tuesday, ...). Times are 24-hour.
   Maintainers: index.html keeps a static copy of the hours and social links (footer
   hours list + structured data) for AI and search crawlers that don't run JavaScript.
   Update it to match; the test suite fails if the two drift apart.

   Example:
   { label: "Mon - Fri", days: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "08:00", closes: "18:00" },
   { label: "Saturday",  days: ["Saturday"], opens: "09:00", closes: "15:00" },
*/
window.LD_HOURS = [
  // Confirmed by the owner: available any time, every day. 00:00-23:59 is Google's format for open 24 hours.
  { label: "Every day", days: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "00:00", closes: "23:59" }
];

/* PRIVACY-FRIENDLY ANALYTICS (optional, no cookies)
   Counts visits plus phone, text and email clicks and booking requests.
   Supported: "plausible" (siteId = your domain, e.g. "legendarydetailing.com")
              "goatcounter" (siteId = your GoatCounter code, e.g. "legendarydetailing")
   Leave provider empty to turn analytics off. See docs/SEO.md for setup. */
window.LD_ANALYTICS = {
  provider: "",
  siteId: ""
};

/* CLIENT REVIEWS
   Add ONLY real reviews from actual customers, copied word for word.
   The Reviews section stays hidden until at least one review is here.
   Preview the layout any time by adding ?editor to the website address.

   Copy this example, remove the // marks, and fill it in:

   { name: "Jordan M.", vehicle: "2021 Audi R8", rating: 5, text: "Exact words from the customer.", source: "Google" },
*/
window.LD_REVIEWS = [

];
