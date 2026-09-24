css = open('src/styles.css').read()
js = '\n'.join(open('src/'+f).read() for f in ['data.js', 'views.js', 'app.js'])
assert '</script' not in js.lower()
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Autograph for Intuit Enterprise Suite</title>
<meta name="description" content="Clickable prototype: AI agents earn signing authority in Intuit Enterprise Suite. People sign what matters.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✍️</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Mrs+Saint+Delafield&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<div id="root"></div>
<script>
{js}
</script>
</body>
</html>
'''
open('index.html', 'w').write(html)

print(len(html), 'bytes')
