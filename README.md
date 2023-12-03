# hushagent

WIP

As information is becoming more and more valuable, it's important to protect it. This is a simple technique that will
mask the destination of your requests.

To illustrate, let's say you're using a proxy to make requests to `httpbin.org`, `www.wikipedia.org`, and
`www.cloudflare.com`.

Instead of your proxy provider seeing:

```
1701633972.803   1003 $SERVER_IP TCP_TUNNEL/200 6186 CONNECT httpbin.org:443 $USER HIER_DIRECT/54.83.155.149 -
1701633973.092    211 $SERVER_IP TCP_TUNNEL/200 28332 CONNECT www.wikipedia.org:443 $USER HIER_DIRECT/208.80.154.224 -
1701633973.346    161 $SERVER_IP TCP_TUNNEL/200 71077 CONNECT www.cloudflare.com:443 $USER HIER_DIRECT/104.16.124.96 -
```

Why not have them see this instead:

```
1701633974.303    817 $SERVER_IP TCP_TUNNEL/200 6215 CONNECT 75.101.131.185:443 $USER HIER_DIRECT/75.101.131.185 -
1701633975.058    490 $SERVER_IP TCP_TUNNEL/200 28331 CONNECT 208.80.154.224:443 $USER HIER_DIRECT/208.80.154.224 -
1701633975.849    284 $SERVER_IP TCP_TUNNEL/200 71134 CONNECT 104.16.124.96:443 $USER HIER_DIRECT/104.16.124.96 -
```

## Usage

```typescript
import { hush } from "@rpappa/hushagent";

const hushedAgent = hush(YOUR_AGENT_HERE);
```

## Performance

```
 BENCH  Summary

  without hush - test/index.bench.ts > requests to localhost
    1.09x faster than with hush

  without hush - test/index.bench.ts > requests to httpbin with proxy
    1.05x faster than with hush
```

Likely some improvements to be made, haven't tested "in the real world"

## Limitations

The assumed threat model for this is you have a malicious proxy provider. If you have a malicious proxy provider that is
trying to figure out what you might be doing, this will help mask the destination of your requests.

However, if you easily determine the destination of your request based on the IP address, this will not help you. For
example, if you are directly hitting origin servers, or if reverse DNS is possible. But, if the domain name resolves to
a large CDN, this may provide some protection.
