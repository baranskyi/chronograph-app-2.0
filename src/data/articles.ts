import { marked, type Tokens } from 'marked'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const renderer = {
  heading({ tokens, depth }: Tokens.Heading) {
    const text = this.parser.parseInline(tokens)
    const id = slugify(text)
    return `<h${depth} id="${id}">${text}</h${depth}>\n`
  }
}

marked.use({ renderer })

import conferenceArticleMd from './articles/conference-multi-room-time-tracking.md?raw'
import messagingArticleMd from './articles/sending-messages-to-speakers.md?raw'
import obsArticleMd from './articles/obs-studio-streaming-timer.md?raw'
import churchEducationArticleMd from './articles/churches-and-education.md?raw'
import sportsArticleMd from './articles/sports-competition-timing.md?raw'

export interface Article {
  id: number
  slug: string
  title: string
  description: string
  coverImage: string
  readTime: string
  category: string
  date: string
  content: string
}

function md(raw: string): string {
  return marked.parse(raw, { async: false }) as string
}

export const articles: Article[] = [
  {
    id: 1,
    slug: 'conference-multi-room-time-tracking',
    title: 'How to Organize Speaker Time Tracking Across Multiple Conference Rooms',
    description: 'A complete guide for conference organizers on setting up and managing time tracking for speakers across multiple halls and breakout rooms simultaneously.',
    coverImage: '/images/kb/cover-conference.webp',
    readTime: '8 min read',
    category: 'Conferences',
    date: '2026-02-09',
    content: md(conferenceArticleMd)
  },
  {
    id: 2,
    slug: 'sending-messages-to-speakers',
    title: 'How to Send Real-Time Messages to Speakers During Events',
    description: 'Learn how to use Chronograph.pro\'s message overlay feature to communicate with speakers in real-time without disrupting their presentations.',
    coverImage: '/images/kb/cover-messaging.webp',
    readTime: '6 min read',
    category: 'Features',
    date: '2026-02-09',
    content: md(messagingArticleMd)
  },
  {
    id: 3,
    slug: 'obs-studio-streaming-timer',
    title: 'How to Stream Speaker Time to Online Audiences with OBS Studio',
    description: 'Step-by-step guide to integrating Chronograph.pro timer displays into your OBS Studio setup for hybrid and virtual events.',
    coverImage: '/images/kb/cover-obs.webp',
    readTime: '10 min read',
    category: 'Integration',
    date: '2026-02-09',
    content: md(obsArticleMd)
  },
  {
    id: 4,
    slug: 'churches-and-education',
    title: 'Time Management for Churches and Educational Institutions with Chronograph.pro',
    description: 'Discover how churches keep services on schedule and educators manage classroom presentations, exams, and debates with professional timer tools.',
    coverImage: '/images/kb/cover-church-education.webp',
    readTime: '9 min read',
    category: 'Use Cases',
    date: '2026-02-09',
    content: md(churchEducationArticleMd)
  },
  {
    id: 5,
    slug: 'sports-competition-timing',
    title: 'Sports Competition Time Tracking with Chronograph.pro',
    description: 'From CrossFit WODs to martial arts tournaments — how to use professional timer displays for athletes, judges, and spectators.',
    coverImage: '/images/kb/cover-sports.webp',
    readTime: '8 min read',
    category: 'Use Cases',
    date: '2026-02-09',
    content: md(sportsArticleMd)
  }
]

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug)
}

export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractToc(html: string): TocItem[] {
  const items: TocItem[] = []
  const regex = /<h([23])\s+id="([^"]*)">(.*?)<\/h[23]>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    items.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]*>/g, '')
    })
  }
  return items
}
