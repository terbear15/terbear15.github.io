# Portfolio website

A plain HTML/CSS static site. No build step, no dependencies.

## Files

- `index.html` — home page: hero, data & web projects, architecture, about, contact
- `project-template.html` — copy this for each project page
- `style.css` — all styling; colors and fonts are at the top in `:root`

## Put it online with GitHub Pages

1. Create a GitHub repository. For a personal site, name it `your-username.github.io`.
2. Upload these files to the repository's main branch.
3. Go to **Settings → Pages**, set the source to **Deploy from a branch**, choose `main` and `/ (root)`, and save.
4. After a minute or two the site is live at `https://your-username.github.io`.

## Adding a project

1. Copy `project-template.html` to something like `project-housing-map.html` and fill it in.
2. In `index.html`, copy one `<a class="card">` block and point its `href` at the new file.
3. Put images in an `images/` folder and swap the gradient `<div class="thumb">` for
   `<img class="thumb" src="images/your-file.jpg" alt="Short description">`.

## Embedding maps from Python

Folium, Plotly and Kepler.gl can all export a standalone `.html` file. Save it in a `maps/`
folder and embed it with an `<iframe class="map-embed" src="maps/your-map.html"></iframe>`.

## Image tips for the architecture section

Export images as JPG at around 1600px wide and keep each under about 400 KB, so pages load fast.
