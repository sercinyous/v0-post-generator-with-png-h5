'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus, Download } from 'lucide-react'
import { createBatchExport } from '@/app/actions/db'

interface BatchItem {
  id: string
  text: string
  format: 'post' | 'storyImage' | 'storyText' | 'reelsCover'
}

export function BatchExportPanel({ user }: { user: any }) {
  const [items, setItems] = useState<BatchItem[]>([])
  const [newText, setNewText] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<'post'>('post')
  const [exporting, setExporting] = useState(false)

  const addItem = () => {
    if (!newText.trim()) return
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        text: newText,
        format: selectedFormat,
      },
    ])
    setNewText('')
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleBatchExport = async () => {
    if (items.length === 0) return
    setExporting(true)
    
    try {
      await createBatchExport(
        items.map(item => ({
          format: item.format,
          settings: {}, // Default settings
          text_content: item.text,
          image_url: null,
        }))
      )
      alert(`${items.length} görsel export kuyruğuna eklendi!`)
      setItems([])
    } catch (error) {
      console.error('Export error:', error)
      alert('Export başarısız')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Toplu Export</h3>
      
      <div className="space-y-3">
        <Textarea
          placeholder="Görsel metni girin..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={3}
        />
        
        <div className="flex gap-2">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as 'post')}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          >
            <option value="post">Post</option>
            <option value="storyImage">Story Görsel</option>
            <option value="storyText">Story Metin</option>
            <option value="reelsCover">Reels Kapak</option>
          </select>
          
          <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Ekle
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-sm"
            >
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">{item.format}</p>
                <p className="line-clamp-2">{item.text}</p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 hover:bg-red-100 rounded ml-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleBatchExport}
        disabled={items.length === 0 || exporting}
        className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Download className="h-4 w-4" />
        {exporting ? 'İşleniyor...' : `${items.length} Görseli Export Et`}
      </Button>
    </Card>
  )
}
