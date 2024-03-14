/**
 * Load the character viewer and paste this into the dev console in firefox/chrome etc.
 * Copy the console output into index.html for some lipsum.
 * Note: Firefox adds extraneous "debug yadda yadda" one-liner to the output.
 */
;(() => {
  const start =
`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>View Character Data | Ephinea PSOBB</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cousine:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Mono:wght@400;500;700&family=Fragment+Mono:ital@0;1&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Martian+Mono:wght@100..800&family=Noto+Sans+Mono:wght@100..900&display=swap" rel="stylesheet">
  </head>
  <body style="margin: 0;">
    <div class="wrap container body" role="document">
      <div class="content row">`
      
const end = 
`     </div><!-- /.content -->
    </div><!-- /.wrap -->
    <script type="module" src="/main.js"></script>
  </body>
</html>`

console.log(`${start}${document.querySelector("main").outerHTML}${end}`)
})()