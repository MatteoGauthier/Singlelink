// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false })

// Include .env as ENV variables via process.env
require('dotenv').config()

// Include HTTP Client, Axios
const axios = require('axios');

// Make console logging output pretty
const chalk = require('chalk');

// Define port for launch
const port = process.env.PORT ?? 80;

// Define hostname for launch
const host = process.env.HOST ?? '127.0.0.1';

// Define app name
const app_name = process.env.APP_NAME ?? 'Singlelink';

// Define free signup
const free_signup = process.env.FREE_SIGNUP ?? true;

// Define hostname
const hostname = process.env.HOSTNAME ?? 'api.singlelink.co';

// Define API URL
const api_url = process.env.API_URL ?? 'https://api.singlelink.co';

// Declare site route
fastify.route({
    method: 'GET',
    url: '/u/*',
    handler: async (request, reply) => {
        // Get requested site handle from URL
        const handle = request.url.replace('/u/', '');

        // Log request
        console.log(chalk.cyan.bold(app_name) + ': Request received at /' + handle);
        
        let response;

        try {
            // Fetch site from API
            response = await axios.get(api_url + '/profile/' + handle);
        } catch(err) {
            // Log error
            console.log(chalk.cyan.bold(app_name) + ': Error when processing request');
            console.log(chalk.cyan.bold(app_name) + ': ' + err);
            reply.type('text/html');
            return reply.send(`
                <html>
                    <head>
                        <title>Singlelink web client</title>
                        <meta charset="UTF-8">
                    </head>
                    <body>
                        <div class="w-full h-full flex flex-col items-center justify-center">
                            <h1 class="text-4xl text-gray-900 mb-2 font-extrabold">500 - Server Error</h1>
                            <h3 class="text-lg text-gray-600 mb-4">Oops! Something went wrong. Try again?</h3>
                            <a class="bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow text-white py-3 px-6 text-sm font-medium" href="` + request.url + `">Reload page</a>
                        </div>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.0.4/tailwind.min.css"/>
                        <style>
                            @import url('https://rsms.me/inter/inter.css');
                            html { font-family: 'Inter', sans-serif; }
                            @supports (font-variation-settings: normal) {
                            html { font-family: 'Inter var', sans-serif; }
                            }
                        </style>
                    </body>
                </html>
            `)
        }

        // Define site
        const site = response.data.profile;

        site.headline = site.headline ?? '';
''
        site.subtitle = site.subtitle ?? '';

        // Define user
        const user = response.data.user;

        // Define theme = response.data.theme;
        const theme = response.data.theme ?? {
            customCss: '',
            customHtml: '',
        };

        // Define Avatar image
        const imageUrl = site.imageUrl ?? user.avatarUrl ?? 'https://www.gravatar.com/avatar/' + user.emailHash;

        // Defin Link HTML Block
        let linkHtml = '';
        
        // Define links & sort by order
        const links = response.data.links.sort(function (a, b) {
            return a.sortOrder - b.sortOrder;
        });

        // Add link html to html block link-by-link
        for await (let link of links) {
            switch(link.type) {
                case 'link':
                    let subtitleHtml = '';
                    if(link.subtitle) subtitleHtml = `<span class="text-sm text-gray-700 sl-link-subtitle mt-1">` + link.subtitle + `</span>`;
                    let css = link.customCss ?? '';
                    linkHtml+= `
                        <a
                            id="sl-item-`+link.id+`"
                            href="` + api_url + '/analytics/link/' + link.id + `"
                            class="w-full sl-item-parent"
                            target="_blank"
                        >
                            <div
                                class="rounded-2xl shadow bg-white p-4 w-full font-medium mb-3 nc-link sl-item  flex items-center justify-center flex-col"
                                style="`+css+`"
                            >
                                <span class="font-medium text-gray-900 sl-label">` + link.label + `</span>` + subtitleHtml + `
                            </div>
                        </a>
                    `;
                    break;
                case 'image':
                    linkHtml += `
                        <img id="sl-item-`+link.id+`" src="` + link.url + `" class="w-full h-auto"/>
                    `
                    break;
                case 'divider':
                    linkHtml += '<div class="w-full bg-black" style="opacity:.15;height:1px;"></div>'
                    break;
            }
        }

        // Define headline HTML
        const headlineHtml = `<h1 class="text-black font-semibold text-2xl sl-headline">` + site.headline + `</h1>`;

        // Define subtitle HTML
        let subtitleHtml = ``;
        if(site.subtitle) subtitleHtml = `<h3 class="text-gray-600 mb-4 sl-subtitle">` + site.subtitle + `</h3>`;

        // Define theme colors html
        let themeColorsHtml = ``;
        if(theme && theme.colors) themeColorsHtml = `
        <style>
            .sl-headline {
                color: ` + theme.colors.text.primary + `;
            }
            .sl-subtitle {
                opacity: .85;
                color: ` + theme.colors.text.primary + `;
            }
            .sl-bg {
                background: ` +theme.colors.fill.primary+ `;
            }
            .sl-item {
                background: ` + theme.colors.fill.secondary+ `;
            }
            .sl-label {
                color: ` + theme.colors.text.secondary+ `;
            }
            .sl-link-subtitle {
                opacity: .85;
                color: ` + theme.colors.text.secondary+ `;
            }
        </style>`;

        // Build watermark string
        let watermarkHtml = '';
        watermarkHtml += `<div id="sl-watermark" class="flex flex-col items-center justify-center">`;
        if(theme && theme.colors) {
        watermarkHtml += `
        <div style="color: ` + theme.colors.text.primary + `;max-width:230px;" class="mt-4 mb-2 mx-auto text-sm" >
          Proudly built with ` + app_name + `, the open-source Linktree alternative
        </div>`;
        } else {
        watermarkHtml += `
        <div v-else style="color:rgba(0,0,0,1);max-width:230px;" class="mt-4 mb-2 mx-auto text-sm">
          Proudly built with ` + app_name + `, the open-source Linktree alternative
        </div>`;
        }
            watermarkHtml += `
            <a class="text-indigo-600 hover-underline text-sm" href="https://` + hostname + `/create-account" target="_blank">
                Create your free micro-site in minutes!
            </a>`;
        watermarkHtml += `<base target="_blank">`;
        watermarkHtml += `</div>`;

        if(site.customCss === null) site.customCss = '';
        if(site.customHtml === null) site.customHtml = '';
        if(theme.customCss === null) theme.customCss = '';
        if(theme.customHtml === null) theme.customHtml = '';

        // Send response content type to text/html
        reply.type('text/html');

        // Send response to client
        return reply.send(`
            <html>
                <head>
                    <title>` + site.headline + ` - Singlelink</title>
                    <meta charset="UTF-8">
                    <meta data-n-head="ssr" name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
                    <meta data-n-head="ssr" data-hid="title" name="title" content="` + site.headline + ` - Singlelink">
                    <meta data-n-head="ssr" data-hid="og:title" name="og:title" content="` + site.headline + ` - Singlelink">
                    <meta data-n-head="ssr" data-hid="twitter:title" name="twitter:title" content="` + site.headline + ` - Singlelink">
                    <meta data-n-head="ssr" data-hid="description" name="description" content="` + site.subtitle + ` | Powered by Singlelink, the open-source Linktree alternative.">
                    <meta data-n-head="ssr" data-hid="og:description" name="og:description" content="` + site.subtitle + ` | Powered by Singlelink, the open-source Linktree alternative.">
                    <meta data-n-head="ssr" data-hid="twitter:description" name="twitter:description" content="` + site.subtitle + ` | Powered by Singlelink, the open-source Linktree alternative.">
                    <meta data-n-head="ssr" data-hid="og:image" name="og:image" content="https://api.singlelink.co/profile/thumbnail/` + handle + `"><meta data-n-head="ssr" data-hid="twitter:image" name="twitter:image" content="https://api.singlelink.co/profile/thumbnail/jim">
                    <meta data-n-head="ssr" data-hid="twitter:url" name="twitter:url" content="https://app.singlelink.co/u/` + handle + `">
                    <meta data-n-head="ssr" data-hid="twitter:card" name="twitter:card" content="summary_large_image">
                    <link data-n-head="ssr" rel="icon" type="image/x-icon" href="https://singlelink.co/favicon.ico">
                    
                    <!-- Tailwind CSS -->
                                <!-- Theme style -->
                                <style type="text/css">
                                ` + theme.customCss + `
                                </style>
                                <!-- Personal styles -->
                                <style type="text/css">
                                ` + site.customCss + `
                                </style>
                                <style>
                                    html {font-size:16px;}
                                    .w-full {width:100%;}
                                    .w-screen {width:100vw;}
                                    .min-h-screen {min-height:100vh;}
                                    .bg-gray-100 {background-color:rgba(243,244,246,1);}
                                    .relative {position:relative;}
                                    .flex {display:flex;}
                                    .flex-col {flex-direction:column;}
                                    .items-center {align-items:center;}
                                    .justify-center {justify-content:center;}
                                    .text-center {text-align:center;}
                                    .mt-1 {margin-top:.25rem;}
                                    .mb-2 {margin-bottom:.5rem;}
                                    .mt-4 {margin-top:1rem;}
                                    .mb-4 {margin-bottom:1rem;}
                                    .p-4 {padding:1rem;}
                                    .p-6 {padding:1.5rem;}
                                    .pt-8 {padding-top:2rem;}
                                    .pb-8 {padding-bottom:2rem;}
                                    .max-w-sm {max-width:24rem;}
                                    .shadow {--tw-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),0 1px 2px 0 rgba(0, 0, 0, 0.06);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow);}
                                    .text-black {color:#000;}
                                    .font-medium {font-weight:500;}
                                    .font-semibold {font-weight:600;}
                                    .text-sm {font-size:0.875rem;line-height:1.25rem;}
                                    .text-2xl {font-size: 1.5rem;line-height: 2rem;}
                                    * {font-size: 1rem;line-height: 1.5rem;font-weight:400;}
                                    .rounded-2xl {border-radius: 1rem;}
                                    .text-gray-600 {--tw-text-opacity:1;color:rgba(75, 85, 99, var(--tw-text-opacity));}
                                    .text-gray-700 {--tw-text-opacity:1;color:rgba(55, 65, 81, var(--tw-text-opacity));}
                                    .text-indigo-600 {color:#5850ec;}
                                    .mx-auto {margin-left:auto;margin-right:auto;}
                                    .sl-item-parent {
                                        text-decoration:none;
                                    }
                                    .hover-underline {text-decoration:none;}
                                    .hover-underline:hover {text-decoration: underline;}
                                </style>
                                <style>
                                    .nc-avatar {
                                        width: 60px;
                                        height: 60px;
                                        border-radius: 1000px;
                                    }
                                    .nc-link {
                                        background-color: #FFF;
                                        padding: 1rem;
                                        margin-bottom: .75rem;
                                        width: 100%;
                                        border-radius: .25rem;
                                        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px 0 rgb(0 0 0 / 6%);
                                        font-weight: 500;
                                        cursor: pointer;
                                        transition: transform .15s ease-in-out;
                                    }
                                    .nc-link:hover {
                                        transform: scale(1.02);
                                    }
                                    .nc-link:active {
                                        transform: scale(1);
                                    }
                                    body {
                                        overflow-x: hidden;
                                    }
                                </style>
                                <style>
                                html, * {
                                    font-family: 'Inter',
                                    -apple-system,
                                    BlinkMacSystemFont,
                                    'Segoe UI',
                                    Roboto,
                                    'Helvetica Neue',
                                    Arial,
                                    sans-serif;
                                    font-size: 16px;
                                    line-height: 1.65;
                                    word-spacing: 1px;
                                    -ms-text-size-adjust: 100%;
                                    -webkit-text-size-adjust: 100%;
                                    -moz-osx-font-smoothing: grayscale;
                                    -webkit-font-smoothing: antialiased;
                                    box-sizing: border-box;
                                }
                                h1.sl-headline, h3.sl-subtitle {
                                    line-height: 1.65;
                                    word-spacing: 1px;
                                    -ms-text-size-adjust: 100%;
                                    -webkit-text-size-adjust: 100%;
                                    -moz-osx-font-smoothing: grayscale;
                                    -webkit-font-smoothing: antialiased;
                                }
                                *,
                                *::before,
                                *::after {
                                box-sizing: border-box;
                                margin: 0;
                                }
                            </style>
                </head>
                <body>
                    <div class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg">
                        <div
                            id="user-site-view"
                            class="relative flex min-h-screen w-screen bg-gray-100 justify-center w-full sl-bg"
                        >
                            <section class="flex flex-col p-6 pt-8 pb-8 items-center text-center max-w-sm w-full">
                                <img class="nc-avatar mb-2" src="` + imageUrl + `" />
                                ` + headlineHtml + `
                                ` + subtitleHtml + `
                                ` + linkHtml + `
                                <!-- Site html -->
                                <div id="custom-html">
                                ` + site.customHtml + `
                                </div>
                                <!-- Theme html -->
                                <div id="theme-html">
                                ` + theme.customHtml + `
                                </div>
                                <!-- Watermark -->
                                ` + watermarkHtml + `
                                ` + themeColorsHtml + `
                                
                            </section>
                        </div>
                    </div>
                </body>
            </html>
        `);
    }
});

// Run the server!
const start = async () => {
  try {
    console.clear();
    console.log(chalk.cyan.bold(app_name) + ': Starting application...')
    await fastify.listen(port, host)
    console.log(chalk.cyan.bold(app_name) + ': Application listening on port ' + port);
  } catch (err) {
    console.log(chalk.cyan.bold(app_name) + ': Error!');
    console.log(chalk.cyan.bold(app_name) + ': ' + err);
    process.exit(1)
  }
}
start()