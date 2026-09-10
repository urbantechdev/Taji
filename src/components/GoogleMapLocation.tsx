import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, Share2, Check, Compass, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Factory Coordinates: Nairobi, Jagoo Lane / Jagoo Road area
const FACTORY_COORDS = { lat: -1.2921, lng: 36.8219 };
// Exact Tewaw Location Link
const GOOGLE_MAPS_SEARCH_URL = 'https://share.google/M7dvWHTuFItX3Uhjb';
const GOOGLE_MAPS_DIR_URL = 'https://share.google/M7dvWHTuFItX3Uhjb';
const EMBED_MAP_URL = `https://maps.google.com/maps?q=${FACTORY_COORDS.lat},${FACTORY_COORDS.lng}&z=16&output=embed`;

function MapMarkerWithInfo() {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={FACTORY_COORDS}
        onClick={() => setIsOpen(true)}
        title="Tewaw Enterprise Limited - Nairobi Factory"
      >
        <Pin background="#EA4335" borderColor="#B31412" glyphColor="#FFFFFF" />
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow anchor={marker} onCloseClick={() => setIsOpen(false)}>
          <div className="p-2 max-w-xs font-sans">
            <div className="flex items-center gap-1.5 text-brand-orange font-black text-[10px] uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5" /> Garment Factory
            </div>
            <h4 className="font-bold text-slate-900 text-sm leading-snug">Tewaw Enterprise Limited</h4>
            <p className="text-xs text-slate-600 mt-1">P.O. Box 13653 - 00400 Jagoo Lane, Uhuru Market, Nairobi</p>
            <a
              href={GOOGLE_MAPS_DIR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-brand-orange transition-colors"
            >
              Get Directions <Navigation className="w-3 h-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface GoogleMapLocationProps {
  className?: string;
  showCardDetails?: boolean;
}

export default function GoogleMapLocation({ className = '', showCardDetails = true }: GoogleMapLocationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(GOOGLE_MAPS_SEARCH_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`w-full bg-white rounded-[32px] border border-slate-200/80 overflow-hidden shadow-sm ${className}`}>
      {/* Location Header Strip */}
      {showCardDetails && (
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange shrink-0 mt-0.5">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-green/20 text-brand-green text-[9px] font-black uppercase tracking-widest border border-brand-green/30">
                  Live Factory Location
                </span>
              </div>
              <h3 className="text-lg font-display font-black text-white uppercase tracking-tight mt-1">
                Tewaw Enterprise Factory
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                P.O. Box 13653 - 00400 Jagoo Lane, Uhuru Market, Nairobi, Kenya
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={GOOGLE_MAPS_DIR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-orange hover:bg-[#d83522] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-orange/20"
            >
              <Navigation className="w-4 h-4" /> Directions
            </a>
            <a
              href={GOOGLE_MAPS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <ExternalLink className="w-4 h-4" /> Open Maps
            </a>
            <button
              onClick={handleCopyLocation}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 shrink-0"
              title="Copy Location Link"
            >
              {copied ? <Check className="w-4 h-4 text-brand-green" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Map Viewport Area */}
      <div className="relative w-full h-[380px] sm:h-[450px] bg-slate-100">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={FACTORY_COORDS}
              defaultZoom={15}
              mapId="TEWAW_FACTORY_MAP"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
            >
              <MapMarkerWithInfo />
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full relative">
            <iframe
              title="Tewaw Enterprise Google Map Location"
              src={EMBED_MAP_URL}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Overlay Navigation Button */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              <a
                href={GOOGLE_MAPS_SEARCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl backdrop-blur-md transition-all border border-white/20"
              >
                <Compass className="w-4 h-4 text-brand-orange" /> Open in Google Maps
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      {showCardDetails && (
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
            <span className="font-bold text-slate-700">Factory Open:</span> Mon - Fri: 08:00 AM - 05:00 PM | Sat: 09:00 AM - 01:00 PM
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:+254736619688"
              className="font-mono font-bold text-brand-blue hover:text-brand-orange transition-colors"
            >
              +254 736 619 688
            </a>
            <span className="text-slate-300">|</span>
            <a
              href="mailto:tewawenterprises@gmail.com"
              className="font-mono font-bold text-brand-blue hover:text-brand-orange transition-colors"
            >
              tewawenterprises@gmail.com
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
