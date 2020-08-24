# Caching

We use AWS Cloudfront to cache the website. There are a few notes here about the rules.

## Origins

We have two configured origin servers for the website:

-   Elastic Load Balancer (ELB)
-   S3 bucket

The ELB is simply the public load balancer for this webapp. By default, Cloudfront will route all traffic there.

The S3 bucket (`blf-assets.s3.amazonaws.com`) is used for two different URL routes – one for the webapp's static assets (CSS, JS, etc) and another for CMS uploads (eg. photos, PDFs etc).

## Caching rules

### History / rationale

We used to have a fairly complex process to update Cloudfront "behaviours" (eg. URL routing) which blocked/approved specific querystrings for use on certain pages. 

This was useful when we used Cloudfront to route to multiple different webservers (eg. when transitioning from the legacy website to the current one), and it gave us some cache benefits to prevent sharding, but in mid-2020 it's less useful and can often introduce problems if we forget to update the rules and some pages are cached which shouldn't be because we haven't approved their querystrings.

Instead, we now configure Cloudfront to allow *all* querystrings and cache based on them. This shards the cache, but the site is quick already and it's become more important for us to confidently deploy changes without complex config updates, than to save a small amount of milliseconds via the cache.

Secondly, the CMS now has its own (short-lived) cache, which protects us from high-traffic bursts for slower pages, and keeps responses feeling fresh.

### Cache rules

The default behaviour rule in Cloudfront allows _one_ cookie, `blf-alpha-session`. If more cookies are added, or this cookie is renamed, this must be updated in the Cloudfront config. 

All querystrings are allowed and the cache is based on them.

All HTTP methods (GET, POST, PUT etc) are allowed.

Cloudfront respects the relevant cache headers of the origin pages, so less-frequently updated pages are cached for longer (eg. /funding/grants). Private pages (eg. /user/* and /apply/*) are not cached, as per their headers. 
