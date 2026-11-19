// Cloudflare Worker: send www.<domain> to the bare domain, then serve the static site.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    // The 404 page itself must answer with a real 404 status, not 200 (or a redirect to /404).
    if (url.pathname === "/404" || url.pathname === "/404.html") {
      const page = await env.ASSETS.fetch(new Request(new URL("/404", url), request));
      return new Response(page.body, { status: 404, statusText: "Not Found", headers: page.headers });
    }
    return env.ASSETS.fetch(request);
  },
};
