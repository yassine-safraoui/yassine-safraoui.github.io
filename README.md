# Portfolio

Static personal site built with Hugo using a fork of:

- Original template: https://github.com/gurusabarish/hugo-profile
- Fork (this project’s base): https://github.com/yassine-safraoui/yassine-hugo-profile

## Prerequisites

- Go (Prerequisite of Hugo) https://go.dev/doc/install
- Hugo https://gohugo.io/installation/

## Development

Start local server (auto-reload enabled):
hugo server --config config.yaml

Open: http://localhost:1313

## Build

Generate production files into /public:
hugo --config config.yaml

## Customize

Edit content/ and config.yaml. Override template assets in layouts/ as needed.

## Deploy

Serve the generated public/ directory (e.g., via GitHub Pages, Netlify, or any static host).
