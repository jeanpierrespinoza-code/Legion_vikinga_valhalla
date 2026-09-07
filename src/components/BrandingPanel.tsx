import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { DEFAULT_BRANDING, type BrandingSettings } from '@/lib/types';
import { Palette, Upload, RotateCcw, ImageIcon, Check } from 'lucide-react';

export function BrandingPanel() {
  const { branding, updateBranding, resetBranding, uploadPhoto } = useApp();
  const [draft, setDraft] = useState<BrandingSettings>(branding);
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(branding);
    setLogoPreview(branding.logoUrl);
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const fileName = `logo/club-logo.${ext}`;
    const publicUrl = await uploadPhoto(file, fileName);

    if (publicUrl) {
      setDraft((d) => ({ ...d, logoUrl: publicUrl }));
      setLogoPreview(publicUrl);
    }
    setUploading(false);
  };

  const handleLogoUrl = (url: string) => {
    setDraft((d) => ({ ...d, logoUrl: url || null }));
    setLogoPreview(url || null);
  };

  const handleSave = async () => {
    await updateBranding(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = async () => {
    await resetBranding();
    setDraft(DEFAULT_BRANDING);
    setLogoPreview(null);
  };

  const colorFields: { key: keyof BrandingSettings; label: string; desc: string }[] = [
    { key: 'primaryColor', label: 'Color Primario', desc: 'Acentos, botones y resaltados' },
    { key: 'secondaryColor', label: 'Color Secundario', desc: 'Tarjetas y paneles' },
    { key: 'textColor', label: 'Color de Texto', desc: 'Texto y bordes' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Logo section */}
      <div className="bg-slate-900/60 border border-amber-900/40 rounded-2xl p-6">
        <h3 className="font-viking text-sm font-bold text-amber-400 mb-1 uppercase tracking-wide flex items-center gap-2">
          <ImageIcon size={16} />
          Logo del Club
        </h3>
        <p className="text-slate-500 text-xs mb-5">
          Sube una imagen (PNG, JPG, SVG) o ingresa una URL. Aparecerá en el encabezado y pie de página.
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Preview */}
          <div className="flex-shrink-0">
            <div className="w-28 h-28 rounded-2xl bg-slate-950 border-2 border-amber-900/40 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={32} className="mx-auto text-slate-700 mb-1" />
                  <p className="text-slate-700 text-[10px]">Sin logo</p>
                </div>
              )}
            </div>
            {uploading && (
              <p className="text-amber-400 text-xs mt-2 text-center animate-pulse">Subiendo...</p>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-3">
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-lg bg-amber-600 text-slate-900 font-semibold text-sm hover:bg-amber-500 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                Subir archivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">O ingresa una URL de imagen</label>
              <input
                type="text"
                value={draft.logoUrl ?? ''}
                onChange={(e) => handleLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Color pickers */}
      <div className="bg-slate-900/60 border border-amber-900/40 rounded-2xl p-6">
        <h3 className="font-viking text-sm font-bold text-amber-400 mb-1 uppercase tracking-wide flex items-center gap-2">
          <Palette size={16} />
          Paleta de Colores
        </h3>
        <p className="text-slate-500 text-xs mb-5">
          Personaliza los colores de toda la interfaz. Los cambios se aplican dinámicamente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {colorFields.map((field) => (
            <div key={field.key} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{field.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{field.desc}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg border-2 border-slate-600 shadow-inner"
                  style={{ backgroundColor: draft[field.key] as string }}
                />
              </div>
              <input
                type="color"
                value={draft[field.key] as string}
                onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                className="w-full h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700"
              />
              <input
                type="text"
                value={draft[field.key] as string}
                onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                className="w-full mt-2 bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-600"
              />
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="mt-5 pt-5 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-3 uppercase tracking-wide">Vista previa</p>
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: draft.secondaryColor,
              borderColor: `${draft.primaryColor}40`,
              color: draft.textColor,
            }}
          >
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: draft.primaryColor, color: draft.secondaryColor }}
                >
                  V
                </div>
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: draft.primaryColor }}>
                  VALHALLA
                </p>
                <p className="text-xs opacity-60">Legión Vikinga</p>
              </div>
              <button
                className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: draft.primaryColor, color: draft.secondaryColor }}
              >
                Botón de ejemplo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-amber-600 text-slate-900 font-semibold text-sm hover:bg-amber-500 transition-colors flex items-center gap-2"
        >
          <Check size={16} />
          {saved ? 'Guardado!' : 'Guardar cambios'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-400 font-medium text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={15} />
          Restablecer colores por defecto
        </button>
      </div>
    </div>
  );
}
