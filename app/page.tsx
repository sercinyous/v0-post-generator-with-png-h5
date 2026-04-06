"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Download, Type, Layers, Bold, Moon, Sun, ChevronDown, Settings, X, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { 
  getTemplates, 
  saveTemplate, 
  deleteTemplate, 
  getBatchExports,
  createBatchExport
} from "@/app/actions/db"

// Format configurations
type FormatType = "post" | "storyText" | "reelsCover"

interface FormatConfig {
  width: number
  height: number
  label: string
  ratio: string
  hasImage: boolean
  hasLogo: boolean
  hasDivider: boolean
  hasSwipeIndicator: boolean
}

const FORMATS: Record<FormatType, FormatConfig> = {
  post: { 
    width: 1080, height: 1350, label: "Post", ratio: "1080/1350", 
    hasImage: true, hasLogo: true, hasDivider: true, hasSwipeIndicator: true 
  },
  storyText: { 
    width: 1080, height: 1920, label: "Story Metin", ratio: "1080/1920", 
    hasImage: false, hasLogo: true, hasDivider: false, hasSwipeIndicator: false 
  },
  reelsCover: { 
    width: 1080, height: 1920, label: "Reels Kapak", ratio: "1080/1920", 
    hasImage: true, hasLogo: true, hasDivider: false, hasSwipeIndicator: false 
  },
}

// Default settings for each format (isolated)
interface FormatSettings {
  logoX: number
  logoY: number
  logoSize: number
  textX: number
  textRight: number
  textY: number
  fontSize: number
  fontStyle: "normal" | "italic"
  gradientOpacity: number
  gradientPosition: number
  topGradientOpacity: number
  imageBlur: number
  imageOffsetX: number
  imageOffsetY: number
  imageScale: number
  fontWeight: "300" | "400" | "500" | "600" | "700" | "800" | "900"
  fontFamily: "Gilroy-Light" | "Gilroy-Regular" | "Gilroy-Medium" | "Gilroy-Bold" | "Gilroy-Heavy"
  darkTheme: boolean
  dividerStartY: number
  dividerGap: number
  dividerBottomY: number
  textAlign?: "left" | "center" | "right"
  gradientColor1?: string
  gradientColor2?: string
  showSwipe?: boolean
  swipeX?: number
  swipeY?: number
  swipeSize?: number
}

const DEFAULT_SETTINGS: Record<FormatType, FormatSettings> = {
  post: {
    logoX: 90, logoY: 90, logoSize: 500,
    textX: 80, textRight: 0, textY: 240, fontSize: 48, fontStyle: "normal",
    gradientOpacity: 100, gradientPosition: 45, topGradientOpacity: 50,
    imageBlur: 0, imageOffsetX: 50, imageOffsetY: 50, imageScale: 100, fontWeight: "700", fontFamily: "Gilroy-Bold", darkTheme: false,
    dividerStartY: 230, dividerGap: 40, dividerBottomY: 900,
    gradientColor1: "#04041e", gradientColor2: "#4F46E5",
    showSwipe: true, swipeX: 88, swipeY: 88, swipeSize: 120
  },
  storyText: {
    logoX: 90, logoY: 1700, logoSize: 900,
    textX: 80, textRight: 80, textY: 0, fontSize: 56, fontStyle: "normal", textAlign: "center",
    gradientOpacity: 50, gradientPosition: 0, topGradientOpacity: 0,
    imageBlur: 0, imageOffsetX: 50, imageOffsetY: 50, imageScale: 100, fontWeight: "700", fontFamily: "Gilroy-Bold", darkTheme: false,
    dividerStartY: 0, dividerGap: 0, dividerBottomY: 0,
    gradientColor1: "#04041e", gradientColor2: "#04041e"
  },
  reelsCover: {
    logoX: 480, logoY: 60, logoSize: 120,
    textX: 40, textRight: 40, textY: 180, fontSize: 36, fontStyle: "italic", textAlign: "center",
    gradientOpacity: 100, gradientPosition: 50, topGradientOpacity: 40,
    imageBlur: 0, imageOffsetX: 50, imageOffsetY: 50, imageScale: 100, fontWeight: "700", fontFamily: "Gilroy-Bold", darkTheme: false,
    dividerStartY: 0, dividerGap: 0, dividerBottomY: 0,
    gradientColor1: "#04041e", gradientColor2: "#04041e"
  },
}

export default function PostGenerator() {
  // Current format
  const [format, setFormat] = useState<FormatType>("post")
  
  // Panel theme (light/dark)
  const [panelTheme, setPanelTheme] = useState<"light" | "dark">("light")
  
  // Per-format settings (isolated)
  const [allSettings, setAllSettings] = useState<Record<FormatType, FormatSettings>>(DEFAULT_SETTINGS)
  
  // Lock state for each format
  const [allLocked, setAllLocked] = useState<Record<FormatType, boolean>>({
    post: false, storyText: false, reelsCover: false
  })
  
  const isLocked = allLocked[format]
  
  // Per-format images (isolated)
  const [allImages, setAllImages] = useState<Record<FormatType, string | null>>({
    post: null, storyText: null, reelsCover: null
  })
  
  // Per-format text (isolated)
  const [allTexts, setAllTexts] = useState<Record<FormatType, string>>({
    post: "Besiktas'da Hyeon-gyu Oh, mac oncesi yineciplak ayaklarla sahaya cikti.",
    storyText: "SON DAKİKA\n\nStory metin içeriği buraya gelecek.",
    reelsCover: "Reels kapak metni buraya..."
  })
  
  // Safe zone visibility (per-format)
  const [allShowSafeZone, setAllShowSafeZone] = useState<Record<FormatType, boolean>>({
    post: false, storyText: false, reelsCover: false
  })
  
  const showSafeZone = allShowSafeZone[format]
  const setShowSafeZone = (value: boolean) => {
    setAllShowSafeZone(prev => ({ ...prev, [format]: value }))
  }
  
  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  // Ek Ayarlar accordion
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Measure real text height in preview for divider tracking
  useEffect(() => {
    if (!textPreviewRef.current) return
    const observer = new ResizeObserver(() => {
      if (textPreviewRef.current) {
        setTextPreviewHeight(textPreviewRef.current.offsetHeight)
      }
    })
    observer.observe(textPreviewRef.current)
    return () => observer.disconnect()
  }, [])

  // Load settings from Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Post
        const postRes = await fetch('/api/settings?format=post')
        if (postRes.ok) {
          const postData = await postRes.json()
          // Merge with defaults - settings bossa default kullan
          const mergedPost = { ...DEFAULT_SETTINGS.post, ...(postData.settings || {}) }
          setAllSettings(prev => ({ ...prev, post: mergedPost }))
          setAllLocked(prev => ({ ...prev, post: postData.locked ?? false }))
        }
        
        // Story Metin
        const storyRes = await fetch('/api/settings?format=storyText')
        if (storyRes.ok) {
          const storyData = await storyRes.json()
          const mergedStory = { ...DEFAULT_SETTINGS.storyText, ...(storyData.settings || {}) }
          setAllSettings(prev => ({ ...prev, storyText: mergedStory }))
          setAllLocked(prev => ({ ...prev, storyText: storyData.locked ?? false }))
        }
        
        // Reels Kapak
        const reelsRes = await fetch('/api/settings?format=reelsCover')
        if (reelsRes.ok) {
          const reelsData = await reelsRes.json()
          const mergedReels = { ...DEFAULT_SETTINGS.reelsCover, ...(reelsData.settings || {}) }
          setAllSettings(prev => ({ ...prev, reelsCover: mergedReels }))
          setAllLocked(prev => ({ ...prev, reelsCover: reelsData.locked ?? false }))
        }
      } catch (err) {
        console.error("Failed to load settings from Supabase:", err)
      }
    }
    
    loadSettings()
  }, [])
  
  // updateSetting - Kilitli ise değişiklik yapmaz
  const updateSetting = useCallback((key: keyof FormatSettings, value: any) => {
    if (isLocked) return
    setAllSettings(prev => ({
      ...prev,
      [format]: { ...prev[format], [key]: value }
    }))
  }, [format, isLocked])
  
  // Clear all localStorage data
  const clearAllData = () => {
    localStorage.removeItem("postGeneratorSettings")
    setAllSettings(DEFAULT_SETTINGS)
    setAllTexts({
      post: "Besiktas'da Hyeon-gyu Oh, mac oncesi yineciplak ayaklarla sahaya cikti.",
      storyText: "SON DAKİKA\n\nStory metin içeriği buraya gelecek.",
      reelsCover: "Reels kapak metni buraya..."
    })
    setAllImages({
      post: null,
      storyText: null,
      reelsCover: null
    })
  }
  
  // Get current format's settings
  const settings = allSettings[format]
  const image = allImages[format]
  const fullText = allTexts[format]
  
  // Update image for current format only
  const setImage = (img: string | null) => {
    setAllImages(prev => ({ ...prev, [format]: img }))
  }
  
  // Update text for current format only
  const setFullText = (text: string) => {
    setAllTexts(prev => ({ ...prev, [format]: text }))
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const textPreviewRef = useRef<HTMLDivElement>(null)
  const [textPreviewHeight, setTextPreviewHeight] = useState(130)

  // Current format config
  const formatConfig = FORMATS[format]
  const CANVAS_WIDTH = formatConfig.width
  const CANVAS_HEIGHT = formatConfig.height

  const hexToRGB = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  }

  // Siyah Mod aciksa siyah, degilse #04041e
  const gradientRGB = (settings.darkTheme ?? false) ? "0,0,0" : hexToRGB(settings.gradientColor1 ?? "#04041e")

  // Toggle bold for selected text
  const toggleBold = () => {
    if (!textareaRef.current) return
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = fullText.substring(start, end)
    
    if (!selectedText) return
    
    const isBold = selectedText.startsWith("**") && selectedText.endsWith("**")
    const newText = isBold 
      ? selectedText.slice(2, -2)
      : `**${selectedText}**`
    
    const updated = fullText.substring(0, start) + newText + fullText.substring(end)
    setFullText(updated)
  }

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setImage(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [format])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => setImage(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }, [format])

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), [])

  // Export PNG - render preview to exact resolution
  const exportPNG = useCallback(async () => {
    if (!previewRef.current) return

    try {
      const el = previewRef.current
      const rect = el.getBoundingClientRect()
      
      // Get actual element dimensions from DOM
      const actualWidth = rect.width
      const actualHeight = rect.height
      
      // Calculate scale to reach exact canvas resolution
      const scaleX = CANVAS_WIDTH / actualWidth
      const scaleY = CANVAS_HEIGHT / actualHeight
      const scale = Math.max(scaleX, scaleY)

      // Dynamic import for client-side rendering
      const htmlToImage = await import("html-to-image")
      const toPng = htmlToImage.toPng

      const dataUrl = await toPng(el, {
        width: actualWidth,
        height: actualHeight,
        pixelRatio: scale,
        cacheBust: true,
        style: {
          borderRadius: "0",
          border: "none",
        },
      })

      const link = document.createElement("a")
      link.download = `${format}-${CANVAS_WIDTH}x${CANVAS_HEIGHT}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Export error:", err)
      alert("Export başarısız oldu. Lütfen tekrar deneyin.")
    }
  }, [format, CANVAS_WIDTH, CANVAS_HEIGHT])

  // Render formatted preview text
  const renderFormattedPreview = (text: string) => {
    const parts: { text: string; bold: boolean }[] = []
    const regex = /\*\*(.*?)\*\*/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), bold: false })
      }
      parts.push({ text: match[1], bold: true })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), bold: false })
    }

    return parts.map((part, i) => (
      <span key={i} style={{
        fontWeight: part.bold ? "700" : settings.fontWeight,
        fontFamily: `'${settings.fontFamily ?? "Gilroy-Bold"}', 'Gilroy', sans-serif`
      }}>
        {part.text}
      </span>
    ))
  }

  const fontWeightOptions: { label: string; value: "300" | "400" | "500" | "600" | "700" | "800" | "900" }[] = [
    { label: "Light", value: "300" },
    { label: "Regular", value: "400" },
    { label: "Medium", value: "500" },
    { label: "Semibold", value: "600" },
    { label: "Bold", value: "700" },
    { label: "Extrabold", value: "800" },
    { label: "Black", value: "900" },
  ]

  // Panel theme classes
  const panelBg = panelTheme === "dark" ? "bg-gray-900" : "bg-background"
  const panelText = panelTheme === "dark" ? "text-white" : "text-foreground"
  const cardBg = panelTheme === "dark" ? "bg-gray-800 border-gray-700" : ""

  return (
    <main className={`min-h-screen ${panelBg} p-4 md:p-8 transition-colors`}>
      <div className="mx-auto max-w-6xl">
        {/* Header with Theme Toggle */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${panelText} md:text-3xl`}>Taslak Oluşturucu</h1>
          <button
            onClick={() => setPanelTheme(panelTheme === "light" ? "dark" : "light")}
            className={`p-2 rounded-lg transition-colors ${panelTheme === "dark" ? "bg-gray-700 text-yellow-400 hover:bg-gray-600" : "bg-secondary text-foreground hover:bg-muted"}`}
            title={panelTheme === "light" ? "Gece Modu" : "Gündüz Modu"}
          >
            {panelTheme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </header>

        {/* Format Selector - 4 Buttons */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {(Object.keys(FORMATS) as FormatType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                format === f 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : panelTheme === "dark" 
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                    : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {FORMATS[f].label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
          <div className="mb-6 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showSafeZone
                  ? "bg-red-500 text-white"
                  : panelTheme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              Safe Zone
            </button>
            {format === "post" && (
              <button
                onClick={() => updateSetting("showSwipe", !(settings.showSwipe ?? true))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  (settings.showSwipe ?? true)
                    ? "bg-primary text-primary-foreground"
                    : panelTheme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
              >
                <img src="/yana-kaydir.png" alt="" className="h-3 w-auto" />
                Yana Kaydır
              </button>
            )}
            {formatConfig.hasImage && (
              <button
                onClick={() => updateSetting("darkTheme", !settings.darkTheme)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  settings.darkTheme
                    ? "bg-primary text-primary-foreground"
                    : panelTheme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
              >
                Siyah Tema
              </button>
            )}
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                panelTheme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Ayarlar
            </button>
          </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Preview */}
          <div className="flex items-start justify-center">
            <div
              ref={previewRef}
              className="relative overflow-hidden rounded-lg border-0 shadow-2xl transition-all duration-300"
              style={{ 
                aspectRatio: formatConfig.ratio, 
                width: format === "post" ? "500px" : format === "reelsCover" ? "480px" : "350px",
                containerType: "inline-size"
              }}
            >
              {/* Background */}
              <div className="absolute inset-0" style={{ backgroundColor: (settings.darkTheme ?? false) ? "#000000" : (settings.gradientColor1 ?? "#04041e") }}>
                {format === "storyText" ? (
                  <img
                    src="/resimsiz-haber-bg.png"
                    alt="Story arka plan"
                    className="h-full w-full object-cover"
                  />
                ) : formatConfig.hasImage ? (
                  <img
                    src={image || "/default-bg.webp"}
                    alt="Arka plan"
                    className="absolute inset-0 w-full h-full"
                    style={{
                      objectFit: "cover",
                      objectPosition: `${settings.imageOffsetX ?? 50}% ${settings.imageOffsetY ?? 50}%`,
                      transform: `scale(${(settings.imageScale ?? 100) / 100})`,
                      transformOrigin: `${settings.imageOffsetX ?? 50}% ${settings.imageOffsetY ?? 50}%`,
                      filter: settings.imageBlur > 0 ? `blur(${settings.imageBlur * 0.15}px)` : "none"
                    }}
                  />
                ) : null}
              </div>

              {/* Gradient Overlays */}
              {format === "storyText" ? (
                /* Story Metin: tum ekrani kaplayan tek renk gradyan */
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: `rgba(${gradientRGB},${settings.gradientOpacity / 100})` }}
                />
              ) : (
                /* Post + Reels Kapak: alt-ust gradyan */
                <>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `linear-gradient(to bottom, rgba(${gradientRGB},${settings.topGradientOpacity / 100}) 0%, rgba(${gradientRGB},0) 50%)` }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `linear-gradient(to bottom, transparent ${settings.gradientPosition}%, rgba(${gradientRGB},${(settings.gradientOpacity / 100) * 0.85}) ${(settings.gradientPosition + 100) / 2}%, rgba(${gradientRGB},${settings.gradientOpacity / 100}) 100%)` }}
                  />
                </>
              )}

              {/* StoryText Badge */}
              {format === "storyText" && (
                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "38%" }}>
                  <img src="/sondakika-badge.png" alt="SON DAKİKA" className="h-8" />
                </div>
              )}

              {/* Logo */}
              {formatConfig.hasLogo && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: `${(settings.logoY / CANVAS_HEIGHT) * 100}%`,
                    left: `${(settings.logoX / CANVAS_WIDTH) * 100}%`,
                    width: `${(settings.logoSize / CANVAS_WIDTH) * 100}%`,
                    height: "auto"
                  }}
                >
                  <img 
                    src={format === "storyText" ? "/pusholder-logo.png" : "/bell-logo.png"}
                    alt="Logo" 
                    className="w-full h-auto block"
                  />
                </div>
              )}

              {/* Left Divider - Post only, bottom tracks real text top */}
              {format === "post" && (() => {
                const lineStartY = settings.dividerStartY
                const preview = previewRef.current
                const textEl = textPreviewRef.current
                if (!preview || !textEl) return null
                const previewRect = preview.getBoundingClientRect()
                const textRect = textEl.getBoundingClientRect()
                // Text top relative to preview, scaled to canvas coords
                const relativeTextTop = textRect.top - previewRect.top
                const textTopInCanvas = (relativeTextTop / previewRect.height) * CANVAS_HEIGHT
                const lineEndY = textTopInCanvas - 20
                if (lineEndY > lineStartY + 30) {
                  return (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${(72 / CANVAS_WIDTH) * 100}%`,
                        top: `${(lineStartY / CANVAS_HEIGHT) * 100}%`,
                        width: "1px",
                        height: `${((lineEndY - lineStartY) / CANVAS_HEIGHT) * 100}%`,
                        background: "rgba(255,255,255,0.3)",
                      }}
                    />
                  )
                }
                return null
              })()}

              {/* Text */}
              <div
                ref={textPreviewRef}
                style={{
                  position: "absolute",
                  left: `${(settings.textX / CANVAS_WIDTH) * 100}%`,
                  right: `${(settings.textRight / CANVAS_WIDTH) * 100}%`,
                  ...(format === "storyText"
                    ? { top: "50%", transform: `translateY(calc(-50% + ${settings.textY}px))` }
                    : { bottom: `${(settings.textY / CANVAS_HEIGHT) * 100}%` }
                  ),
                  fontFamily: `'${settings.fontFamily ?? "Gilroy-Bold"}', 'Gilroy', sans-serif`,
                  fontSize: `${((settings.fontSize ?? 48) / CANVAS_WIDTH) * 100}cqw`,
                  fontWeight: settings.fontWeight,
                  fontStyle: settings.fontStyle || "normal",
                  lineHeight: "1.25",
                  color: "#ffffff",
                  textAlign: (format === "storyText" || format === "reelsCover") ? ((settings.textAlign ?? "left") as "left" | "center" | "right") : "left",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  textTransform: format === "reelsCover" ? "uppercase" : "none",
                }}
              >
                {renderFormattedPreview(fullText)}

                {/* Kırmızı separator - sadece storyText */}
                {format === "storyText" && (
                  <div
                    style={{
                      marginTop: "6%",
                      width: "100%",
                      height: "2px",
                      backgroundColor: "#e63535",
                      borderRadius: "2px",
                    }}
                  />
                )}
              </div>

              {/* IG Safe Zone - Post only */}
              {format === "post" && showSafeZone && (
                <>
                  {/* Top Safe Zone */}
                  <div
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: 0,
                      height: "13%",
                      background: "rgba(255,0,0,0.15)",
                      border: "1px dashed rgba(255,0,0,0.5)",
                    }}
                  />
                  {/* Bottom Safe Zone */}
                  <div
                    className="absolute left-0 right-0 bottom-0 pointer-events-none"
                    style={{
                      height: "12%",
                      background: "rgba(255,0,0,0.15)",
                      border: "1px dashed rgba(255,0,0,0.5)",
                    }}
                  />
                  {/* Left Safe Zone */}
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: 0,
                      width: "5%",
                      background: "rgba(255,0,0,0.15)",
                      border: "1px dashed rgba(255,0,0,0.5)",
                    }}
                  />
                  {/* Right Safe Zone */}
                  <div
                    className="absolute top-0 bottom-0 right-0 pointer-events-none"
                    style={{
                      width: "5%",
                      background: "rgba(255,0,0,0.15)",
                      border: "1px dashed rgba(255,0,0,0.5)",
                    }}
                  />
                </>
              )}

              {/* Divider */}
              {formatConfig.hasDivider && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${((CANVAS_WIDTH - 900) / 2 / CANVAS_WIDTH) * 100}%`,
                    bottom: `${((format === "post" ? 192 : 290) / CANVAS_HEIGHT) * 100}%`,
                    width: `${(900 / CANVAS_WIDTH) * 100}%`,
                  }}
                >
                  <img src="/altcizgi.png" alt="divider" className="w-full h-auto" />
                </div>
              )}

              {/* Swipe Indicator */}
              {formatConfig.hasSwipeIndicator && (settings.showSwipe ?? true) && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    right: `${100 - (settings.swipeX ?? 88)}%`,
                    bottom: `${100 - (settings.swipeY ?? 88)}%`,
                    width: `${((settings.swipeSize ?? 120) / FORMATS[format].width) * 100}%`,
                  }}
                >
                  <img src="/yana-kaydir.png" alt="Yana Kaydir" className="w-full h-auto block" />
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4">
            {/* Format Info */}
            <Card className={`p-3 ${cardBg}`}>
              <div className={`text-center ${panelText}`}>
                <span className="text-lg font-bold">{formatConfig.label}</span>
                <span className="text-sm text-muted-foreground ml-2">({formatConfig.width}x{formatConfig.height})</span>
              </div>
            </Card>

            {/* Left Divider Controls */}
            {/* Image Upload (for formats with image) */}
            {formatConfig.hasImage && (
              <Card className={`p-4 ${cardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="h-4 w-4 text-primary" />
                  <h3 className={`text-sm font-semibold ${panelText}`}>Görsel Yükle</h3>
                </div>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-border bg-secondary/50 p-4 text-center transition-colors hover:border-primary"
                >
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">Sürükle bırak veya tıkla</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                {image && (
                  <>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">Bulanıklaştır</Label>
                        <span className={`text-xs font-medium ${panelText}`}>{settings.imageBlur}</span>
                      </div>
                      <Slider value={[settings.imageBlur]} onValueChange={([v]) => updateSetting("imageBlur", v)} min={0} max={20} step={1} />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">Yatay Konum</Label>
                        <span className={`text-xs font-medium ${panelText}`}>{settings.imageOffsetX ?? 50}%</span>
                      </div>
                      <Slider value={[settings.imageOffsetX ?? 50]} onValueChange={([v]) => updateSetting("imageOffsetX", v)} min={0} max={100} step={1} />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">Dikey Konum</Label>
                        <span className={`text-xs font-medium ${panelText}`}>{settings.imageOffsetY ?? 50}%</span>
                      </div>
                      <Slider value={[settings.imageOffsetY ?? 50]} onValueChange={([v]) => updateSetting("imageOffsetY", v)} min={0} max={100} step={1} />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-xs text-muted-foreground">Yakınlaştır</Label>
                        <span className={`text-xs font-medium ${panelText}`}>{settings.imageScale ?? 100}%</span>
                      </div>
                      <Slider value={[settings.imageScale ?? 100]} onValueChange={([v]) => updateSetting("imageScale", v)} min={100} max={200} step={1} />
                    </div>
                  </>
                )}
              </Card>
            )}

          {/* Text Editor - moved outside conditional for all formats */}
          <Card className={`p-4 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-primary" />
              <h3 className={`text-sm font-semibold ${panelText}`}>Metin</h3>
            </div>
            
            <Textarea
              ref={textareaRef}
              value={fullText}
              onChange={(e) => setFullText(format === "reelsCover" ? e.target.value.toUpperCase() : e.target.value)}
              placeholder={format === "reelsCover" ? "METİN GİRİN..." : "Metin girin..."}
              rows={4}
              className="bg-secondary border-border resize-none text-sm"
              style={{
                fontFamily: `'${settings.fontFamily ?? "Gilroy-Bold"}', sans-serif`,
                textTransform: format === "reelsCover" ? "uppercase" : "none",
              }}
            />
          </Card>
            {/* Ek Ayarlar - Accordion */}
            {(formatConfig.hasImage || format === "post") && (
              <Card className={`p-4 ${cardBg}`}>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between hover:opacity-80 transition"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <h3 className={`text-sm font-semibold ${panelText}`}>Ek Ayarlar</h3>
                  </div>
                  <svg className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                
                {showAdvanced && (
                  <div className="space-y-4 mt-4">
                    {/* Gradient Controls */}
                    {formatConfig.hasImage && (
                      <>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <Label className="text-xs text-muted-foreground">Üst Kararma</Label>
                            <span className={`text-xs font-medium ${panelText}`}>{settings.topGradientOpacity}%</span>
                          </div>
                          <Slider value={[settings.topGradientOpacity]} onValueChange={([v]) => updateSetting("topGradientOpacity", v)} min={0} max={100} step={1} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <Label className="text-xs text-muted-foreground">Alt Opaklık</Label>
                            <span className={`text-xs font-medium ${panelText}`}>{settings.gradientOpacity}%</span>
                          </div>
                          <Slider value={[settings.gradientOpacity]} onValueChange={([v]) => updateSetting("gradientOpacity", v)} min={0} max={100} step={1} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <Label className="text-xs text-muted-foreground">Alt Pozisyon</Label>
                            <span className={`text-xs font-medium ${panelText}`}>{settings.gradientPosition}%</span>
                          </div>
                          <Slider value={[settings.gradientPosition]} onValueChange={([v]) => updateSetting("gradientPosition", v)} min={0} max={100} step={1} />
                        </div>
                        
                        {/* Dark Theme Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">Siyah Tema</span>
                          <button
                            onClick={() => updateSetting("darkTheme", !settings.darkTheme)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings.darkTheme ? "bg-primary" : "bg-muted"}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.darkTheme ? "translate-x-5" : "translate-x-1"}`} />
                          </button>
                        </div>
                      </>
                    )}
                    
                    {/* Yana Kaydır Settings - post only */}
                    {format === "post" && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Yana Kaydır</span>
                          <button
                            onClick={() => updateSetting("showSwipe", !(settings.showSwipe ?? true))}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${(settings.showSwipe ?? true) ? "bg-primary" : "bg-muted"}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${(settings.showSwipe ?? true) ? "translate-x-5" : "translate-x-1"}`} />
                          </button>
                        </div>
                        {(settings.showSwipe ?? true) && (
                          <>
                            <div className="space-y-1 mt-2">
                              <div className="flex justify-between text-xs">
                                <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Yatay (Sağdan %)</span>
                                <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.swipeX ?? 88}%</span>
                              </div>
                              <input type="range" min="0" max="100" value={settings.swipeX ?? 88} onChange={(e) => updateSetting("swipeX", Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Dikey (Alttan %)</span>
                                <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.swipeY ?? 88}%</span>
                              </div>
                              <input type="range" min="0" max="100" value={settings.swipeY ?? 88} onChange={(e) => updateSetting("swipeY", Number(e.target.value))} className="w-full" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Boyut</span>
                                <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.swipeSize ?? 120}px</span>
                              </div>
                              <input type="range" min="40" max="400" value={settings.swipeSize ?? 120} onChange={(e) => updateSetting("swipeSize", Number(e.target.value))} className="w-full" />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Export Button */}
            <Button onClick={exportPNG} size="lg" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="h-5 w-5" />
              PNG İndir ({formatConfig.label})
            </Button>
          </div>
        </div>



        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-auto rounded-xl shadow-2xl ${panelTheme === "dark" ? "bg-gray-800" : "bg-white"}`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-4 border-b ${panelTheme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <h2 className={`text-xl font-bold ${panelTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {format === "storyText" ? "Story Metin Ayarlari" : format === "reelsCover" ? "Reels Kapak Ayarlari" : "Post Ayarlari"}
                  {isLocked && <span className="ml-2 text-sm text-orange-500">🔒 Kilitli</span>}
                </h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`p-2 rounded-lg hover:bg-gray-100 ${panelTheme === "dark" ? "hover:bg-gray-700 text-gray-400" : "text-gray-500"}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content - 2 Columns */}
              <div className="grid lg:grid-cols-2 gap-6 p-6" style={{ opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                {/* Left - Preview (birebir ana preview ile aynı) */}
                <div className="flex flex-col items-center justify-center h-full">
                  <h3 className={`text-sm font-semibold mb-3 ${panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Onizleme</h3>
                  <div
                    className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg"
                    style={{
                      width: "240px",
                      aspectRatio: `${FORMATS[format].width} / ${FORMATS[format].height}`,
                    }}
                  >
                    {/* Background */}
                    <div className="absolute inset-0">
                      {format === "storyText" ? (
                        <img src="/resimsiz-haber-bg.png" alt="Arka plan" className="h-full w-full object-cover" />
                      ) : (
                        <img
                          src={image || "/default-bg.webp"}
                          alt="Arka plan"
                          className="absolute inset-0 w-full h-full"
                          style={{
                            objectFit: "cover",
                            objectPosition: `${settings.imageOffsetX ?? 50}% ${settings.imageOffsetY ?? 50}%`,
                            transform: `scale(${(settings.imageScale ?? 100) / 100})`,
                            transformOrigin: `${settings.imageOffsetX ?? 50}% ${settings.imageOffsetY ?? 50}%`,
                            filter: settings.imageBlur > 0 ? `blur(${settings.imageBlur * 0.15}px)` : "none"
                          }}
                        />
                      )}
                    </div>

                    {/* Background color overlay (same as main) */}
                    <div className="absolute inset-0" style={{ backgroundColor: (settings.darkTheme ?? false) ? "#000000" : (settings.gradientColor1 ?? "#04041e") }} />

                    {/* Gradient Overlays - birebir ana preview ile aynı */}
                    {format === "storyText" ? (
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(${gradientRGB},${settings.gradientOpacity / 100})` }} />
                    ) : (
                      <>
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, rgba(${gradientRGB},${settings.topGradientOpacity / 100}) 0%, rgba(${gradientRGB},0) 50%)` }} />
                        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, transparent ${settings.gradientPosition}%, rgba(${gradientRGB},${(settings.gradientOpacity / 100) * 0.85}) ${(settings.gradientPosition + 100) / 2}%, rgba(${gradientRGB},${settings.gradientOpacity / 100}) 100%)` }} />
                      </>
                    )}

                    {/* StoryText Badge */}
                    {format === "storyText" && (
                      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "38%" }}>
                        <img src="/sondakika-badge.png" alt="SON DAKİKA" className="h-4" />
                      </div>
                    )}

                    {/* Logo */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        top: `${(settings.logoY / FORMATS[format].height) * 100}%`,
                        left: `${(settings.logoX / FORMATS[format].width) * 100}%`,
                        width: `${(settings.logoSize / FORMATS[format].width) * 100}%`,
                      }}
                    >
                      <img
                        src={format === "storyText" ? "/pusholder-logo.png" : "/bell-logo.png"}
                        alt="Logo"
                        className="w-full h-auto block"
                      />
                    </div>

                    {/* Sol Cizgi - sadece post */}
                    {format === "post" && (() => {
                      const lineStartY = settings.dividerStartY ?? 230
                      const lineEndY = FORMATS.post.height - (settings.textY ?? 240) - 130 - 30
                      if (lineEndY > lineStartY + 30) {
                        return (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: `${(72 / FORMATS.post.width) * 100}%`,
                              top: `${(lineStartY / FORMATS.post.height) * 100}%`,
                              width: "1px",
                              height: `${((lineEndY - lineStartY) / FORMATS.post.height) * 100}%`,
                              background: "rgba(255,255,255,0.3)",
                            }}
                          />
                        )
                      }
                      return null
                    })()}

                    {/* Text */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${(settings.textX / FORMATS[format].width) * 100}%`,
                        right: `${(settings.textRight / FORMATS[format].width) * 100}%`,
                        ...(format === "storyText"
                          ? { top: "50%", transform: `translateY(calc(-50% + ${(settings.textY / FORMATS[format].height) * 100}%))` }
                          : { bottom: `${(settings.textY / FORMATS[format].height) * 100}%` }
                        ),
                        fontFamily: `'${settings.fontFamily ?? "Gilroy-Bold"}', 'Gilroy', sans-serif`,
                        fontSize: `${((settings.fontSize ?? 48) / FORMATS[format].width) * 240}px`,
                        fontWeight: settings.fontWeight,
                        fontStyle: settings.fontStyle || "normal",
                        lineHeight: "1.25",
                        color: "#ffffff",
                        textAlign: (format === "storyText" || format === "reelsCover") ? ((settings.textAlign ?? "left") as "left" | "center" | "right") : "left",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        textTransform: format === "reelsCover" ? "uppercase" : "none",
                      }}
                    >
                      {renderFormattedPreview(fullText)}
                      {format === "storyText" && (
                        <div style={{ marginTop: "6%", width: "100%", height: "2px", backgroundColor: "#e63535", borderRadius: "2px" }} />
                      )}
                    </div>

                    {/* Swipe Indicator - modal preview */}
                    {format === "post" && (settings.showSwipe ?? true) && (
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          right: `${100 - (settings.swipeX ?? 88)}%`,
                          bottom: `${100 - (settings.swipeY ?? 88)}%`,
                          width: `${((settings.swipeSize ?? 120) / FORMATS.post.width) * 240}px`,
                        }}
                      >
                        <img src="/yana-kaydir.png" alt="Yana Kaydir" className="w-full h-auto block" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right - Controls */}
                <div className="space-y-6">

                  {/* Gorsel Konum Ayarlari - storyText haric */}
                  {format !== "storyText" && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Görsel Konumu</h3>
                    <div className={`space-y-3 p-4 rounded-lg ${panelTheme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Yatay</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.imageOffsetX ?? 50}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={settings.imageOffsetX ?? 50} onChange={(e) => updateSetting("imageOffsetX", Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Dikey</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.imageOffsetY ?? 50}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={settings.imageOffsetY ?? 50} onChange={(e) => updateSetting("imageOffsetY", Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Yakınlaştır</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.imageScale ?? 100}%</span>
                        </div>
                        <input type="range" min="100" max="200" value={settings.imageScale ?? 100} onChange={(e) => updateSetting("imageScale", Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Logo Settings */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Logo Ayarlari</h3>
                    <div className={`space-y-3 p-4 rounded-lg ${panelTheme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Sol (X)</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const logoW = settings.logoSize ?? 120
                                updateSetting("logoX", Math.round((FORMATS[format].width - logoW) / 2))
                              }}
                              className="text-xs px-1.5 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                            >
                              Yatay Ortala
                            </button>
                            <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.logoX}px</span>
                          </div>
                        </div>
                        <input type="range" min="0" max={FORMATS[format].width} value={settings.logoX} onChange={(e) => updateSetting("logoX", Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Dikey Konum (Y)</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.logoY}px</span>
                        </div>
                        {/* Hizli preset butonlar */}
                        <div className="flex gap-1 mb-1">
                          <button
                            onClick={() => {
                              const logoW = settings.logoSize ?? 120
                              updateSetting("logoX", Math.round((FORMATS[format].width - logoW) / 2))
                              updateSetting("logoY", Math.round(FORMATS[format].height * 0.05))
                            }}
                            className={`flex-1 text-xs px-1 py-1 rounded transition ${panelTheme === "dark" ? "bg-gray-600 text-gray-300 hover:bg-blue-500 hover:text-white" : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"}`}
                          >
                            Ust Orta
                          </button>
                          <button
                            onClick={() => {
                              const logoW = settings.logoSize ?? 120
                              updateSetting("logoX", Math.round((FORMATS[format].width - logoW) / 2))
                              updateSetting("logoY", Math.round((FORMATS[format].height - logoW) / 2))
                            }}
                            className={`flex-1 text-xs px-1 py-1 rounded transition ${panelTheme === "dark" ? "bg-gray-600 text-gray-300 hover:bg-blue-500 hover:text-white" : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"}`}
                          >
                            Orta
                          </button>
                          <button
                            onClick={() => {
                              const logoW = settings.logoSize ?? 120
                              updateSetting("logoX", Math.round((FORMATS[format].width - logoW) / 2))
                              updateSetting("logoY", Math.round(FORMATS[format].height - logoW - (FORMATS[format].height * 0.05)))
                            }}
                            className={`flex-1 text-xs px-1 py-1 rounded transition ${panelTheme === "dark" ? "bg-gray-600 text-gray-300 hover:bg-blue-500 hover:text-white" : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"}`}
                          >
                            Alt Orta
                          </button>
                        </div>
                        <input type="range" min="0" max={FORMATS[format].height} value={settings.logoY} onChange={(e) => updateSetting("logoY", Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Boyut</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.logoSize}px</span>
                        </div>
                        <input type="range" min="50" max={FORMATS[format].width} value={settings.logoSize} onChange={(e) => updateSetting("logoSize", Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                  </div>

                  {/* Yana Kaydır Ayarları - sadece post */}
                  {format === "post" && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Yana Kaydır</h3>
                    <div className={`space-y-3 p-4 rounded-lg ${panelTheme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Göster</span>
                        <button
                          onClick={() => updateSetting("showSwipe", !(settings.showSwipe ?? true))}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${(settings.showSwipe ?? true) ? "bg-green-500 text-white" : panelTheme === "dark" ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"}`}
                        >
                          {(settings.showSwipe ?? true) ? "Açık" : "Kapalı"}
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Yatay Konum (Sağdan %)</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.swipeX ?? 88}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={settings.swipeX ?? 88} onChange={(e) => updateSetting("swipeX", Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Dikey Konum (Alttan %)</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.swipeY ?? 88}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={settings.swipeY ?? 88} onChange={(e) => updateSetting("swipeY", Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Boyut</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.swipeSize ?? 120}px</span>
                        </div>
                        <input type="range" min="40" max="400" value={settings.swipeSize ?? 120} onChange={(e) => updateSetting("swipeSize", Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Text Settings */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Metin Ayarlari</h3>
                    <div className={`space-y-3 p-4 rounded-lg ${panelTheme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                      {/* Font Size */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Punto (Font Boyutu)</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.fontSize ?? 48}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="120"
                          value={settings.fontSize ?? 48}
                          onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Font Style */}
                      <div className="space-y-2">
                        <span className={`text-xs ${panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Metin Stili</span>
                        <div className="flex gap-2">
                          {["normal", "italic"].map((style) => (
                            <button
                              key={style}
                              onClick={() => updateSetting("fontStyle", style)}
                              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                                settings.fontStyle === style
                                  ? "bg-blue-500 text-white"
                                  : panelTheme === "dark"
                                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                              style={{ fontStyle: style as "normal" | "italic" }}
                            >
                              {style === "normal" ? "Normal" : "Italik"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Family */}
                      <div className="space-y-2">
                        <span className={`text-xs ${panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Font</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["Gilroy-Light", "Gilroy-Regular", "Gilroy-Medium", "Gilroy-Bold", "Gilroy-Heavy"] as const).map((family) => (
                            <button
                              key={family}
                              onClick={() => updateSetting("fontFamily", family)}
                              className={`px-2 py-1.5 rounded text-xs transition ${
                                (settings.fontFamily ?? "Gilroy-Bold") === family
                                  ? "bg-blue-500 text-white"
                                  : panelTheme === "dark"
                                  ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                              style={{ fontFamily: `'${family}', sans-serif` }}
                            >
                              {family}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text Alignment - storyText ve reelsCover */}
                      {(format === "storyText" || format === "reelsCover") && (
                        <div className="space-y-2">
                          <span className={`text-xs ${panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Metin Hizalamasi</span>
                          <div className="flex gap-2">
                            {["left", "center", "right"].map((align) => (
                              <button
                                key={align}
                                onClick={() => updateSetting("textAlign", align)}
                                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                                  settings.textAlign === align
                                    ? "bg-blue-500 text-white"
                                    : panelTheme === "dark"
                                    ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                              >
                                {align === "left" ? "Sol" : align === "center" ? "Orta" : "Sag"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* storyText ve reelsCover icin ayri kontroller */}
                      {(format === "storyText" || format === "reelsCover") ? (
                        <>
                          {/* Sol (X) */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Sol Bosluk (X)</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const centered = Math.round((FORMATS[format].width - (FORMATS[format].width - settings.textX - settings.textRight)) / 2)
                                    updateSetting("textX", centered)
                                    updateSetting("textRight", centered)
                                  }}
                                  className="text-xs px-1.5 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                                >
                                  Simetrik Yap
                                </button>
                                <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.textX}px</span>
                              </div>
                            </div>
                            <input type="range" min="0" max={FORMATS[format].width / 2} value={settings.textX} onChange={(e) => updateSetting("textX", Number(e.target.value))} className="w-full" />
                          </div>
                          {/* Sag */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Sag Bosluk</span>
                              <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.textRight}px</span>
                            </div>
                            <input type="range" min="0" max={FORMATS[format].width / 2} value={settings.textRight} onChange={(e) => updateSetting("textRight", Number(e.target.value))} className="w-full" />
                          </div>
                          {/* Dikey Konum */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>
                                {format === "storyText" ? "Dikey Konum (0 = tam orta)" : "Alt (Y)"}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateSetting("textY", format === "storyText" ? 0 : 200)}
                                  className="text-xs px-1.5 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600"
                                >
                                  {format === "storyText" ? "Ortala" : "Sifirla"}
                                </button>
                                <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.textY}px</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={format === "storyText" ? -FORMATS.storyText.height / 2 : 100}
                              max={format === "storyText" ? FORMATS.storyText.height / 2 : FORMATS[format].height - 100}
                              value={settings.textY}
                              onChange={(e) => updateSetting("textY", Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Diger formatlar icin kenar boslugu */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Kenar Boslugu (Sol & Sag)</span>
                              <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.textX}px</span>
                            </div>
                            <input
                              type="range" min="0" max="300"
                              value={settings.textX}
                              onChange={(e) => {
                                const v = Number(e.target.value)
                                updateSetting("textX", v)
                                updateSetting("textRight", v)
                              }}
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Alt (Y)</span>
                              <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.textY}px</span>
                            </div>
                            <input type="range" min="100" max={FORMATS[format].height - 100} value={settings.textY} onChange={(e) => updateSetting("textY", Number(e.target.value))} className="w-full" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Divider - sadece post */}
                  {format === "post" && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Sol Cizgi Ayarlari</h3>
                    <div className={`space-y-3 p-4 rounded-lg ${panelTheme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Ustten Baslangic</span>
                          <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.dividerStartY ?? 230}px</span>
                        </div>
                        <input type="range" min="0" max="800" value={settings.dividerStartY ?? 230} onChange={(e) => updateSetting("dividerStartY", Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Gradient Ayarlari - tum formatlarda */}
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Gradient Ayarlari</h3>
                    <div className={`space-y-3 p-4 rounded-lg ${panelTheme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                      {format === "storyText" ? (
                        /* Story Metin: sadece opaklık */
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Opaklık %</span>
                            <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.gradientOpacity}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={settings.gradientOpacity} onChange={(e) => updateSetting("gradientOpacity", Number(e.target.value))} className="w-full" />
                        </div>
                      ) : (
                        /* Post + Reels Kapak: alt/ust/pozisyon */
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Alt Gradient %</span>
                              <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.gradientOpacity}%</span>
                            </div>
                            <input type="range" min="0" max="100" value={settings.gradientOpacity} onChange={(e) => updateSetting("gradientOpacity", Number(e.target.value))} className="w-full" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Gradient Pozisyon %</span>
                              <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.gradientPosition}%</span>
                            </div>
                            <input type="range" min="0" max="100" value={settings.gradientPosition} onChange={(e) => updateSetting("gradientPosition", Number(e.target.value))} className="w-full" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}>Ust Gradient %</span>
                              <span className={panelTheme === "dark" ? "text-gray-300" : "text-gray-700"}>{settings.topGradientOpacity}%</span>
                            </div>
                            <input type="range" min="0" max="100" value={settings.topGradientOpacity} onChange={(e) => updateSetting("topGradientOpacity", Number(e.target.value))} className="w-full" />
                          </div>
                        </>
                      )}
                      {/* Siyah Mod */}
                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: panelTheme === "dark" ? "#4b5563" : "#d1d5db" }}>
                        <span className={`text-xs ${panelTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Siyah Mod</span>
                        <button
                          onClick={() => updateSetting("darkTheme", !(settings.darkTheme ?? false))}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            (settings.darkTheme ?? false)
                              ? "bg-blue-500 text-white"
                              : panelTheme === "dark"
                              ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {(settings.darkTheme ?? false) ? "Açık" : "Kapalı"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex justify-between gap-3 p-4 border-t ${panelTheme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <button
                  onClick={() => {
                    if (window.confirm("Tüm veriler silinecek. Emin misiniz?")) {
                      clearAllData()
                      setShowSettingsModal(false)
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${panelTheme === "dark" ? "bg-red-900 text-red-200 hover:bg-red-800" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                >
                  Çerezleri Temizle
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAllSettings(prev => ({ ...prev, [format]: DEFAULT_SETTINGS[format] }))
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${panelTheme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Varsayilana Sifirla
                  </button>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Kapat
                  </button>
                  {isLocked ? (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              formatType: format,
                              settings: allSettings[format],
                              locked: false
                            })
                          })
                          if (res.ok) {
                            setAllLocked(prev => ({ ...prev, [format]: false }))
                          }
                        } catch (err) {
                          console.error("Failed to unlock:", err)
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600"
                    >
                      Kilidi Aç
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              formatType: format,
                              settings: allSettings[format],
                              locked: true
                            })
                          })
                          if (res.ok) {
                            setAllLocked(prev => ({ ...prev, [format]: true }))
                            setShowSettingsModal(false)
                          }
                        } catch (err) {
                          console.error("Failed to save and lock:", err)
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600"
                    >
                      Kaydet & Kilitle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
