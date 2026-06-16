// ========================================
// GitHub OAuth Worker for zhuoqi.uk/admin
// ========================================
//
// Handles the OAuth callback server-side so the
// GitHub OAuth Client Secret never touches the browser.
//
// Only allows the owner (ALLOWED_USER) to authenticate.
//
// Uses an OAuth "state" parameter (stored in a short-lived
// signed cookie) to prevent CSRF attacks on the auth flow.

export default {
  async fetch(request, env) {
    try {
    const url = new URL(request.url);

    // --- GET /auth — redirect to GitHub OAuth authorize page ---
    if (url.pathname === '/auth') {
      // Generate a random state value for CSRF protection
      const state = crypto.randomUUID();

      // Build the GitHub OAuth URL
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: 'public_repo',
        state,
      });

      // Redirect to GitHub and set the state cookie
      // (10-minute expiry covers the time to complete the GitHub auth flow)
      // Use new Response() — Response.redirect() returns immutable headers.
      return new Response(null, {
        status: 302,
        headers: {
          Location: `https://github.com/login/oauth/authorize?${params}`,
          'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
        },
      });
    }

    // --- GET /callback?code=...&state=... ---
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');

      if (!code) {
        return new Response('Missing "code" parameter.', { status: 400 });
      }

      // Verify the state parameter matches the cookie (CSRF protection)
      const cookieHeader = request.headers.get('Cookie') || '';
      const cookies = Object.fromEntries(
        cookieHeader
          .split(';')
          .map((c) => c.trim().split('=', 2))
          .filter(([k]) => k),
      );
      const storedState = cookies.oauth_state;

      if (!returnedState || returnedState !== storedState) {
        return new Response(
          'Invalid state parameter. This may be a CSRF attack.',
          { status: 403 },
        );
      }

      // Exchange the code for an access token
      const tokenResp = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        },
      );

      const tokenData = await tokenResp.json();
      if (tokenData.error) {
        return new Response(
          `OAuth failed: ${tokenData.error_description || tokenData.error}`,
          { status: 400 },
        );
      }

      // Verify the authenticated user's identity
      const userResp = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'zhuoqi-homepage-admin',
        },
      });

      if (!userResp.ok) {
        return new Response(
          `Failed to fetch user: ${userResp.status}`,
          { status: 500 },
        );
      }

      const user = await userResp.json();
      const allowedUser = env.ALLOWED_USER || 'zhuoq1';

      if (user.login !== allowedUser) {
        return new Response(
          `Access denied. This admin panel is restricted to @${allowedUser}. Your login (@${user.login}) is not authorized.`,
          { status: 403 },
        );
      }

      // Redirect back to the admin page with the token in the URL hash
      // (hash fragments never reach the server — they stay in the browser)
      const appUrl = env.APP_URL || 'https://zhuoqi.uk/';
      const redirectUrl = `${appUrl}#access_token=${tokenData.access_token}`;

      // Redirect back and clear the state cookie
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
          'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
        },
      });
    }

    // --- Everything else ---
    return new Response('Not found', { status: 404 });
    } catch (err) {
      console.error('OAuth Worker error:', err);
      return new Response('Internal server error', { status: 500 });
    }
  },
};
