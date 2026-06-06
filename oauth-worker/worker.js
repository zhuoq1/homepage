// ========================================
// GitHub OAuth Worker for zhuoqi.uk/admin
// ========================================
//
// Handles the OAuth callback server-side so the
// GitHub OAuth Client Secret never touches the browser.
//
// Only allows the owner (ALLOWED_USER) to authenticate.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- GET /auth — redirect to GitHub OAuth authorize page ---
    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: 'public_repo',
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params}`,
        302,
      );
    }

    // --- GET /callback?code=... — exchange code, verify user, redirect back ---
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing "code" parameter.', { status: 400 });
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
      const appUrl = env.APP_URL || 'https://zhuoqi.uk/admin.html';
      const redirectUrl = `${appUrl}#access_token=${tokenData.access_token}`;
      return Response.redirect(redirectUrl, 302);
    }

    // --- Everything else ---
    return new Response('Not found', { status: 404 });
  },
};
