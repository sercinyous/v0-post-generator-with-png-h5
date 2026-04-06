'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, X } from 'lucide-react'

const FORMATS = {
  storyImage: { width: 1080, height: 1920, label: "Story Görsel" },
  storyText: { width: 1080, height: 1920, label: "Story Metin" },
  reelsCover: { width: 1080, height: 1920, label: "Reels Kapak" },
}

export function StoryReelsSettings() {
  const [openFormat, setOpenFormat] = useState<'storyImage' | 'storyText' | 'reelsCover' | null>(null)
  
  const [settings, setSettings] = useState({
    storyImage: {
      logoX: 60, logoY: 60, logoSize: 120,
      textX: 60, textRight: 60, textY: 180,
      gradientOpacity: 90, gradientPosition: 50, topGradientOpacity: 35,
      imageBlur: 0, fontWeight: "700", darkTheme: false,
    },
    storyText: {
      logoX: 480, logoY: 1750, logoSize: 120,
      textX: 80, textRight: 80, textY: 450,
      gradientOpacity: 0, gradientPosition: 0, topGradientOpacity: 0,
      imageBlur: 0, fontWeight: "700", darkTheme: false,
    },
    reelsCover: {
      logoX: 60, logoY: 60, logoSize: 120,
      textX: 60, textRight: 60, textY: 200,
      gradientOpacity: 85, gradientPosition: 50, topGradientOpacity: 30,
      imageBlur: 0, fontWeight: "700", darkTheme: false,
    },
  })

  const updateSetting = (format: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [format]: {
        ...prev[format],
        [key]: value,
      },
    }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Story & Reels Ayarları</h2>
      
      {(Object.keys(FORMATS) as Array<keyof typeof FORMATS>).map(format => (
        <Card key={format} className="overflow-hidden">
          <button
            onClick={() => setOpenFormat(openFormat === format ? null : format)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="text-left">
              <h3 className="font-semibold">{FORMATS[format].label}</h3>
              <p className="text-xs text-gray-500">{FORMATS[format].width}x{FORMATS[format].height}</p>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${openFormat === format ? 'rotate-180' : ''}`}
            />
          </button>

          {openFormat === format && (
            <div className="p-4 border-t space-y-4 bg-gray-50">
              {/* Logo Settings */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Logo</h4>
                <div className="space-y-3">
                  {['logoX', 'logoY', 'logoSize'].map(key => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {key === 'logoX' ? 'Soldan (X)' : key === 'logoY' ? 'Yukarıdan (Y)' : 'Boyut'}
                        </span>
                        <span className="font-mono">{(settings[format] as any)[key]}px</span>
                      </div>
                      <input
                        type="range"
                        min={key === 'logoSize' ? '50' : '0'}
                        max={key === 'logoSize' ? '600' : '1080'}
                        value={(settings[format] as any)[key]}
                        onChange={(e) => updateSetting(format, key, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Text Settings */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Metin</h4>
                <div className="space-y-3">
                  {['textX', 'textRight', 'textY'].map(key => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {key === 'textX' ? 'Soldan (X)' : key === 'textRight' ? 'Sağdan' : 'Alttan (Y)'}
                        </span>
                        <span className="font-mono">{(settings[format] as any)[key]}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="300"
                        value={(settings[format] as any)[key]}
                        onChange={(e) => updateSetting(format, key, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient Settings */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Gradient</h4>
                <div className="space-y-3">
                  {['gradientOpacity', 'gradientPosition', 'topGradientOpacity'].map(key => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {key === 'gradientOpacity' ? 'Opacity' : key === 'gradientPosition' ? 'Pozisyon' : 'Üst Opacity'}
                        </span>
                        <span className="font-mono">{(settings[format] as any)[key]}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(settings[format] as any)[key]}
                        onChange={(e) => updateSetting(format, key, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Settings */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Diğer</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={(settings[format] as any).imageBlur}
                      onChange={(e) => updateSetting(format, 'imageBlur', Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-600">Blur: {(settings[format] as any).imageBlur}</span>
                  </label>
                </div>
              </div>

              <Button className="w-full" size="sm">Kaydet</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
