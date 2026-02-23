import { handleCors, getKV } from './_helpers.js'
import { createESAHandler } from './_helpers.js'

// Generate SVG image captcha with noise
export async function onRequestGet() {
  const ops = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a, b, answer
  if (op === '+') {
    a = Math.floor(Math.random() * 30) + 1
    b = Math.floor(Math.random() * 30) + 1
    answer = a + b
  } else if (op === '-') {
    a = Math.floor(Math.random() * 30) + 10
    b = Math.floor(Math.random() * a)
    answer = a - b
  } else {
    a = Math.floor(Math.random() * 9) + 1
    b = Math.floor(Math.random() * 9) + 1
    answer = a * b
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const text = `${a} ${op} ${b} = ?`

  // Build SVG captcha image with noise lines and dots
  const w = 180, h = 50
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`
  svg += `<rect width="${w}" height="${h}" fill="#1a1a2e" rx="6"/>`

  // Random noise lines
  for (let i = 0; i < 5; i++) {
    const x1 = rand(0, w), y1 = rand(0, h), x2 = rand(0, w), y2 = rand(0, h)
    const c = randColor(0.25)
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${rand(1,2)}"/>`
  }

  // Random noise dots
  for (let i = 0; i < 30; i++) {
    const cx = rand(0, w), cy = rand(0, h)
    svg += `<circle cx="${cx}" cy="${cy}" r="${rand(1,2)}" fill="${randColor(0.3)}"/>`
  }

  // Draw each character with random rotation and offset
  const chars = text.split('')
  const startX = 14
  const spacing = (w - 28) / chars.length
  for (let i = 0; i < chars.length; i++) {
    const x = startX + i * spacing + rand(-3, 3)
    const y = h / 2 + rand(-4, 4)
    const rot = rand(-15, 15)
    const color = ['#c9a96e', '#e0c88a', '#f0ece6', '#d4b87d'][Math.floor(Math.random() * 4)]
    svg += `<text x="${x}" y="${y}" font-size="${rand(18, 24)}" font-family="monospace" fill="${color}" `
    svg += `transform="rotate(${rot},${x},${y})" dominant-baseline="central">${escXml(chars[i])}</text>`
  }

  // Curved noise line
  const cy1 = rand(10, h - 10), cy2 = rand(10, h - 10)
  svg += `<path d="M0,${cy1} Q${w/2},${rand(0,h)} ${w},${cy2}" fill="none" stroke="${randColor(0.3)}" stroke-width="1.5"/>`

  svg += '</svg>'

  const kv = getKV()
  await kv.put(`captcha:${id}`, JSON.stringify({ answer, exp: Date.now() + 300000 }))

  // Return SVG as base64 data URL
  const base64 = btoa(svg)
  return new Response(JSON.stringify({ id, image: `data:image/svg+xml;base64,${base64}` }), {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randColor(alpha) {
  return `rgba(${rand(100,255)},${rand(100,255)},${rand(100,255)},${alpha})`
}
function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function onRequestOptions() {
  return handleCors()
}

export default createESAHandler({ onRequestGet, onRequestOptions })