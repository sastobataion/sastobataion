var V = "sb-v2", C = V + "-core", R = V + "-run";
var CORE = ["./", "index.html", "manifest.webmanifest", "admin.webmanifest", "logo.svg", "logo.png", "icon-192.png", "icon-512.png", "banner.png",
  "articles.json", "tips.json", "quiz.json", "services.json", "videos.json"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(C).then(function (c) {
    // একটা ফাইল না থাকলেও install আটকাবে না
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (x) { return x !== C && x !== R; }).map(function (x) { return caches.delete(x); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (/admin/i.test(u.pathname)) return; // অ্যাডমিন পাতা ক্যাশ হবে না
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && res.type === "basic") {
      var cp = res.clone();
      caches.open(R).then(function (c) { c.put(r, cp); });
    }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (m) {
      if (m) return m;
      if (r.mode === "navigate") return caches.match("index.html").then(function (i) { return i || caches.match("./"); });
      return Response.error();
    });
  }));
});
