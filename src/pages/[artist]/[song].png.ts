import type { APIRoute } from 'astro'
import { getCollection, type CollectionEntry } from 'astro:content'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { slugify } from '../../utils/helpers'

export const GET: APIRoute = async ({ props }) => {
  const review = props.review as CollectionEntry<'reviews'>

  const fontSansBold = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf')
  const fontSansRegular = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf')
  
  if (!fontSansBold.ok || !fontSansRegular.ok) {
    throw new Error('Failed to fetch fonts')
  }

  const fontSansBoldData = await fontSansBold.arrayBuffer()
  const fontSansRegularData = await fontSansRegular.arrayBuffer()

  const score = review.data.final_score
  let ratingLabel = 'MEDIOCRE'
  let scoreColor = '#fbbf24' // Yellow

  if (score >= 9) {
    ratingLabel = 'MASTERPIECE'
    scoreColor = '#facc15' // Gold
  } else if (score >= 8) {
    ratingLabel = 'EXCELLENT'
    scoreColor = '#4ade80' // Green
  } else if (score >= 6) {
    ratingLabel = 'GOOD'
    scoreColor = '#38bdf8' // Blue
  } else if (score < 5) {
    ratingLabel = 'TRASH'
    scoreColor = '#f87171' // Red
  }

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          height: '100%',
          width: '100%',
          backgroundColor: '#050505', // Almost Black
          padding: '60px',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row',
          fontFamily: 'Inter',
        },
        children: [
          // LEFT COLUMN
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                maxWidth: '65%',
              },
              children: [
                // Top Content
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          children: 'Lyrics Review & Analysis',
                          style: {
                            fontSize: '28px',
                            color: '#22d3ee', // Cyan
                            marginBottom: '20px',
                            fontWeight: 400,
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          children: review.data.song,
                          style: {
                            fontSize: '94px',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1,
                            marginBottom: '20px',
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          children: review.data.artist_id.replace(/-/g, ' '),
                          style: {
                            fontSize: '40px',
                            fontWeight: 700,
                            color: '#22d3ee', // Cyan
                            textTransform: 'capitalize',
                          },
                        },
                      },
                    ]
                  }
                },
                // Bottom Content
                {
                   type: 'div',
                   props: {
                     children: 'songautopsy.online',
                     style: {
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#ffffff',
                     }
                   }
                }
              ],
            },
          },

          // RIGHT COLUMN (SCORE CARD)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                width: '380px',
                height: '380px',
                backgroundColor: '#000000',
                border: '2px solid #27272a', // Zinc 800
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              },
              children: [
                // Number Area
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    children: {
                       type: 'div',
                       props: {
                          children: score.toFixed(1),
                          style: {
                             fontSize: '160px',
                             fontWeight: 700,
                             color: scoreColor,
                             letterSpacing: '-0.05em',
                          }
                       }
                    }
                  }
                },
                // Label Wrapper
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            height: '80px',
                            backgroundColor: '#0a0a0a', // Slightly lighter than black
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTop: '1px solid #27272a',
                        },
                        children: {
                            type: 'div',
                            props: {
                                children: ratingLabel,
                                style: {
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    color: scoreColor,
                                    letterSpacing: '0.1em',
                                }
                            }
                        }
                    }
                }
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontSansBoldData,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: fontSansRegularData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  )

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })
  
  const buffer = resvg.render().asPng()

  return new Response(buffer as any, {
    headers: {
      'Content-Type': 'image/png',
      // Cache for 1 year (immutable)
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

export async function getStaticPaths() {
  const reviews = await getCollection('reviews')
  
  return reviews.map((review) => {
    const [artist, songWithExt] = review.id.split('/')
    const song = songWithExt.replace(/\.md$/, '')
    
    return {
      params: { artist, song },
      props: { review },
    }
  })
}
