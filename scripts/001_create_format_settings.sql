-- Format Settings Table
-- Her format tipi (post, storyText, reelsCover) icin ayarlar tutar
-- locked = true olunca ayarlar degistirilemez

CREATE TABLE IF NOT EXISTS format_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format_type TEXT NOT NULL UNIQUE CHECK (format_type IN ('post', 'storyText', 'reelsCover')),
  settings JSONB NOT NULL DEFAULT '{}',
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default kayitlar ekle
INSERT INTO format_settings (format_type, settings, locked) VALUES
  ('post', '{"logoX":90,"logoY":90,"logoSize":500,"textX":80,"textRight":0,"textY":240,"fontSize":48,"fontStyle":"normal","gradientOpacity":100,"gradientPosition":45,"topGradientOpacity":50,"imageBlur":0,"fontWeight":"700","darkTheme":false,"dividerStartY":230,"dividerGap":40,"dividerBottomY":900,"gradientColor1":"#04041e","gradientColor2":"#4F46E5"}', false),
  ('storyText', '{"logoX":90,"logoY":1700,"logoSize":900,"textX":80,"textRight":80,"textY":0,"fontSize":56,"fontStyle":"normal","textAlign":"center","gradientOpacity":50,"gradientPosition":0,"topGradientOpacity":0,"imageBlur":0,"fontWeight":"700","darkTheme":false,"dividerStartY":0,"dividerGap":0,"dividerBottomY":0,"gradientColor1":"#04041e","gradientColor2":"#04041e"}', false),
  ('reelsCover', '{"logoX":480,"logoY":60,"logoSize":120,"textX":40,"textRight":40,"textY":180,"fontSize":36,"fontStyle":"italic","textAlign":"center","gradientOpacity":100,"gradientPosition":50,"topGradientOpacity":40,"imageBlur":0,"fontWeight":"700","darkTheme":false,"dividerStartY":0,"dividerGap":0,"dividerBottomY":0,"gradientColor1":"#04041e","gradientColor2":"#04041e"}', false)
ON CONFLICT (format_type) DO NOTHING;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS format_settings_updated_at ON format_settings;
CREATE TRIGGER format_settings_updated_at
  BEFORE UPDATE ON format_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
