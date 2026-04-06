-- Insert default templates for each format
-- These are the production-ready default settings

-- Post Format Default Template (1080x1350)
INSERT INTO public.templates (name, format, settings, text_content, is_default) VALUES (
  'Post Varsayilan',
  'post',
  '{
    "logoX": 40,
    "logoY": 50,
    "logoSize": 90,
    "textX": 72,
    "textRight": 72,
    "textY": 240,
    "gradientOpacity": 90,
    "gradientPosition": 45,
    "topGradientOpacity": 40,
    "imageBlur": 0,
    "fontWeight": "700",
    "darkTheme": false,
    "dividerStartY": 230,
    "dividerGap": 40,
    "dividerBottomY": 1100
  }',
  'Besiktas''da Hyeon-gyu Oh, mac oncesi yine ciplak ayaklarla sahaya cikti.',
  true
) ON CONFLICT DO NOTHING;

-- Story Image Format Default Template (1080x1920)
INSERT INTO public.templates (name, format, settings, text_content, is_default) VALUES (
  'Story Gorsel Varsayilan',
  'storyImage',
  '{
    "logoX": 60,
    "logoY": 60,
    "logoSize": 120,
    "textX": 60,
    "textRight": 60,
    "textY": 180,
    "gradientOpacity": 90,
    "gradientPosition": 50,
    "topGradientOpacity": 35,
    "imageBlur": 0,
    "fontWeight": "700",
    "darkTheme": false,
    "dividerStartY": 0,
    "dividerGap": 0,
    "dividerBottomY": 0
  }',
  'Story gorsel metni buraya...',
  true
) ON CONFLICT DO NOTHING;

-- Story Text Format Default Template (1080x1920)
INSERT INTO public.templates (name, format, settings, text_content, is_default) VALUES (
  'Story Metin Varsayilan',
  'storyText',
  '{
    "logoX": 480,
    "logoY": 1750,
    "logoSize": 120,
    "textX": 80,
    "textRight": 80,
    "textY": 450,
    "gradientOpacity": 0,
    "gradientPosition": 0,
    "topGradientOpacity": 0,
    "imageBlur": 0,
    "fontWeight": "700",
    "darkTheme": false,
    "dividerStartY": 0,
    "dividerGap": 0,
    "dividerBottomY": 0
  }',
  'SON DAKIKA

Story metin icerigi buraya gelecek.',
  true
) ON CONFLICT DO NOTHING;

-- Reels Cover Format Default Template (1080x1920)
INSERT INTO public.templates (name, format, settings, text_content, is_default) VALUES (
  'Reels Kapak Varsayilan',
  'reelsCover',
  '{
    "logoX": 60,
    "logoY": 60,
    "logoSize": 120,
    "textX": 60,
    "textRight": 60,
    "textY": 200,
    "gradientOpacity": 85,
    "gradientPosition": 50,
    "topGradientOpacity": 30,
    "imageBlur": 0,
    "fontWeight": "700",
    "darkTheme": false,
    "dividerStartY": 0,
    "dividerGap": 0,
    "dividerBottomY": 0
  }',
  'Reels kapak metni buraya...',
  true
) ON CONFLICT DO NOTHING;
